import hashlib
import re
from typing import Tuple

HARD_BLOCK_PATTERNS = {
    "health_claim": [
        r"\b(cure[sd]?|heal[s]?|treat[s]?|remedy|remedies|diagnos[e]?)\b",
        r"\b(anxiety|depression|diabetes|cancer|disease|disorder)\b",
        r"\bclinically (proven|tested|validated)\b",
        r"\b(FDA|medically) (approved|endorsed)\b",
        r"\bguaranteed? to (improve|boost|enhance) (health|wellness|immunity)\b",
    ],
    "financial_claim": [
        r"\bguaranteed? (return[s]?|income|profit[s]?|earning[s]?)\b",
        r"\b\d+%\s*(return|profit|ROI|gain)\b",
        r"\b(risk.free|no.risk) invest",
        r"\bfinancial (freedom|independence) guaranteed\b",
        r"\bearn \$[\d,]+ (per|a) (day|week|month)\b",
    ],
    "legal_claim": [
        r"\b(legal advice|legal counsel|consult an attorney)\b",
        r"\byour (legal )?rights (are|include|guarantee)\b",
        r"\b(landlord|tenant) (must|is required|is obligated)\b.*\blaw\b",
        r"\bthis (document|agreement|contract) is legally binding\b",
    ],
    "auto_publish": [
        r"\b(post|publish|send|submit|upload)\s+(this|it|now|immediately|automatically)\b",
        r"\bauto.?(post|publish|send)\b",
    ],
}

def classify(content: str) -> Tuple[str, float, str]:
    """Returns (classification, risk_score, reason)."""
    content_lower = content.lower()
    for category, patterns in HARD_BLOCK_PATTERNS.items():
        for pattern in patterns:
            if re.search(pattern, content_lower, re.IGNORECASE):
                return category, 1.0, f"Matched hard-block pattern in category '{category}'"
    # Check for softer risk signals
    soft_signals = [
        r"\bguarantee[d]?\b", r"\bpromise[d]?\b", r"\bproven\b",
        r"\bbest\b.*\bever\b", r"\b#1\b", r"\bnumber one\b",
    ]
    signal_count = sum(1 for p in soft_signals if re.search(p, content_lower, re.IGNORECASE))
    if signal_count >= 2:
        return "marketing_risk", round(0.4 + signal_count * 0.1, 2), f"Multiple soft risk signals ({signal_count})"
    return "safe", 0.1, "No risk patterns detected"

def content_hash(content: str) -> str:
    return hashlib.sha256(content.encode()).hexdigest()[:16]
