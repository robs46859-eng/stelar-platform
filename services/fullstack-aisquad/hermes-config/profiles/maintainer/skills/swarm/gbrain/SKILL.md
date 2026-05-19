---
name: gbrain
description: Use when a worker should consult a configured GBrain or local knowledge graph before external search; fall back cleanly if unavailable.
---

# GBrain

## Procedure
1. Try the configured GBrain/MCP/local knowledge tool first when the task references durable operating memory.
2. If no GBrain tool is available, check local memory files and repo docs.
3. State when knowledge retrieval was unavailable instead of pretending it ran.
4. External web research may supplement but should not overwrite source-of-record notes without review.
