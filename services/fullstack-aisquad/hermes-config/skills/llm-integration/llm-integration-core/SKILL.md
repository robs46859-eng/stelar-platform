---
name: llm-integration-core
description: Use for integrating local LLMs (like Gemma 4 26B) into existing AI systems and connecting them with mobile applications. Covers dual-mode (local Ollama + cloud API fallback) with intelligent ModelRouter.
---

# LLM Integration Core

Integrate a local LLM into an existing system with dual-mode operation: local inference via Ollama/llama.cpp primary, cloud API fallback, and rule-based responses for simple queries.

## Pre-flight Checks

Before writing code, verify:
- Is the existing LLM layer actually wired to services, or is it dormant (files exist but no imports)? Many projects have complete-looking LLM modules that no service uses.
- Is Ollama installed? (`which ollama && ollama --version`)
- Is the target model available? Check available models before writing client code against a model name that doesn't exist.
- Disk space: LLM models are large (Gemma 4 27B Q4 ~16GB). Check `df -h` before pulling.

## Procedure: Dual-Mode Client

This is the primary pattern. Create three files:

### 1. Local client (`local_client.py`)
Ollama wrapper using OpenAI-compatible `/v1/chat/completions` endpoint. Must have:
- `health_check()` — verify Ollama is running and model is loaded
- `generate()` — full response
- `stream()` — SSE streaming
- Session management with aiohttp

### 2. Model router (`model_router.py`)
Cactus Prize logic. Decision priority:
1. Crisis keywords → LOCAL (works offline)
2. Context priority >= 4 → LOCAL
3. PII/sensitive content → LOCAL (privacy)
4. No local + no connectivity → RULES (fallback)
5. Simple query (< 4 words, basic patterns) → RULES (zero latency)
6. Default → CLOUD (richer) or LOCAL if available

Record decisions for monitoring (`get_stats()`, `get_decision_log()`).

### 3. Update existing client for dual-mode
Modify the existing API client to:
- Import and instantiate LocalGemmaClient + ModelRouter on init
- `generate()` → router.decide() → route to local/cloud/rules
- `stream()` → try local streaming, fallback to cloud
- `embed()` → always cloud (embeddings need API)
- On local failure, fall back to cloud silently
- Add `get_routing_stats()` for monitoring

### 4. Config
Add to settings:
- `LOCAL_LLM_BASE_URL` (default: `http://localhost:11434`)
- `LOCAL_LLM_MODEL` (default: `gemma4:26b`)
- `LOCAL_LLM_ENABLED` (default: `True`)

### 5. Wire into services
After the dual-mode client exists, update services that need AI:
- Import GemmaClient
- Call `generate()` with context dict (priority, sensitive flags)
- Always provide template fallback in except block
- Close client in finally

### 6. Android API endpoints
Create a dedicated router (`/api/v1/android/`) with:
- `POST /chat` — non-streaming chat using GemmaClient
- `POST /chat/stream` — SSE streaming
- `POST /support` — support requests with family context
- `GET /profile`, journey endpoints, health metric endpoints, places endpoints
- Register in main.py

## Pitfalls

- **Wrong model size in plans.** Integration plans often reference stale model sizes (e.g., "26M" for a 27B model). Verify against actual model card before implementing.
- **Wrong model tag.** There is no `gemma4:27b` on Ollama. Available Gemma 4 tags are: `gemma4:e2b`, `gemma4:e4b`, `gemma4:26b`, `gemma4:31b` (plus quantisation variants like `-q4_K_M`, `-q8_0`). Use `gemma4:26b` for the 26B parameter model. Always verify tags at `https://ollama.com/library/gemma4/tags` before writing config.
- **Dormant LLL layer.** Don't assume an existing `gemma/` or `llm/` directory means the LLM is actually used. Grep services for imports.
- **Disk space.** Copying projects with venvs can fill the disk. Use `rsync --exclude='venv' --exclude='__pycache__'`.
- **Post-delegation verification.** After delegated build tasks, verify: (a) services actually import the LLM client, (b) model enums match both platform domains, (c) all imports resolve, (d) routers are registered in main.py.
- **Build guides may be inaccurate.** When following a build guide from a previous session, trust but verify -- iteration is expected when things don't match.
- **OLLAMA_MODELS env var not picked up by systemd.** Setting `OLLAMA_MODELS` in `~/.bashrc` only affects your login shell. The Ollama systemd service runs as the `ollama` user and ignores it. You must inject `Environment="OLLAMA_MODELS=<path>"` directly into `/etc/systemd/system/ollama.service` under `[Service]`, then `daemon-reload` and `restart`. See `references/ollama-systemd-config.md`.

## Reference

See `references/dual-mode-pattern.md` for the full file-by-file implementation from the family-companion project, including actual code structure for client.py, local_client.py, model_router.py, config additions, and Android API routes.

See `references/ollama-systemd-config.md` for configuring Ollama's systemd service to use a custom model storage path (e.g. a separate data disk). Setting `OLLAMA_MODELS` in `~/.bashrc` alone is insufficient -- the service unit file must be edited directly.

See `references/azure-gpu-vm-sizes.md` for Azure GPU VM sizing for LLM inference (NCasT4_v3 series, local SSD sizes, pricing, spot vs on-demand).

## Checkpoint

Return STATE, FILES_CHANGED, COMMANDS_RUN, RESULT, BLOCKER, NEXT_ACTION.