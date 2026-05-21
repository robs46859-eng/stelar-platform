import base64
import json
import logging
import uuid
from datetime import datetime, timezone, timedelta

import redis
from fastapi import APIRouter, BackgroundTasks, Header, HTTPException
from pydantic import BaseModel

from app.core.config import get_settings
from app.services.genie_world import build_genie_session, TIER_MODELS

logger = logging.getLogger(__name__)
genie_router = APIRouter(prefix="/v1/genie")

VALID_TIERS = set(TIER_MODELS.keys())


def _get_redis():
    settings = get_settings()
    return redis.from_url(settings.redis_url, decode_responses=True)


def _auth(x_api_key: str) -> None:
    if x_api_key != get_settings().dev_api_key_secret:
        raise HTTPException(status_code=401, detail="Unauthorized")


# ─── Request / Response Models ────────────────────────────────────────────────

class GenieSessionRequest(BaseModel):
    source_image_b64: str
    context: dict = {}           # { tour_type, event_category, hints, ... }
    tier: str = "standard_ref"   # standard | standard_ref | premium | showcase


class GenieSessionStatus(BaseModel):
    session_id: str
    status: str                  # generating | ready | partial | failed
    navigable_actions: list[str] = []
    clips: dict = {}
    scene_analysis: dict = {}
    created_at: str
    expires_at: str


# ─── POST /v1/genie/session ───────────────────────────────────────────────────

@genie_router.post("/session", status_code=202)
async def create_session(
    body: GenieSessionRequest,
    background_tasks: BackgroundTasks,
    x_api_key: str = Header(..., alias="X-API-Key"),
) -> dict:
    _auth(x_api_key)
    settings = get_settings()

    if not settings.google_ai_api_key:
        raise HTTPException(status_code=503, detail="Google AI not configured.")
    if not settings.openrouter_api_key:
        raise HTTPException(status_code=503, detail="OpenRouter not configured.")
    if body.tier not in VALID_TIERS:
        raise HTTPException(status_code=400, detail=f"Invalid tier. Must be one of: {', '.join(sorted(VALID_TIERS))}")

    try:
        image_bytes = base64.b64decode(body.source_image_b64)
    except Exception as exc:
        raise HTTPException(status_code=400, detail="Invalid base64 image data.") from exc

    session_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc)
    expires = now + timedelta(hours=2)

    # Write initial session record to Redis
    r = _get_redis()
    r.setex(
        f"genie:session:{session_id}",
        7200,
        json.dumps({
            "session_id": session_id,
            "status": "generating",
            "tier": body.tier,
            "context": body.context,
            "navigable_actions": [],
            "clips": {},
            "scene_analysis": {},
            "created_at": now.isoformat(),
            "expires_at": expires.isoformat(),
        }),
    )

    background_tasks.add_task(
        build_genie_session,
        session_id=session_id,
        image_bytes=image_bytes,
        context=body.context,
        tier=body.tier,
        google_api_key=settings.google_ai_api_key,
        openrouter_api_key=settings.openrouter_api_key,
        redis_client=r,
    )

    logger.info("genie_session_created", session_id=session_id, tier=body.tier)
    return {
        "session_id": session_id,
        "status": "generating",
        "created_at": now.isoformat(),
        "expires_at": expires.isoformat(),
        "poll_url": f"/v1/genie/session/{session_id}",
    }


# ─── GET /v1/genie/session/{session_id} ──────────────────────────────────────

@genie_router.get("/session/{session_id}")
async def get_session(
    session_id: str,
    x_api_key: str = Header(..., alias="X-API-Key"),
) -> dict:
    _auth(x_api_key)

    r = _get_redis()
    raw = r.get(f"genie:session:{session_id}")
    if not raw:
        raise HTTPException(status_code=404, detail="Session not found or expired.")

    return json.loads(raw)


# ─── DELETE /v1/genie/session/{session_id} ───────────────────────────────────

@genie_router.delete("/session/{session_id}", status_code=204)
async def delete_session(
    session_id: str,
    x_api_key: str = Header(..., alias="X-API-Key"),
) -> None:
    _auth(x_api_key)
    _get_redis().delete(f"genie:session:{session_id}")
