from app.core.config import Settings
from app.providers.base import EchoProvider
from app.schemas.inference import InferenceResponse
from app.services.context import RequestContext


class GeminiProvider(EchoProvider):
    name = "gemini"

    def __init__(self, settings: Settings) -> None:
        self.settings = settings

    async def infer(self, context: RequestContext) -> InferenceResponse:
        raise RuntimeError("Gemini provider not configured for self-hosted mode")
