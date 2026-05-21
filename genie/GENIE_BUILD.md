# StelarGenie — Reverse-Engineered World Model Build

**Date:** 2026-05-21  
**Scope:** Drop-in Genie 3 approximation using OpenRouter video models. Navigable, generated environments from a single photo. Used across StelarPeople (property tours), StelarVacay (neighborhood walks), and StelarVision (event scenes).

---

## 1. What Genie 3 Actually Does

Genie 3 is a **world model** — trained to predict what a scene looks like after a user takes an action (move forward, look left, etc.). It has three learned components:

| Component | What It Does |
|---|---|
| **Video Tokenizer** | Encodes frames into discrete tokens |
| **Latent Action Model (LAM)** | Discovers action tokens from optical flow between frames — no labels needed |
| **Dynamics Model** | Given current frame tokens + action token → predicts next frame tokens |

The LAM is the secret: it watches billions of video frames and learns that "these pixels moving this way = camera panning left." At inference, you give it a still image and it becomes a navigable world because it can simulate any action's result.

**Flow** = optical flow used to extract pseudo-action signals during training.  
**Stitch** = temporal stitching of generated frames into a continuous navigable sequence.

We can't train the LAM. We approximate all three components with models available today.

---

## 2. Our Approximations

| Genie Component | Our Approximation | Tool |
|---|---|---|
| Video Tokenizer | Scene understanding + spatial description | Gemini 2.5 Pro (vision) |
| Latent Action Model | Predefined action set + reference-conditioned generation | Grok Imagine Video (7-ref conditioning) |
| Dynamics Model | Directional video clip generation per action type | Grok Imagine Video / Kling v3.0 Pro |
| Temporal consistency | First-frame + last-frame control across clip boundaries | Kling v3.0 Pro |
| Optical Flow (training) | N/A — replaced by prompt-specified camera motion | — |
| Frame Stitching | Client-side WebGL clip graph with crossfade | Three.js / browser |

The critical difference from "just playing videos": **reference conditioning** means all directional clips are generated knowing about the same space. Moving left and then right returns you to a visually consistent starting point, not a hallucinated different room.

---

## 3. Model Selection

All models accessed via OpenRouter unified API (`https://openrouter.ai/api/v1`).

### Primary: Grok Imagine Video (xAI)
- **Why:** Reference-to-video with up to 7 reference images. This is the LAM approximation — the model generates clips that are visually anchored to the same space from any direction.
- **Specs:** 1–15s, 480p/720p, $0.05/sec
- **Use for:** All directional navigation clips (8 directions per scene)

### Primary: Kling v3.0 Pro (Kuaishou)
- **Why:** First-frame AND last-frame control. This solves stitching — we can force the end of "pan left" to visually match the start of "pan right," creating navigable loops without cuts.
- **Specs:** 3–15s, 16:9/9:16/1:1, native audio, $0.168/sec
- **Use for:** Boundary clips where two navigation directions need to connect

### High-Fidelity: Veo 3.1 (Google)
- **Why:** Scene extension up to 20 chained clips (140+ seconds), native audio, 1080p. For premium StelarVision event scenes and StelarPeople showcase tours.
- **Specs:** 1080p, $0.40/sec
- **Use for:** Premium output tier, long-form navigation

### Cost-Optimized: Alibaba Wan 2.6
- **Why:** Reference-to-video (like Grok), native audio-visual sync, $0.04/sec. Cheapest model with reference conditioning.
- **Specs:** 1080p, 24fps, up to 15s, $0.04/sec
- **Use for:** High-volume generation, batch event scrapbooks

### Fallback: Veo 3.1 Lite / Veo 3.1 Fast
- **Why:** Google-native, same SDK, native audio, $0.05–$0.10/sec
- **Use for:** Failover from Grok when reference conditioning isn't needed

---

## 4. The Pipeline

### 4.1 Overview

```
INPUT: 1 photo
  ↓
Stage 1: SCENE ANALYSIS (Gemini 2.5 Pro)
  → Structured scene description: room type, depth layers, surfaces, lighting, objects
  → Navigation context: what directions make sense (exterior = N/S/E/W, interior = room-relative)

Stage 2: ANCHOR FRAME GENERATION (Imagen 3)
  → Generate 6 additional perspectives of the same space
  → These + original = 7 reference images for Grok Imagine Video
  → Anchors spatial consistency across all directional clips

Stage 3: DIRECTIONAL CLIP GENERATION (Grok Imagine Video + Kling v3.0 Pro)
  → For each of 8 action types: generate a 4-6s video clip
  → Grok uses all 7 anchors as references → consistent world
  → Kling forces last-frame of clip N = first-frame of clip N+1

Stage 4: NAVIGATION GRAPH ASSEMBLY
  → Clips stored in S3/Blob
  → Graph: { forward: clip_id, left: clip_id, right: clip_id, ... }
  → Precomputed transition frames stored for instant crossfade

Stage 5: CLIENT DELIVERY
  → Navigation graph + presigned clip URLs → browser
  → GenieWorldViewer.tsx: WebGL player with directional input
  → User navigates; viewer plays correct clip, crossfades at boundary
```

### 4.2 Action Types

| Action Key | Camera Motion Prompt | Kling Boundary |
|---|---|---|
| `forward` | "Slow dolly push forward into the scene" | Exit frame → `backward` entry frame |
| `backward` | "Slow dolly pull back from the scene" | Exit frame → `forward` entry frame |
| `pan_left` | "Smooth camera pan left, revealing what's to the left" | Exit frame → `pan_right` entry frame |
| `pan_right` | "Smooth camera pan right, revealing what's to the right" | Exit frame → `pan_left` entry frame |
| `look_up` | "Tilt camera upward slowly, revealing ceiling/sky" | Exit frame → `look_down` entry frame |
| `look_down` | "Tilt camera downward slowly, revealing floor/ground" | Exit frame → `look_up` entry frame |
| `turn_left` | "Camera pivots left 90 degrees, new wall/direction revealed" | — |
| `turn_right` | "Camera pivots right 90 degrees, new wall/direction revealed" | — |

---

## 5. New Service: `genie_world.py`

Lives in `services/fullstack-gateway/app/services/genie_world.py`.

### 5.1 Stage 1: Scene Analysis

```python
async def analyze_scene_for_navigation(
    image_bytes: bytes,
    context: dict,          # { tour_type: "property"|"neighborhood"|"event", hints: {...} }
    api_key: str,
) -> dict:
    """
    Gemini 2.5 Pro analyzes the image and returns a structured scene description
    used to prompt all downstream video generation.
    """
    # Returns:
    # {
    #   "scene_type": "interior_living_room",
    #   "depth_layers": ["foreground: sofa", "midground: dining table", "background: window"],
    #   "lighting": "warm afternoon natural light from west window",
    #   "navigable_directions": ["forward", "pan_left", "pan_right", "look_up"],
    #   "blocked_directions": ["backward"],   # e.g., photographer is at the wall
    #   "spatial_description": "Open plan living room, hardwood floors...",
    #   "suggested_camera_start": "wide establishing shot from entrance"
    # }
```

### 5.2 Stage 2: Anchor Frame Generation

```python
async def generate_anchor_frames(
    original_bytes: bytes,
    scene_analysis: dict,
    api_key: str,           # Google AI key (Imagen 3)
    num_anchors: int = 6,   # + original = 7 refs for Grok
) -> list[bytes]:
    """
    Uses Imagen 3 to generate 6 slightly-different perspectives of the same space.
    These anchor frames give Grok Imagine Video a consistent spatial reference
    to condition all directional clips against.

    Prompts vary per anchor:
    - anchor_0: slight left shift, same room
    - anchor_1: slight right shift, same room
    - anchor_2: looking slightly up
    - anchor_3: looking slightly down
    - anchor_4: pushed slightly forward
    - anchor_5: same composition, different light moment
    """
```

### 5.3 Stage 3: Directional Clip Generation

```python
OPENROUTER_BASE = "https://openrouter.ai/api/v1"

GROK_VIDEO_MODEL = "x-ai/grok-imagine-video"
KLING_PRO_MODEL  = "kwaivgi/kling-video-v3-pro"
VEO_FAST_MODEL   = "google/veo-3.1-fast"
WAN_MODEL        = "alibaba/wan-2.6"

async def generate_directional_clip(
    action: str,                       # "pan_left", "forward", etc.
    first_frame_bytes: bytes,          # anchor frame to start from
    last_frame_bytes: bytes | None,    # Kling boundary constraint (optional)
    reference_frames: list[bytes],     # up to 7 anchors for Grok
    scene_analysis: dict,
    openrouter_api_key: str,
    model: str = GROK_VIDEO_MODEL,
    duration_seconds: int = 5,
) -> dict:
    """
    Generates one directional clip via OpenRouter.
    Returns { clip_b64, action, model, duration, first_frame_b64, last_frame_b64 }
    """
    camera_prompt = ACTION_CAMERA_PROMPTS[action]
    full_prompt = (
        f"{camera_prompt}. "
        f"Scene: {scene_analysis['spatial_description']}. "
        f"Lighting: {scene_analysis['lighting']}. "
        f"Maintain exact spatial consistency with the reference images. "
        f"No sudden cuts. Smooth, cinematic motion."
    )

    # OpenRouter unified API call
    payload = {
        "model": model,
        "messages": [{
            "role": "user",
            "content": [
                *[{"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{base64.b64encode(ref).decode()}"}} for ref in reference_frames],
                {"type": "text", "text": full_prompt},
            ]
        }],
        "duration": duration_seconds,
    }
    # Kling first/last frame control (when available)
    if last_frame_bytes and model == KLING_PRO_MODEL:
        payload["last_frame"] = base64.b64encode(last_frame_bytes).decode()

    async with httpx.AsyncClient(timeout=300.0) as client:
        resp = await client.post(
            f"{OPENROUTER_BASE}/chat/completions",
            headers={"Authorization": f"Bearer {openrouter_api_key}"},
            json=payload,
        )
        resp.raise_for_status()
    # Extract video from response
    ...
```

### 5.4 Stage 4: Navigation Graph

```python
@dataclass
class NavigationClip:
    action: str
    clip_url: str          # S3 presigned, 1hr TTL
    duration_seconds: float
    first_frame_url: str   # for instant thumbnail
    last_frame_url: str    # for crossfade preload

@dataclass
class GenieWorldSession:
    session_id: str
    scene_analysis: dict
    clips: dict[str, NavigationClip]   # action → clip
    navigable_actions: list[str]
    created_at: str
    expires_at: str                    # 1hr from creation
```

---

## 6. Gateway Endpoints

New router: `services/fullstack-gateway/app/api/genie_routes.py`

```
POST /v1/genie/session
  Body: { source_image_b64, context: { tour_type, hints }, tier: "standard"|"premium" }
  Response: GenieWorldSession (clips not yet generated — async)
  Status: 202 Accepted + session_id

GET  /v1/genie/session/:session_id
  Response: GenieWorldSession with current clip statuses
  Poll until all clips have status "ready"

POST /v1/genie/session/:session_id/navigate
  Body: { current_action: "pan_left", next_action: "forward" }
  Response: { transition_frame_b64 }   # precomputed Kling boundary frame
  Use for: smooth crossfades during navigation
```

**Tier selection:**

| Tier | Models Used | Cost per Session (8 clips × 5s) |
|---|---|---|
| `standard` | Wan 2.6 (primary), Veo 3.1 Lite (fallback) | ~$1.60 |
| `standard_ref` | Grok Imagine Video | ~$2.00 |
| `premium` | Kling v3.0 Pro + Grok (boundary frames) | ~$8.00 |
| `showcase` | Veo 3.1 + Kling boundaries | ~$18.00 |

---

## 7. Client: `GenieWorldViewer.tsx`

Browser-side WebGL viewer. Replaces `StreetViewPanel.tsx` for generated environments (used alongside it for real Street View).

### 7.1 State Machine

```
IDLE
  ↓ [user triggers navigation action]
LOADING_CLIP (preload next clip if not cached)
  ↓
TRANSITIONING (crossfade: current last_frame → next first_frame, 0.3s)
  ↓
PLAYING_CLIP (clip plays, user can trigger next action)
  ↓ [clip ends or user acts]
TRANSITIONING → PLAYING_CLIP (loop)
```

### 7.2 Preloading

When the user starts watching clip A (e.g., "forward"), preload clips B adjacent to A (e.g., "pan_left", "pan_right") in the background. At a 5s clip duration this gives ~4s of preload buffer.

### 7.3 Input Mapping

| Input | Action |
|---|---|
| Arrow Up / Swipe Up / W | `forward` |
| Arrow Down / Swipe Down / S | `backward` |
| Arrow Left / Swipe Left / A | `pan_left` |
| Arrow Right / Swipe Right / D | `pan_right` |
| Q / Two-finger rotate left | `turn_left` |
| E / Two-finger rotate right | `turn_right` |
| Page Up / Pinch out | `look_up` |
| Page Down / Pinch in | `look_down` |

### 7.4 Component Interface

```tsx
<GenieWorldViewer
  sessionId="genie_session_abc123"
  initialAction="forward"
  onNavigate={(action) => void}
  tier="standard_ref"
  showNavigationHUD={true}        // direction arrows overlay
  audioEnabled={true}             // plays Veo/Kling native audio if present
/>
```

---

## 8. Integration Points

| Product | Where GenieWorldViewer Appears | Context Passed |
|---|---|---|
| StelarPeople | `/properties/:id/tour` — replaces or augments StreetViewPanel | `{ tour_type: "property", listing_facts }` |
| StelarVacay | `/tour?mode=neighborhood` | `{ tour_type: "neighborhood", stop_index }` |
| StelarVision | Event scene viewer after transform | `{ tour_type: "event", event_category }` |

For StelarVision specifically: the Imagen 3 still transform (from `VISION_TRANSFORM_PROMPTS`) becomes the **first frame** input to the Genie pipeline. User uploads photo → picks event scene → gets still transform → optionally "bring it to life" → Genie generates navigable version of the event scene.

---

## 9. New Secrets Required

| Secret Name | Used By | Value Source |
|---|---|---|
| `OPENROUTER-API-KEY` | genie_world.py, all OpenRouter calls | openrouter.ai dashboard |

Add to Key Vault `kv-stelar-prod` and wire to Container App as `OPENROUTER_API_KEY`.

---

## 10. New Dependencies

```toml
# pyproject.toml additions — none needed
# OpenRouter uses standard HTTPS + httpx (already installed)
# All models accessed via unified OpenRouter API
```

No new Python packages. OpenRouter is just an HTTP endpoint.

---

## 11. Build Order

1. **`genie_world.py`** — scene analysis, anchor generation, directional clip generation, navigation graph assembly
2. **`genie_routes.py`** — gateway endpoints (session create, poll, navigate)
3. **Register** `genie_router` in `main.py`
4. **`GenieWorldViewer.tsx`** — client player, state machine, input handling, crossfade
5. **Wire** into StelarPeople `PropertyTourPage.tsx` as optional layer alongside StreetViewPanel
6. **Wire** into StelarVision as "bring to life" button after still transform
7. **Wire** into StelarVacay `VacayTourPage.tsx` per route stop

---

## 12. What This Is Not

- Not a trained world model — navigation consistency depends on model reference conditioning quality
- Not real-time — session generation takes 1–3 minutes for all 8 clips (async, poll for completion)
- Not infinite — each session generates a finite clip graph for the starting viewpoint; "entering" a new room requires a new session from that room's photo
- Not photogrammetric 3D — no point cloud, no mesh, no depth map output; purely video-based
