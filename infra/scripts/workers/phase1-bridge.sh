#!/usr/bin/env bash
# Worker: phase1:bridge
# Task: Install FullStack Ollama inference bridge per SPEC § 10

set -euo pipefail
LOGPFX="[phase1:bridge]"
BRIDGE_DIR="/opt/fullstack-ollama-bridge"
REPO="/mnt/gemma4/stelar-platform"

echo "$LOGPFX starting"

# Check if already installed
if systemctl is-active --quiet fullstack-ollama-bridge 2>/dev/null; then
  echo "$LOGPFX bridge service already active — nothing to do"
  curl -s http://127.0.0.1:18080/health && echo "" || echo "$LOGPFX health check failed"
  exit 0
fi

echo "$LOGPFX creating bridge directory: $BRIDGE_DIR"
sudo mkdir -p "$BRIDGE_DIR"
sudo chown -R "$USER:$USER" "$BRIDGE_DIR"

echo "$LOGPFX writing bridge app (SPEC § 10.3)"
cat > "$BRIDGE_DIR/app.py" << 'PYAPP'
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
PYAPP

echo "$LOGPFX creating Python venv and installing deps"
python3 -m venv "$BRIDGE_DIR/.venv"
"$BRIDGE_DIR/.venv/bin/pip" install --quiet fastapi uvicorn httpx pydantic

echo "$LOGPFX writing requirements.txt"
cat > "$BRIDGE_DIR/requirements.txt" << 'EOF'
fastapi
uvicorn
httpx
pydantic
EOF

echo "$LOGPFX generating bridge secret"
SECRET=$(python3 -c "import secrets; print(secrets.token_urlsafe(32))")
SECRET_FILE="/etc/fullstack-bridge.secret"
echo "$SECRET" | sudo tee "$SECRET_FILE" > /dev/null
sudo chmod 600 "$SECRET_FILE"
sudo chown root:root "$SECRET_FILE"
echo "$LOGPFX secret written to $SECRET_FILE (migrate to Key Vault in Phase 2)"

echo "$LOGPFX writing systemd service (SPEC § 10.4)"
sudo tee /etc/systemd/system/fullstack-ollama-bridge.service > /dev/null << SVCEOF
[Unit]
Description=FullStack Ollama Bridge
After=network-online.target ollama.service
Requires=ollama.service

[Service]
WorkingDirectory=$BRIDGE_DIR
ExecStart=$BRIDGE_DIR/.venv/bin/uvicorn app:app --host 127.0.0.1 --port 18080
Restart=always
RestartSec=3
EnvironmentFile=$SECRET_FILE
Environment="OLLAMA_BRIDGE_SHARED_SECRET_FILE=$SECRET_FILE"
Environment="OLLAMA_URL=http://127.0.0.1:11434"
Environment="OLLAMA_MODEL=gemma4:26b"

[Install]
WantedBy=multi-user.target
SVCEOF

echo "$LOGPFX fixing secret env loading"
# The secret needs to be passed as an env var, not a file — update service
sudo tee /etc/systemd/system/fullstack-ollama-bridge.service > /dev/null << SVCEOF
[Unit]
Description=FullStack Ollama Bridge
After=network-online.target ollama.service
Requires=ollama.service

[Service]
WorkingDirectory=$BRIDGE_DIR
ExecStart=$BRIDGE_DIR/.venv/bin/uvicorn app:app --host 127.0.0.1 --port 18080
Restart=always
RestartSec=3
Environment="OLLAMA_URL=http://127.0.0.1:11434"
Environment="OLLAMA_MODEL=gemma4:26b"
ExecStartPre=/bin/bash -c 'echo OLLAMA_BRIDGE_SHARED_SECRET=\$(cat /etc/fullstack-bridge.secret) > /run/bridge-env'
EnvironmentFile=-/run/bridge-env

[Install]
WantedBy=multi-user.target
SVCEOF

echo "$LOGPFX enabling and starting bridge service"
sudo systemctl daemon-reload
sudo systemctl enable --now fullstack-ollama-bridge
sleep 3

echo "$LOGPFX health check"
HEALTH=$(curl -s http://127.0.0.1:18080/health 2>/dev/null || echo "failed")
echo "$LOGPFX health: $HEALTH"

READY=$(curl -s http://127.0.0.1:18080/ready 2>/dev/null || echo "failed")
echo "$LOGPFX ready: $READY"

echo "$LOGPFX copying app to repo service directory"
cp "$BRIDGE_DIR/app.py" "$REPO/services/ollama-bridge/app.py"
cp "$BRIDGE_DIR/requirements.txt" "$REPO/services/ollama-bridge/requirements.txt"

# Write systemd service file to repo (with placeholder secret)
sudo tee "$REPO/services/ollama-bridge/fullstack-ollama-bridge.service" > /dev/null << REPOSVC
[Unit]
Description=FullStack Ollama Bridge
After=network-online.target ollama.service
Requires=ollama.service

[Service]
WorkingDirectory=/opt/fullstack-ollama-bridge
ExecStart=/opt/fullstack-ollama-bridge/.venv/bin/uvicorn app:app --host 127.0.0.1 --port 18080
Restart=always
RestartSec=3
Environment="OLLAMA_URL=http://127.0.0.1:11434"
Environment="OLLAMA_MODEL=gemma4:26b"
ExecStartPre=/bin/bash -c 'echo OLLAMA_BRIDGE_SHARED_SECRET=\$(cat /etc/fullstack-bridge.secret) > /run/bridge-env'
EnvironmentFile=-/run/bridge-env

[Install]
WantedBy=multi-user.target
REPOSVC

mkdir -p /mnt/gemma4/stelar-platform/.squad/results
echo "bridge: completed $(date -u +%Y-%m-%dT%H:%M:%SZ)" >> /mnt/gemma4/stelar-platform/.squad/results/phase1.txt
echo "$LOGPFX DONE"
