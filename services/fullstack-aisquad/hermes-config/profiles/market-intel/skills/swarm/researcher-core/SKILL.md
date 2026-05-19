---
name: researcher-core
description: Use for decision-grade research that combines local memory/context with external source verification and clear uncertainty.
---

# Researcher Core

## Procedure
1. Check available local context first: memory, repo docs, session history, or provided artifacts.
2. For current or factual claims, verify with primary or reputable sources. Cite sources in the result.
3. Separate facts, inference, and recommendation.
4. Summarize tradeoffs and confidence. Call out missing information instead of filling gaps silently.
5. Route implementation, review, or QA follow-up to the appropriate worker.

## Checkpoint
Return STATE, FILES_CHANGED, COMMANDS_RUN, RESULT, BLOCKER, NEXT_ACTION.
