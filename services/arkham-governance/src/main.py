import logging
import os
from contextlib import asynccontextmanager
from datetime import datetime, timedelta, timezone

import asyncpg
from fastapi import FastAPI

from .classifier import classify, content_hash
from .reviewer import record_review
from .schemas import PublishCheckRequest, PublishCheckResponse, ReviewRequest, ReviewResponse

logger = logging.getLogger(__name__)

db_pool = None


def _within_launch_window() -> bool:
    """Returns True while within the 90-day auto-publish block window.
    Reads DEPLOYMENT_START_DATE (ISO-8601 date, e.g. 2026-05-20).
    Safe default: stay blocked if the env var is missing or unparseable.
    """
    raw = os.getenv("DEPLOYMENT_START_DATE", "").strip()
    if not raw:
        return True
    try:
        start = datetime.fromisoformat(raw).replace(tzinfo=timezone.utc)
        return (datetime.now(timezone.utc) - start) < timedelta(days=90)
    except ValueError:
        logger.warning("DEPLOYMENT_START_DATE is not a valid ISO date: %r — staying in launch window", raw)
        return True


@asynccontextmanager
async def lifespan(app: FastAPI):
    global db_pool
    postgres_url = os.getenv("POSTGRES_URL", "")
    if postgres_url:
        try:
            db_pool = await asyncpg.create_pool(postgres_url)
        except Exception as exc:
            logger.warning("governance_db_unavailable — audit writes will be skipped: %s", exc)
    yield
    if db_pool:
        await db_pool.close()


app = FastAPI(title="Arkham Governance", lifespan=lifespan)

HARD_BLOCK_CATEGORIES = {"health_claim", "financial_claim", "legal_claim", "auto_publish"}


@app.get("/health")
async def health():
    return {"ok": True, "service": "arkham-governance"}


@app.get("/ready")
async def ready():
    return {"ok": True}


@app.post("/review", response_model=ReviewResponse)
async def review(req: ReviewRequest):
    classification, risk_score, reason = classify(req.content)
    ch = content_hash(req.content)
    if classification in HARD_BLOCK_CATEGORIES:
        decision = "BLOCK"
    elif risk_score >= 0.5:
        decision = "REVIEW"
    else:
        decision = "APPROVE"
    if db_pool:
        await record_review(db_pool, ch, req.product, req.agent_name, classification, risk_score, decision, reason)
    return ReviewResponse(classification=classification, risk_score=risk_score, decision=decision, reason=reason, content_hash=ch)


@app.post("/publish-check", response_model=PublishCheckResponse)
async def publish_check(req: PublishCheckRequest):
    classification, risk_score, reason = classify(req.content)
    if classification in HARD_BLOCK_CATEGORIES:
        return PublishCheckResponse(allowed=False, decision="BLOCK", reason=reason, requires_human_review=True)
    if _within_launch_window():
        return PublishCheckResponse(
            allowed=False,
            decision="PENDING_HUMAN_APPROVAL",
            reason="Within 90-day launch window — human approval required for all outbound content.",
            requires_human_review=True,
        )
    if risk_score >= 0.5:
        return PublishCheckResponse(allowed=False, decision="REVIEW", reason=reason, requires_human_review=True)
    return PublishCheckResponse(allowed=True, decision="APPROVE", reason=reason, requires_human_review=False)
