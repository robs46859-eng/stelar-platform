import os
import httpx
from fastapi import FastAPI, Header, HTTPException
from pydantic import BaseModel

OLLAMA_URL = os.getenv("OLLAMA_URL", "http://127.0.0.1:11434")
MODEL_NAME = os.getenv("OLLAMA_MODEL", "gemma4:26b")
BRIDGE_SECRET = os.getenv("OLLAMA_BRIDGE_SHARED_SECRET", "")

app = FastAPI(title="FullStack Ollama Bridge", version="1.0")

class GenerateRequest(BaseModel):
    prompt: str
    system: str | None = None
    temperature: float = 0.2
    stream: bool = False

class ChatMessage(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    messages: list[ChatMessage]
    temperature: float = 0.2
    stream: bool = False

def require_secret(key: str | None):
    if not BRIDGE_SECRET:
        raise HTTPException(status_code=500, detail="bridge secret not configured")
    if not key or key != BRIDGE_SECRET:
        raise HTTPException(status_code=401, detail="unauthorized")

@app.get("/health")
def health():
    return {"status": "ok", "service": "ollama-bridge"}

@app.get("/ready")
async def ready():
    async with httpx.AsyncClient(timeout=5) as client:
        r = await client.get(f"{OLLAMA_URL}/api/tags")
        r.raise_for_status()
    return {"status": "ready", "model": MODEL_NAME}

@app.post("/ollama/generate")
async def generate(req: GenerateRequest, x_fullstack_bridge_key: str | None = Header(default=None)):
    require_secret(x_fullstack_bridge_key)
    payload = {
        "model": MODEL_NAME,
        "prompt": req.prompt,
        "system": req.system,
        "stream": req.stream,
        "options": {"temperature": req.temperature},
    }
    async with httpx.AsyncClient(timeout=180) as client:
        r = await client.post(f"{OLLAMA_URL}/api/generate", json=payload)
        r.raise_for_status()
        return r.json()

@app.post("/ollama/chat")
async def chat(req: ChatRequest, x_fullstack_bridge_key: str | None = Header(default=None)):
    require_secret(x_fullstack_bridge_key)
    payload = {
        "model": MODEL_NAME,
        "messages": [m.model_dump() for m in req.messages],
        "stream": req.stream,
        "options": {"temperature": req.temperature},
    }
    async with httpx.AsyncClient(timeout=180) as client:
        r = await client.post(f"{OLLAMA_URL}/api/chat", json=payload)
        r.raise_for_status()
        return r.json()
