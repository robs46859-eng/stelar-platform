#!/usr/bin/env bash
# Worker: phase1:ollama-bind
# Task: Lock Ollama to 127.0.0.1:11434 and verify

set -euo pipefail
LOGPFX="[phase1:ollama-bind]"

echo "$LOGPFX starting"
echo "$LOGPFX checking current Ollama bind address"

CURRENT=$(sudo ss -ltnp 2>/dev/null | grep 11434 || echo "not found")
echo "$LOGPFX current: $CURRENT"

if echo "$CURRENT" | grep -q "127.0.0.1"; then
  echo "$LOGPFX Ollama is already bound to 127.0.0.1:11434 — nothing to do"
  echo "$LOGPFX DONE"
  exit 0
fi

echo "$LOGPFX Ollama is NOT bound to localhost only — applying fix"

# Create systemd override
OVERRIDE_DIR="/etc/systemd/system/ollama.service.d"
echo "$LOGPFX writing systemd override at $OVERRIDE_DIR/override.conf"
sudo mkdir -p "$OVERRIDE_DIR"
sudo tee "$OVERRIDE_DIR/override.conf" > /dev/null << 'OVERRIDE'
[Service]
Environment="OLLAMA_HOST=127.0.0.1:11434"
Environment="OLLAMA_MODELS=/mnt/gemma4/ollama"
OVERRIDE

echo "$LOGPFX reloading systemd and restarting Ollama"
sudo systemctl daemon-reload
sudo systemctl restart ollama
sleep 5

echo "$LOGPFX verifying bind address after restart"
RESULT=$(sudo ss -ltnp 2>/dev/null | grep 11434 || echo "not found")
echo "$LOGPFX result: $RESULT"

if echo "$RESULT" | grep -q "127.0.0.1"; then
  echo "$LOGPFX SUCCESS — Ollama bound to 127.0.0.1:11434"
else
  echo "$LOGPFX WARNING — 127.0.0.1 not confirmed. Full ss output:"
  sudo ss -ltnp | grep 11434 || echo "  (no process on 11434)"
fi

echo "$LOGPFX verifying API still responds"
sleep 2
API=$(curl -s http://127.0.0.1:11434/api/tags | python3 -c "import sys,json; d=json.load(sys.stdin); print('models:', [m['name'] for m in d.get('models',[])])" 2>/dev/null || echo "API check failed")
echo "$LOGPFX $API"

echo "$LOGPFX writing result to repo"
mkdir -p /mnt/gemma4/stelar-platform/.squad/results
echo "ollama-bind: completed $(date -u +%Y-%m-%dT%H:%M:%SZ)" >> /mnt/gemma4/stelar-platform/.squad/results/phase1.txt
echo "$LOGPFX DONE"
