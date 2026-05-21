"""
StelarGenie world generation pipeline.

Builds navigable generated environments from a single photo:
  1. Scene analysis      — Gemini 2.5 Pro extracts spatial structure
  2. Anchor frames       — Imagen 3 generates 6 additional perspectives
  3. Directional clips   — OpenRouter video models generate per-action clips
  4. Navigation graph    — assembled from clips, stored in Redis
"""

import asyncio
import base64
import json
import logging
import uuid
from datetime import datetime, timezone, timedelta
from typing import Any

import httpx

logger = logging.getLogger(__name__)

# ─── Model Registry ───────────────────────────────────────────────────────────

OPENROUTER_BASE = "https://openrouter.ai/api/v1"

TIER_MODELS: dict[str, str] = {
    "standard":     "alibaba/wan-2.6",
    "standard_ref": "x-ai/grok-imagine-video",
    "premium":      "kwaivgi/kling-video-v3-pro",
    "showcase":     "google/veo-3.1",
}

MODEL_FALLBACK: dict[str, str] = {
    "x-ai/grok-imagine-video":    "google/veo-3.1-lite",
    "kwaivgi/kling-video-v3-pro": "x-ai/grok-imagine-video",
    "alibaba/wan-2.6":            "google/veo-3.1-lite",
    "google/veo-3.1":             "google/veo-3.1-fast",
}

# ─── Action Definitions ───────────────────────────────────────────────────────

ACTION_CAMERA_PROMPTS: dict[str, str] = {
    "forward":    "Slow cinematic dolly push forward through the scene. Smooth continuous motion, no cuts.",
    "backward":   "Slow cinematic dolly pull back from the scene. Smooth continuous motion, no cuts.",
    "pan_left":   "Smooth camera pan left, revealing what is to the left of the original frame. No cuts.",
    "pan_right":  "Smooth camera pan right, revealing what is to the right of the original frame. No cuts.",
    "look_up":    "Camera tilts upward slowly, revealing the ceiling or sky above the scene.",
    "look_down":  "Camera tilts downward slowly, revealing the floor or ground of the scene.",
    "turn_left":  "Camera pivots left, revealing the adjacent wall or new direction of the space.",
    "turn_right": "Camera pivots right, revealing the adjacent wall or new direction of the space.",
}

# Pairs where the exit frame of one should match the entry frame of the other
BOUNDARY_PAIRS: list[tuple[str, str]] = [
    ("forward", "backward"),
    ("pan_left", "pan_right"),
    ("look_up", "look_down"),
    ("turn_left", "turn_right"),
]

SCENE_ANALYSIS_SYSTEM = (
    "You are a spatial intelligence model. Analyze the provided image and return structured JSON. "
    "Identify: scene type, depth layers (foreground/midground/background objects), lighting conditions, "
    "which camera directions are physically navigable vs blocked, and a concise spatial description "
    "suitable for prompting a video generation model. "
    "Return ONLY valid JSON, no markdown, no code fences."
)

SCENE_ANALYSIS_SCHEMA = """
{
  "scene_type": "interior_living_room|interior_kitchen|interior_bedroom|exterior_front|exterior_back|exterior_street|event_venue|outdoor_space|other",
  "depth_layers": ["foreground: ...", "midground: ...", "background: ..."],
  "lighting": "string — describe quality, direction, temperature of light",
  "spatial_description": "string — 2-3 sentences, suitable for video generation prompt",
  "navigable_actions": ["forward", "pan_left", "pan_right"],
  "blocked_actions": ["backward"],
  "suggested_clip_duration": 4,
  "aspect_ratio": "16:9|9:16|1:1|4:3"
}
"""

ANCHOR_PROMPTS = [
    "Shift perspective slightly to the left while keeping the same room and lighting. Subtle angle change only.",
    "Shift perspective slightly to the right while keeping the same room and lighting. Subtle angle change only.",
    "Tilt the camera slightly upward, revealing a bit more ceiling while keeping the room identical.",
    "Tilt the camera slightly downward, revealing a bit more floor while keeping the room identical.",
    "Nudge the camera slightly forward into the scene. Same room, same lighting, just closer.",
    "Same composition in a slightly different moment of light — cloud shift or subtle natural light change.",
]


# ─── Stage 1: Scene Analysis ─────────────────────────────────────────────────

async def analyze_scene(
    image_bytes: bytes,
    context: dict[str, Any],
    google_api_key: str,
) -> dict:
    try:
        from google import genai
        from google.genai import types as genai_types
    except ImportError as exc:
        raise RuntimeError("google-genai not installed") from exc

    client = genai.Client(api_key=google_api_key)

    ctx_text = f"Context: {json.dumps(context)}" if context else ""
    parts = [
        genai_types.Part.from_bytes(data=image_bytes, mime_type="image/jpeg"),
        genai_types.Part.from_text(
            f"{ctx_text}\n\nAnalyze this image for spatial navigation.\n\nSchema:\n{SCENE_ANALYSIS_SCHEMA}"
        ),
    ]

    response = client.models.generate_content(
        model="gemini-2.5-flash",
        contents=[genai_types.Content(role="user", parts=parts)],
        config=genai_types.GenerateContentConfig(
            system_instruction=SCENE_ANALYSIS_SYSTEM,
            temperature=0.1,
            max_output_tokens=1000,
        ),
    )

    raw = (response.text or "").strip()
    if raw.startswith("```"):
        raw = raw.split("\n", 1)[1] if "\n" in raw else raw
        raw = raw.rsplit("```", 1)[0].strip()

    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        logger.warning("genie_scene_analysis_parse_failed raw=%s", raw[:200])
        return {
            "scene_type": "unknown",
            "depth_layers": [],
            "lighting": "natural light",
            "spatial_description": "A detailed interior or exterior space.",
            "navigable_actions": ["forward", "pan_left", "pan_right"],
            "blocked_actions": ["backward"],
            "suggested_clip_duration": 5,
            "aspect_ratio": "16:9",
        }


# ─── Stage 2: Anchor Frame Generation ────────────────────────────────────────

async def generate_anchor_frames(
    image_bytes: bytes,
    scene: dict,
    google_api_key: str,
) -> list[bytes]:
    """
    Generates 6 slightly-different perspectives via Gemini image editing.
    These + the original = 7 reference images for Grok Imagine Video's
    reference conditioning, anchoring spatial consistency across all clips.
    """
    try:
        from google import genai
        from google.genai import types as genai_types
    except ImportError as exc:
        raise RuntimeError("google-genai not installed") from exc

    client = genai.Client(api_key=google_api_key)
    spatial_ctx = scene.get("spatial_description", "")
    anchors: list[bytes] = []

    for prompt_text in ANCHOR_PROMPTS:
        try:
            full_prompt = (
                f"{prompt_text} "
                f"Scene context: {spatial_ctx}. "
                f"Preserve all subjects and objects exactly. Real photography quality."
            )
            response = client.models.generate_content(
                model="gemini-2.5-flash-preview-image-generation",
                contents=[
                    genai_types.Content(
                        role="user",
                        parts=[
                            genai_types.Part.from_bytes(data=image_bytes, mime_type="image/jpeg"),
                            genai_types.Part.from_text(full_prompt),
                        ],
                    )
                ],
                config=genai_types.GenerateContentConfig(
                    response_modalities=["IMAGE", "TEXT"],
                    temperature=0.3,
                ),
            )
            for part in response.candidates[0].content.parts:
                if part.inline_data and part.inline_data.mime_type.startswith("image/"):
                    anchors.append(part.inline_data.data)
                    break
        except Exception as exc:
            logger.warning("genie_anchor_frame_failed prompt=%s error=%s", prompt_text[:60], exc)

    logger.info("genie_anchors_generated count=%d", len(anchors))
    return anchors


# ─── Stage 3: Directional Clip Generation ────────────────────────────────────

async def generate_clip(
    action: str,
    source_image_bytes: bytes,
    reference_frames: list[bytes],
    scene: dict,
    openrouter_api_key: str,
    model: str,
    duration: int = 5,
) -> dict:
    camera_motion = ACTION_CAMERA_PROMPTS[action]
    spatial_desc = scene.get("spatial_description", "")
    lighting = scene.get("lighting", "")

    full_prompt = (
        f"{camera_motion} "
        f"Scene: {spatial_desc}. "
        f"Lighting: {lighting}. "
        f"Maintain exact visual consistency with all reference images. "
        f"Cinematic quality. No sudden jumps or cuts."
    )

    # Build content: source image first, then reference frames, then prompt
    content_parts: list[dict] = [
        {
            "type": "image_url",
            "image_url": {"url": f"data:image/jpeg;base64,{base64.b64encode(source_image_bytes).decode()}"},
        }
    ]
    # Add anchor frames as references (up to 6 additional = 7 total with source)
    for ref in reference_frames[:6]:
        content_parts.append({
            "type": "image_url",
            "image_url": {"url": f"data:image/jpeg;base64,{base64.b64encode(ref).decode()}"},
        })
    content_parts.append({"type": "text", "text": full_prompt})

    payload: dict[str, Any] = {
        "model": model,
        "messages": [{"role": "user", "content": content_parts}],
    }

    # Model-specific parameters
    if "kling" in model:
        payload["extra_body"] = {"duration": duration, "aspect_ratio": scene.get("aspect_ratio", "16:9")}
    elif "wan" in model or "grok" in model:
        payload["extra_body"] = {"duration": duration}
    elif "veo" in model:
        payload["extra_body"] = {"duration_seconds": duration}

    async with httpx.AsyncClient(timeout=300.0) as client:
        try:
            resp = await client.post(
                f"{OPENROUTER_BASE}/chat/completions",
                headers={
                    "Authorization": f"Bearer {openrouter_api_key}",
                    "HTTP-Referer": "https://stelar.app",
                    "X-Title": "StelarGenie",
                },
                json=payload,
            )
            resp.raise_for_status()
        except httpx.HTTPStatusError as exc:
            # Attempt fallback model
            fallback = MODEL_FALLBACK.get(model)
            if fallback:
                logger.warning("genie_clip_model_fallback model=%s fallback=%s action=%s", model, fallback, action)
                return await generate_clip(action, source_image_bytes, reference_frames, scene, openrouter_api_key, fallback, duration)
            raise

    data = resp.json()
    clip_b64, clip_url = _extract_video_from_response(data)

    return {
        "action": action,
        "model": model,
        "duration": duration,
        "clip_b64": clip_b64,
        "clip_url": clip_url,
        "status": "ready" if (clip_b64 or clip_url) else "failed",
    }


def _extract_video_from_response(data: dict) -> tuple[str | None, str | None]:
    """
    OpenRouter video responses can come back as base64 content, a video_url object,
    or a direct URL string. Handle all three formats.
    """
    try:
        choices = data.get("choices", [])
        if not choices:
            return None, None

        message = choices[0].get("message", {})
        content = message.get("content", "")

        # Format 1: content is a list of parts
        if isinstance(content, list):
            for part in content:
                if part.get("type") == "video_url":
                    return None, part["video_url"]["url"]
                if part.get("type") == "text" and part.get("text", "").startswith("data:video"):
                    raw = part["text"].split(",", 1)[1]
                    return raw, None

        # Format 2: content is a raw base64 data URI string
        if isinstance(content, str) and content.startswith("data:video"):
            raw = content.split(",", 1)[1]
            return raw, None

        # Format 3: content is a plain URL
        if isinstance(content, str) and content.startswith("http"):
            return None, content

    except Exception as exc:
        logger.warning("genie_video_extract_failed: %s", exc)

    return None, None


# ─── Stage 4: Full Session Build ─────────────────────────────────────────────

async def build_genie_session(
    session_id: str,
    image_bytes: bytes,
    context: dict,
    tier: str,
    google_api_key: str,
    openrouter_api_key: str,
    redis_client: Any,
) -> None:
    """
    Background task: runs all 4 pipeline stages and writes results to Redis.
    Called via FastAPI BackgroundTasks — does not block the HTTP response.
    """
    redis_key = f"genie:session:{session_id}"

    async def _update(patch: dict) -> None:
        raw = redis_client.get(redis_key)
        session = json.loads(raw) if raw else {}
        session.update(patch)
        redis_client.setex(redis_key, 7200, json.dumps(session))

    try:
        # Stage 1: scene analysis
        logger.info("genie_stage1_scene_analysis session=%s", session_id)
        scene = await analyze_scene(image_bytes, context, google_api_key)
        await _update({"scene_analysis": scene, "navigable_actions": scene.get("navigable_actions", [])})

        # Stage 2: anchor frames
        logger.info("genie_stage2_anchors session=%s", session_id)
        anchors = await generate_anchor_frames(image_bytes, scene, google_api_key)

        # Stage 3: directional clips (concurrent)
        model = TIER_MODELS.get(tier, TIER_MODELS["standard_ref"])
        navigable = scene.get("navigable_actions", ["forward", "pan_left", "pan_right"])
        duration = scene.get("suggested_clip_duration", 5)

        logger.info("genie_stage3_clips session=%s actions=%s model=%s", session_id, navigable, model)

        clip_tasks = {
            action: asyncio.create_task(
                generate_clip(action, image_bytes, anchors, scene, openrouter_api_key, model, duration)
            )
            for action in navigable
        }

        clips: dict[str, dict] = {}
        for action, task in clip_tasks.items():
            try:
                result = await task
                clips[action] = result
                await _update({"clips": clips})
                logger.info("genie_clip_ready session=%s action=%s", session_id, action)
            except Exception as exc:
                logger.error("genie_clip_failed session=%s action=%s: %s", session_id, action, exc, exc_info=True)
                clips[action] = {"action": action, "status": "failed", "error": str(exc)}

        all_ready = all(c.get("status") == "ready" for c in clips.values())
        await _update({
            "clips": clips,
            "status": "ready" if all_ready else "partial",
        })
        logger.info("genie_session_complete session=%s status=%s", session_id, "ready" if all_ready else "partial")

    except Exception as exc:
        logger.error("genie_session_failed session=%s: %s", session_id, exc, exc_info=True)
        await _update({"status": "failed", "error": str(exc)})
