# Dual-Mode LLM Client Pattern

Concrete implementation from the family-companion project (Gemma 4 26B + Gemini fallback).

## File Structure

```
src/gemma/
├── client.py          # Dual-mode: local Gemma 4 27B + cloud Gemini + rules
├── local_client.py    # Ollama wrapper (OpenAI-compatible API)
├── model_router.py    # Cactus Prize: local/cloud/rules routing
├── prompts.py         # Structured prompt templates
├── routing.py         # Prompt + model selection
├── safety_filters.py  # Input/output safety
└── response_scoring.py # Quality assessment
```

## local_client.py

Key methods:
- `health_check()` — GET `/api/tags`, check if model name is in response
- `generate(prompt, system_prompt, temperature, max_tokens, top_p)` — POST `/v1/chat/completions` with `stream: false`
- `stream(prompt, system_prompt, ...)` — POST with `stream: true`, parse SSE
- Uses aiohttp session with 300s timeout (27B is slow)

Model name: `gemma4:26b` (Ollama format -- NOTE: there is no `gemma4:27b` tag; the 26B variant is the closest)
Base URL: `http://localhost:11434`

## model_router.py

RouteDecision dataclass: target (RouteTarget enum), reason, confidence, metadata.

Decision priority:
1. Crisis keywords ("emergency", "urgent", "hurt", "danger", "suicidal") → LOCAL (0.95)
2. Context priority >= 4 → LOCAL (0.90)
3. PII patterns ("social security", "medicaid", "child's name", etc.) → LOCAL (0.85)
4. Context sensitive flag → LOCAL (0.80)
5. No local + no connectivity → RULES (0.70)
6. Simple query (< 4 words, basic patterns) → RULES (0.60)
7. Local available → LOCAL (0.70), else → CLOUD (0.65)

Stores last 100 decisions. Exposes `get_stats()` and `get_decision_log(limit)`.

## client.py (dual-mode update)

```python
class GemmaClient:
    def __init__(self):
        self._local_client: LocalGemmaClient | None = None
        self._router = ModelRouter()
        # existing cloud API fields preserved

    async def generate(prompt, model, temperature, max_tokens, top_p,
                       system_prompt=None, context=None):
        local_available = await self._is_local_available()
        decision = self._router.decide(prompt, context, local_available)

        if decision.target == LOCAL and local_available:
            try:
                return await self._local_client.generate(...)
            except Exception:
                return await self._cloud_generate(...)  # silent fallback

        if decision.target == CLOUD:
            return await self._cloud_generate(...)

        # RULES
        return {"text": self._rules_response(prompt), "model": "rules", ...}

    async def stream(...):
        # Try local stream, fallback to cloud word-by-word

    async def embed(...):
        # Always cloud (embeddings need API)

    def get_routing_stats():
        return self._router.get_stats() + recent decisions
```

## config.py additions

```python
LOCAL_LLM_BASE_URL: str = "http://localhost:11434"
LOCAL_LLM_MODEL: str = "gemma4:26b"
LOCAL_LLM_ENABLED: bool = True
```

## Service wiring (support_agent.py example)

```python
async def generate_ai_response(self, request_type, message, memories, ...):
    from src.gemma.client import GemmaClient

    client = GemmaClient()
    try:
        result = await client.generate(
            prompt=prompt,
            system_prompt=system_prompt,
            temperature=0.5,
            max_tokens=2048,
            context={"priority": 3, "sensitive": True},
        )
        return {"text": result["text"], "confidence": 0.85, ...}
    except Exception:
        return {"text": self._template_fallback(...), "confidence": 0.5, ...}
    finally:
        await client.close()
```

## Android API routes pattern

```python
router = APIRouter()  # No prefix here; set in main.py

@router.post("/chat")
async def android_chat(message, family_id, ...):
    from src.gemma.client import GemmaClient
    client = GemmaClient()
    try:
        result = await client.generate(prompt=..., system_prompt=...,
                                        max_tokens=512, context={...})
        return {"message": result["text"], "model": result.get("model"), ...}
    finally:
        await client.close()
```

In main.py:
```python
app.include_router(android.router, prefix="/api/v1/android", tags=["android"])
```

## Model integration for mobile apps

When merging mobile app domain models into the backend:
- Add maternal-specific enums to existing models (e.g., `ResourceCategory.HOSPITAL`, `NURSING_ROOM`)
- Add pregnancy-specific metric types (e.g., `MetricType.CONTRACTION`, `KICK_COUNT`)
- Both domains must be represented in the same enum — don't create separate models for the same concept
