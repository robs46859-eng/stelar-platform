import logging
from datetime import datetime, timezone
from typing import Optional

logger = logging.getLogger(__name__)


async def record_review(
    pool,
    content_hash: str,
    product: str,
    agent_name: Optional[str],
    classification: str,
    risk_score: float,
    decision: str,
    notes: Optional[str] = None,
) -> None:
    try:
        await pool.execute(
            """INSERT INTO governance.claim_reviews
               (content_hash, product, agent_name, classification, risk_score, decision, reviewer_notes, reviewed_at)
               VALUES ($1, $2, $3, $4, $5, $6, $7, $8)""",
            content_hash, product, agent_name, classification, risk_score, decision, notes,
            datetime.now(timezone.utc),
        )
    except Exception as exc:
        # Non-blocking — DB write failure must never stop a block decision
        logger.warning("governance_audit_write_failed: %s", exc)
