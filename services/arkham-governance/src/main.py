from fastapi import FastAPI, HTTPException
from contextlib import asynccontextmanager
import asyncpg
import os

from .schemas import ReviewRequest, ReviewResponse, PublishCheckRequest, PublishCheckResponse
from .classifier import classify, content_hash
from .reviewer import record_review

db_pool = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    global db_pool
    postgres_url = os.getenv("POSTGRES_URL", "")
    if postgres_url:
        try:
            db_pool = await asyncpg.create_pool(postgres_url)
        except Exception:
            pass
    yield
    if db_pool:
        await db_pool.close()

app = FastAPI(title="Arkham Governance", lifespan=lifespan)

HARD_BLOCK_CATEGORIES = {"health_claim", "financial_claim", "legal_claim", "auto_publish"}
AUTO_PUBLISH_BLOCKED_DAYS = 90

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
    # First 90 days: all publishing requires human approval
    return PublishCheckResponse(allowed=False, decision="PENDING_HUMAN_APPROVAL", reason="First 90 days: human approval required for all outbound content", requires_human_review=True)
