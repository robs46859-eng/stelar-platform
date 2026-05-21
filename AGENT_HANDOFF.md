# Stelar Gateway → Ollama Bridge Connectivity Handoff

**Date:** 2026-05-21  
**Status:** Gateway is deployed and healthy. One blocker remains: no outbound internet from Container Apps subnet.

---

## What Is Working

- `fullstack-gateway` Container App — revision `0000014`, image `acrstelarprod.azurecr.io/fullstack-gateway:tour-v4-system-fix`, **Healthy, 100% traffic**
- All 5 tour endpoints registered: `/v1/tour/narrate`, `/v1/tour/street-narrate`, `/v1/tour/image-analyze`, `/v1/tour/genie-transform`, `/v1/tour/vacay-route`
- Postgres private endpoint DNS resolves correctly (A record `pg-stelar-prod` → `10.0.2.4` in `privatelink.postgres.database.azure.com`)
- Redis SSL (`rediss://` scheme) works
- Gemini Vision endpoints (`/image-analyze`, `/genie-transform`) should work — they call Google APIs, not the bridge
- Ollama bridge on VM `gemmaco-key` (RG-ARKHAMSECURITY) responds correctly when called from the public internet
- All secrets verified: KV `OLLAMA-BRIDGE-SHARED-SECRET` matches `/etc/fullstack-bridge.secret` on the VM (first 12 chars: `x5ZOiCCBdn31`)

## The One Blocker

**Container App cannot make outbound HTTP calls to `http://20.10.150.44:18080`.**

When a tour endpoint is hit, the gateway calls `_call_gemma4()` which does:
```python
# services/fullstack-gateway/app/api/tour_routes.py, line 18-28
async def _call_gemma4(system: str, user: str, max_tokens: int = 4000) -> str:
    settings = get_settings()
    async with httpx.AsyncClient(timeout=180.0) as client:
        resp = await client.post(
            f"{settings.ollama_bridge_url}/ollama/generate",   # http://20.10.150.44:18080/ollama/generate
            headers={"X-FullStack-Bridge-Key": settings.ollama_bridge_shared_secret},
            json={"prompt": user, "system": system, "stream": False},
        )
```

After 180 seconds the httpx client raises `ReadTimeout` → gateway returns `{"detail": "Inference error: "}`.

### Why It Can't Reach the Bridge

| Component | Value |
|-----------|-------|
| Container App VNet | `vnet-stelar-prod` (RG: `rg-stelar-prod`) |
| Container Apps subnet | `snet-containerapps` — `10.0.0.0/23` |
| NAT gateway on subnet | **None** |
| Route table on subnet | **None** |
| Bridge VM VNet | `vnet1` (RG: `RG-ARKHAMSECURITY`) |
| Bridge VM public IP | `20.10.150.44` |
| VNet peering possible? | **No** — both use `10.0.0.0/16` (overlapping, can't peer) |

Without a NAT gateway or route table entry, the Container App subnet has no way to reach public internet IPs.

---

## The Fix: Add a NAT Gateway

This is a ~5-minute infra change. Run these commands:

```bash
LOCATION="eastus2"
RG="rg-stelar-prod"
VNET="vnet-stelar-prod"
SUBNET="snet-containerapps"

# 1. Create public IP for NAT gateway
az network public-ip create \
  --resource-group "$RG" \
  --name pip-natgw-stelar-prod \
  --sku Standard \
  --allocation-method Static \
  --location "$LOCATION"

# 2. Create NAT gateway
az network nat gateway create \
  --resource-group "$RG" \
  --name natgw-stelar-prod \
  --public-ip-addresses pip-natgw-stelar-prod \
  --idle-timeout 10 \
  --location "$LOCATION"

# 3. Associate with Container Apps subnet
az network vnet subnet update \
  --resource-group "$RG" \
  --vnet-name "$VNET" \
  --name "$SUBNET" \
  --nat-gateway natgw-stelar-prod
```

After that, test immediately:
```bash
GW_FQDN="fullstack-gateway.proudbay-d7864c81.eastus2.azurecontainerapps.io"
DEV_API_KEY=$(az keyvault secret show --vault-name kv-stelar-prod --name DEV-API-KEY-SECRET --query "value" -o tsv)

curl -s --max-time 200 -X POST "https://$GW_FQDN/v1/tour/street-narrate" \
  -H "X-API-Key: $DEV_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"tour_id":"t1","address":"Austin TX","neighborhood":"Downtown","city":"Austin","state":"TX","lat":30.26,"lng":-97.74}'
```

Expected: JSON with `narration` field and structured tour data. Gemma4 26B typically takes 15–60 seconds for a full tour narration.

---

## Key Secrets and Config

All values verified in Key Vault `kv-stelar-prod` (RG: `rg-stelar-prod`):

| KV Secret Name | Container App Env Var | Purpose |
|---|---|---|
| `OLLAMA-BRIDGE-SHARED-SECRET` | `OLLAMA_BRIDGE_SHARED_SECRET` | Bridge auth (verified matches VM) |
| `DEV-API-KEY-SECRET` | `DEV_API_KEY_SECRET` | Tour endpoint auth (`X-API-Key` header) |
| `ADMIN-API-TOKEN` | `ADMIN_API_TOKEN` | Required by config validator in self_hosted mode |
| `GOOGLE-AI-API-KEY` | `GOOGLE_AI_API_KEY` | Gemini Vision + Imagen 3 |
| `POSTGRES-URL-PSYCOPG` | `DATABASE_URL` | PostgreSQL (`postgresql+psycopg://...`) |
| `REDIS-URL` | `REDIS_URL` | Redis SSL (`rediss://...` scheme, not `?ssl=true`) |
| `FULLSTACK-INTERNAL-API-KEY` | `FULLSTACK_INTERNAL_API_KEY` | Internal service-to-service calls |
| `JWT-SIGNING-KEY` | `JWT_SIGNING_KEY` | JWT auth |

Container App non-secret env vars:
- `OLLAMA_BRIDGE_URL` = `http://20.10.150.44:18080`
- `DEFAULT_PROVIDER` = `gemma4_26b_ollama_vm`
- `BACKEND_MODE` = `self_hosted`

---

## Bridge VM Details

- **VM name:** `gemmaco-key` (RG: `RG-ARKHAMSECURITY`)
- **Public IP:** `20.10.150.44`
- **Bridge port:** `18080`
- **NSG:** `gemmaco-key-nsg` — port 18080 inbound from `*` is OPEN (added this session)
- **Bridge service:** `/etc/systemd/system/fullstack-ollama-bridge.service` — bound to `0.0.0.0:18080` (fixed this session)
- **Model:** `gemma4:26b` via Ollama at `http://127.0.0.1:11434`
- **Bridge auth:** `X-FullStack-Bridge-Key` header

Bridge call format (use native `system` field — NOT `<system>` tags in prompt):
```bash
curl -X POST http://20.10.150.44:18080/ollama/generate \
  -H "X-FullStack-Bridge-Key: $SECRET" \
  -H "Content-Type: application/json" \
  -d '{"prompt": "Your user message here", "system": "Your system prompt here", "stream": false}'
```

---

## Code Fix Already Applied

`_call_gemma4()` was previously wrapping the system prompt in `<system>` XML tags inside the prompt string, which caused Gemma4 to hang indefinitely. Fixed in `tour-v4-system-fix`:

```python
# BEFORE (caused ReadTimeout):
prompt = f"<system>\n{system}\n</system>\n\n{user}"
json={"prompt": prompt, "stream": False}

# AFTER (correct — uses bridge's native system field):
json={"prompt": user, "system": system, "stream": False}
```

---

## After NAT Gateway: Validate All Tour Endpoints

```bash
GW_FQDN="fullstack-gateway.proudbay-d7864c81.eastus2.azurecontainerapps.io"
DEV_API_KEY=$(az keyvault secret show --vault-name kv-stelar-prod --name DEV-API-KEY-SECRET --query "value" -o tsv)

# 1. Street narrate (Gemma4)
curl -s --max-time 200 -X POST "https://$GW_FQDN/v1/tour/street-narrate" \
  -H "X-API-Key: $DEV_API_KEY" -H "Content-Type: application/json" \
  -d '{"tour_id":"t1","address":"Austin TX","neighborhood":"Downtown","city":"Austin","state":"TX","lat":30.26,"lng":-97.74}'

# 2. Full narrate (Gemma4)
curl -s --max-time 200 -X POST "https://$GW_FQDN/v1/tour/narrate" \
  -H "X-API-Key: $DEV_API_KEY" -H "Content-Type: application/json" \
  -d '{"tour_id":"t2","neighborhood":"Downtown","city":"Austin","state":"TX","tour_type":"property"}'

# 3. Vacay route (Gemma4)
curl -s --max-time 200 -X POST "https://$GW_FQDN/v1/tour/vacay-route" \
  -H "X-API-Key: $DEV_API_KEY" -H "Content-Type: application/json" \
  -d '{"tour_id":"t3","neighborhood":"SoCo","city":"Austin","state":"TX","lat":30.25,"lng":-97.75,"num_stops":3}'
```

For `/image-analyze` and `/genie-transform`, upload a real JPEG image file. They call Google AI (Gemini/Imagen), not the Ollama bridge.

---

## LiteRT LLM Question (Answered)

The user asked: "is litert llm in this build? it may help with speed?"

**LiteRT** (formerly TensorFlow Lite Runtime, now `ai.google.dev/edge/litert`) is Google's on-device inference runtime. It runs quantized models (INT4/INT8) extremely fast on edge hardware.

**Not applicable here.** LiteRT is designed for mobile/edge devices (phones, embedded). Our setup uses `gemma4:26b` — a 26-billion parameter model — on an Azure `Standard_E8s_v3` VM (8 vCPUs, 64GB RAM). LiteRT doesn't support models at this scale.

**What would actually help speed:**
1. **GPU VM for the bridge** — Move from E8s_v3 (CPU only) to an `NC`/`NV` series VM with NVIDIA GPU. Ollama has GPU support out of the box. Expect 10–20x speedup.
2. **Smaller model** — Swap `gemma4:26b` for `gemma4:12b` or `gemma3:4b` for 3–5x faster responses at the cost of quality.
3. **Flash Attention + quantization** — Already in Ollama via GGUF. No extra config needed.

---

## Files Modified This Session

- `services/fullstack-gateway/app/api/tour_routes.py` — `_call_gemma4()` fix (system field)
- `services/fullstack-gateway/pyproject.toml` — added `python-multipart>=0.0.9`
- `infra/containerapps/fullstack-gateway.bicep` — probe paths, google-ai-api-key secret
- `services/fullstack-gateway/app/core/config.py` — `GOOGLE_AI_API_KEY` field (prior session)
- `services/fullstack-gateway/app/services/gemini_vision.py` — Gemini Vision + Imagen 3 service (prior session)
