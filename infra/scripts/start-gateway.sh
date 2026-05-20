#!/usr/bin/env bash
set -e

REPO="/mnt/gemma4/stelar-platform"
VENV="/tmp/gw-venv"
KV="kv-stelar-prod"

echo "[1/4] Pulling latest secrets from Key Vault..."
export DATABASE_URL="$(az keyvault secret show --vault-name $KV --name POSTGRES-URL --query value -o tsv | sed 's|postgresql://|postgresql+psycopg://|')"
export REDIS_URL="$(az keyvault secret show --vault-name $KV --name REDIS-URL --query value -o tsv | sed 's|redis://|rediss://|;s|?ssl=true||')"
export OLLAMA_BRIDGE_SHARED_SECRET="$(az keyvault secret show --vault-name $KV --name OLLAMA-BRIDGE-SHARED-SECRET --query value -o tsv)"
export OLLAMA_BRIDGE_URL="http://127.0.0.1:18080"
export DEFAULT_PROVIDER="gemma4_26b_ollama_vm"
export BACKEND_MODE="self_hosted"
export ADMIN_API_TOKEN="$(az keyvault secret show --vault-name $KV --name FULLSTACK-INTERNAL-API-KEY --query value -o tsv)"
export DEV_API_KEY_SECRET="$(openssl rand -hex 16)"

echo "[2/4] Rebuilding venv if needed..."
if [ ! -f "$VENV/bin/uvicorn" ]; then
  python3 -m venv "$VENV"
  "$VENV/bin/pip" install -q -e "$REPO/services/fullstack-gateway"
fi

echo "[3/4] Killing any existing gateway process on :8500..."
pkill -f "uvicorn app.main:app" 2>/dev/null || true
sleep 1

echo "[4/4] Starting fullstack-gateway on port 8500..."
cd "$REPO/services/fullstack-gateway"
nohup "$VENV/bin/uvicorn" app.main:app --port 8500 --host 0.0.0.0 \
  > /tmp/gateway.log 2>&1 &

sleep 2
if curl -sf http://localhost:8500/health > /dev/null; then
  echo "Gateway is UP — http://localhost:8500"
else
  echo "Gateway failed to start. Check /tmp/gateway.log"
  tail -20 /tmp/gateway.log
  exit 1
fi
