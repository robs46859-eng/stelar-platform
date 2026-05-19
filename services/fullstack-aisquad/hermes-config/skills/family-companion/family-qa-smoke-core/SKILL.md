---
name: family-qa-smoke-core
description: Smoke verification workflow for family-companion local Ollama, FastAPI Android APIs, database flows, and Android build readiness.
---

# Family QA Smoke Core

## Operating Context
- Project root: `/home/azureuser/family-companion`.
- Backend root: `/home/azureuser/family-companion/backend`.
- Android root: `/home/azureuser/family-companion/android`.
- Required model: `gemma4:26b` through `http://localhost:11434/v1`.

## Procedure
1. Verify Ollama with both `/v1/models` and a short chat completion using `think:false` when needed.
2. Start updated backend on a non-conflicting local port when port 8000 is stale.
3. Smoke `/health`, `/api/v1/android/chat`, journey creation/read, health metric creation/filter, and places.
4. Run Android compile or the closest available Gradle check and capture the exact result.
5. Report failures as actionable bugs with command, status code, and response body excerpt.

## Checkpoint
Return a ship/hold recommendation with concrete command evidence and the next smallest fix.
