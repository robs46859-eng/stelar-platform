---
name: family-backend-integrator-core
description: Backend hardening workflow for the family-companion FastAPI service, Android contracts, and local Ollama/Gemma routing.
---

# Family Backend Integrator Core

## Operating Context
- Project root: `/home/azureuser/family-companion`.
- Backend root: `/home/azureuser/family-companion/backend`.
- Local LLM endpoint: `http://localhost:11434/v1`.
- Required local model tag: `gemma4:26b`.
- Preserve dirty worktree changes unless explicitly told to revert them.

## Procedure
1. Inspect current backend state before editing: `git status --short`, relevant routes, config, schemas, and services.
2. Keep Android API contracts stable under `/api/v1/android/*` unless the assignment asks for a contract change.
3. Confirm local Gemma routing returns `route: local` and `model: gemma4:26b` for chat smoke tests.
4. Prefer focused fixes with exact smoke commands over broad refactors.
5. Flag anything that requires production deploy, credential use, destructive database action, or cloud spend as a greenlight item.

## Checkpoint
Return the required swarm checkpoint with exact files changed, commands run, API status codes, response snippets, and the next safest action.
