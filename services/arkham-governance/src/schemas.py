from pydantic import BaseModel
from typing import Optional

class ReviewRequest(BaseModel):
    content: str
    product: str
    agent_name: Optional[str] = None
    context: Optional[str] = None

class ReviewResponse(BaseModel):
    classification: str
    risk_score: float
    decision: str  # "BLOCK" | "APPROVE" | "REVIEW"
    reason: str
    content_hash: str

class PublishCheckRequest(BaseModel):
    content: str
    product: str
    agent_name: Optional[str] = None
    publish_target: Optional[str] = None

class PublishCheckResponse(BaseModel):
    allowed: bool
    decision: str
    reason: str
    requires_human_review: bool
