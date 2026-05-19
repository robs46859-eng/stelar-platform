import httpx
from app.core.config import get_settings
from app.schemas.inference import InferenceResponse, Usage
from app.services.context import RequestContext


class OllamaProvider:
    name = "gemma4_26b_ollama_vm"

    async def infer(self, context: RequestContext) -> InferenceResponse:
        settings = get_settings()
        prompt = context.payload.messages[-1].content if context.payload.messages else ""
        async with httpx.AsyncClient(timeout=180.0) as client:
            resp = await client.post(
                f"{settings.ollama_bridge_url}/ollama/generate",
                headers={"X-FullStack-Bridge-Key": settings.ollama_bridge_shared_secret},
                json={"prompt": prompt, "stream": False},
            )
            resp.raise_for_status()
            data = resp.json()
        output_text = data.get("response", "")
        tokens = len(prompt.split()) + len(output_text.split())
        return InferenceResponse(
            request_id=context.request_id,
            tenant_id=context.tenant_id or "stelar",
            provider=self.name,
            model="gemma4:26b",
            output_text=output_text,
            usage=Usage(
                prompt_tokens=len(prompt.split()),
                completion_tokens=len(output_text.split()),
                total_tokens=tokens,
            ),
        )
