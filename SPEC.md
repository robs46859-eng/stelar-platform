# SPEC.md — Stelar / FullStack Azure Gemma 4 Deployment

**Version:** 2.0  
**Date:** 2026-05-19  
**Cloud target:** Microsoft Azure first  
**Model host:** Azure VM with Ollama  
**Primary model:** `gemma4:26b`  
**Model size:** 25.8B parameters  
**Quantization:** Q4_K_M GGUF  
**Managed disk:** `gemma4-data-disk`  
**Mount path:** `/mnt/gemma4`  
**Ollama model directory:** `/mnt/gemma4/ollama`  
**Ollama service URL:** `http://localhost:11434` on the VM  
**Secret name:** `gemmaco-key` in Azure Key Vault  

---

## 1. Purpose

This specification defines the Azure-first implementation for the Stelar product ecosystem powered by Gemma 4 through Ollama. The architecture removes Render, GCS, Supabase, and Firebase from the production path and replaces them with Microsoft Azure services wherever practical.

The system keeps the Gemma 4 26B model on the Azure VM for direct control, predictable storage, and fast local inference. Customer-facing applications, APIs, workers, queues, dashboards, and scheduled jobs run through Azure-managed services, primarily Azure Container Apps.

---

## 2. Product Naming Standards

For this deployment instance, use the following names everywhere in UI, code comments, routes, docs, logs, dashboards, billing metadata, and agent prompts.

| Previous Name | Current Name | Role |
|---|---|---|
| MamaNav | **StelarGem** | Spatial intelligence, local movement, neighborhood graph, corridor data |
| CheapVacay | **StelarVacay** | Budget-first travel planning and itinerary intelligence |
| RentOut | **StelarPeople** | Property/operator management and specialist property agents |
| 45-agent marketing squad | **FullStack AiSquad** | Growth, acquisition, engagement, funnel, compliance, and partner agents |
| FullStack Gateway | **FullStack Gateway** | Shared AI routing, auth, telemetry, policy, provider adapter |
| Arkham | **Arkham Governance Sidecar** | Red-team, compliance, safety, claim review, approval gates |

Customer-facing products use the **Stelar** namespace. Infrastructure, orchestration, and agent operations use the **FullStack** namespace. Governance and red-team systems use the **Arkham** namespace.

---

## 3. Non-Negotiable Project Standards

### 3.1 Cloud Standards

1. Microsoft Azure is the default deployment environment.
2. Remove Render from production deployment.
3. Remove GCS from production storage.
4. Remove Supabase from production auth/database/storage.
5. Remove Firebase from production hosting/auth/storage.
6. Google APIs may be used only when required for model access, search, maps, translation, or compatibility, and must be wrapped through FullStack Gateway.
7. No secret may be stored in code, `.env` committed files, Docker images, frontend bundles, or agent memory.
8. All production secrets must live in Azure Key Vault.
9. All Azure services must use managed identity where supported.
10. Customer-facing apps must not call Ollama directly.

### 3.2 VM and Model Standards

The Azure VM is the dedicated private inference box for Gemma 4 26B.

Required VM standards:

```text
Managed disk name: gemma4-data-disk
Mount path: /mnt/gemma4
Ollama model directory: /mnt/gemma4/ollama
Systemd environment: OLLAMA_MODELS=/mnt/gemma4/ollama
Ollama listen target: localhost:11434
Model name: gemma4:26b
Parameters: 25.8B
Quantization: Q4_K_M GGUF
```

Ollama must stay bound to localhost unless the VM is placed behind a private network boundary and protected by FullStack Gateway. Do not expose port `11434` publicly.

### 3.3 Application Standards

1. All public app traffic enters through Azure Container Apps ingress or Azure Front Door/Application Gateway if added later.
2. APIs communicate with the VM inference service through a private channel.
3. All AI calls are routed through FullStack Gateway.
4. All outbound content created by FullStack AiSquad passes through Arkham Governance before publication.
5. All product events must be logged into Azure-native observability.
6. Every service must expose `/health` and `/ready`.
7. Every service must emit structured JSON logs.
8. Every service must include `tenant_id`, `product`, `agent_name`, `request_id`, and `trace_id` where applicable.

---

## 4. Target Azure Architecture

```text
Internet
  |
  v
Azure Container Apps Ingress / optional Azure Front Door
  |
  +--> stelargem-web
  +--> stelarvacay-web
  +--> stelarpeople-web
  +--> fullstack-api
  +--> fullstack-dashboard
  |
  v
FullStack Gateway API
  |
  +--> Azure Key Vault: gemmaco-key and app secrets
  +--> Azure SQL or Azure Database for PostgreSQL
  +--> Azure Cache for Redis
  +--> Azure Storage Account / Blob Storage
  +--> Azure Service Bus / Storage Queues
  +--> Application Insights / Log Analytics
  |
  v
Private VM inference bridge
  |
  v
Azure VM
  |
  +--> Ollama localhost:11434
  +--> /mnt/gemma4 mounted from gemma4-data-disk
  +--> /mnt/gemma4/ollama model store
  +--> gemma4:26b Q4_K_M GGUF
```

---

## 5. Azure Services by Function

| Function | Azure Service | Reason |
|---|---|---|
| Public app hosting | Azure Container Apps | Managed containers, autoscale, TLS/custom domains, jobs |
| API hosting | Azure Container Apps | Same deployment model across all products |
| Background workers | Azure Container Apps Jobs | Agent tasks, scheduled jobs, queue workers |
| Model host | Azure VM | Existing Ollama/Gemma install, persistent model disk, direct control |
| Model disk | Azure Managed Disk `gemma4-data-disk` | Persistent model storage independent of OS disk |
| Secret storage | Azure Key Vault | Central secrets and key management |
| Identity | Microsoft Entra ID + Managed Identity | No static cloud credentials in apps |
| Primary database | Azure Database for PostgreSQL Flexible Server | App data, tenants, users, properties, trips, worldgraph |
| Alternative DB | Azure SQL Database | Use only if Microsoft SQL tooling is preferred |
| Cache | Azure Cache for Redis | Semantic cache, rate limits, sessions, queue locks |
| Object storage | Azure Blob Storage | Inspection photos, PDFs, audio, exports, generated files |
| Queue/events | Azure Service Bus | Agent jobs, compliance queues, publish approval queues |
| Lightweight queue option | Azure Storage Queue | Lower-cost simple background task queue |
| Observability | Azure Monitor + Application Insights + Log Analytics | Logs, traces, metrics, alerts |
| Container registry | Azure Container Registry | Private image registry |
| Domain/TLS | Azure Container Apps custom domains + managed certs | Product domains and HTTPS |
| CI/CD | GitHub Actions or Azure DevOps | Build, test, deploy |

---

## 6. Core Components

### 6.1 FullStack Gateway

FullStack Gateway is the only component allowed to invoke Gemma. It exposes an OpenAI-compatible internal API for StelarGem, StelarVacay, StelarPeople, and FullStack AiSquad.

Required endpoints:

```text
GET  /health
GET  /ready
POST /v1/ai/chat
POST /v1/ai/generate
POST /v1/ai/embeddings
POST /v1/agents/run
POST /v1/governance/review
GET  /v1/usage/summary
```

Required responsibilities:

1. Normalize requests from all products.
2. Add tenant, product, and agent metadata.
3. Route Gemma calls to the VM inference bridge.
4. Enforce rate limits.
5. Apply prompt templates and system policies.
6. Send external-facing content through Arkham when required.
7. Log usage, latency, token estimates, cost estimates, and result quality.
8. Prevent raw model endpoints from being exposed to public clients.

### 6.2 VM Inference Bridge

The inference bridge is a small internal service or gateway process that runs on the Azure VM or a private Container App with access to the VM. It converts FullStack Gateway requests into Ollama calls.

Preferred implementation:

```text
FullStack Gateway Container App
  -> private HTTP or WireGuard/Tailscale/VNet route
  -> VM inference bridge
  -> Ollama localhost:11434
```

The bridge exposes only restricted internal endpoints:

```text
GET  /health
GET  /ready
POST /ollama/chat
POST /ollama/generate
```

It must never expose arbitrary Ollama model management commands to public services.

### 6.3 StelarGem

StelarGem is the spatial intelligence and behavioral map layer.

Core modules:

1. Neighborhood profile service.
2. Corridor activity scoring.
3. Local movement event ingestion.
4. Safety and friction reporting.
5. Property/travel spatial overlay API.
6. Worldgraph contribution pipeline.

Gemma use cases:

1. Summarize neighborhood changes.
2. Cluster corridor signals.
3. Explain local movement patterns.
4. Convert raw telemetry into human-readable local intelligence.
5. Generate personalized local recommendations.

### 6.4 StelarVacay

StelarVacay is the budget-first travel planning system.

Core modules:

1. Deterministic quote engine.
2. Destination catalog.
3. Itinerary builder.
4. Budget compression agent.
5. Travel safety and logistics review.
6. Saved plans and user travel memory.

Gemma use cases:

1. Interpret user travel intent.
2. Generate itinerary options from deterministic plan data.
3. Rewrite plans for lower cost.
4. Explain tradeoffs.
5. Personalize pacing and risk level.
6. Create multilingual travel guidance if Google or Microsoft translation is configured.

### 6.5 StelarPeople

StelarPeople is the property/operator intelligence system.

Core modules:

1. Property intake.
2. Leasing workflow.
3. Maintenance intake and dispatch.
4. Tenant screening support.
5. Owner reports.
6. Compliance drafting.
7. StelarGem neighborhood overlays.

Gemma use cases:

1. Draft listings.
2. Summarize tenant conversations.
3. Triage maintenance issues.
4. Draft owner reports.
5. Explain corridor/property trends.
6. Generate compliance-aware operational recommendations.

### 6.6 FullStack AiSquad

FullStack AiSquad is the 45-agent marketing and growth layer.

Required agent groups:

1. Base orchestration agents.
2. Revenue agents.
3. Product agents.
4. Media agents.
5. Engagement agents.
6. Compliance Reviewer.
7. Funnel Manager.
8. Partnership Scout.

Non-negotiable publishing rule:

```text
No external post, email, affiliate claim, landing page, sales copy, public product claim, health-touching copy, travel safety claim, legal/property claim, or partner outreach may publish without Arkham Governance review and human approval.
```

---

## 7. Data Architecture

### 7.1 Database

Use Azure Database for PostgreSQL Flexible Server as the default database.

Required schemas:

```text
identity
billing
products
stelargem
stelarvacay
stelarpeople
agents
governance
worldgraph
telemetry
```

Minimum tables:

```text
tenants
users
sessions
api_keys
properties
property_events
maintenance_requests
lease_workflows
travel_plans
travel_quotes
destination_catalog
movement_events
corridor_scores
worldgraph_entities
worldgraph_edges
agent_runs
agent_messages
governance_reviews
publish_queue
usage_ledger
```

### 7.2 Storage

Use Azure Blob Storage.

Containers:

```text
stelargem-media
stelarvacay-plans
stelarpeople-inspections
fullstack-exports
arkham-reviews
logs-archive
```

### 7.3 Queues

Use Azure Service Bus for reliable queues.

Queues/topics:

```text
agent-run-requests
agent-run-results
governance-review-requests
publish-approval-queue
email-draft-queue
spatial-enrichment-queue
travel-plan-generation-queue
property-report-generation-queue
```

---

## 8. Security Architecture

### 8.1 Key Vault

Create or use an Azure Key Vault and store `gemmaco-key` there.

Required secrets:

```text
gemmaco-key
POSTGRES-URL
REDIS-URL
SERVICEBUS-CONNECTION
BLOB-STORAGE-CONNECTION
JWT-SIGNING-KEY
FULLSTACK-INTERNAL-API-KEY
OLLAMA-BRIDGE-SHARED-SECRET
GOOGLE-API-KEY-OPTIONAL
MICROSOFT-TRANSLATOR-KEY-OPTIONAL
```

Apps must retrieve secrets through managed identity, not checked-in `.env` files.

### 8.2 Network Rules

1. Ollama binds to `localhost:11434` on the VM.
2. The VM allows inbound inference traffic only from FullStack Gateway or the private inference bridge path.
3. Public internet cannot reach `11434`.
4. SSH access must be restricted by IP or Just-in-Time access if Microsoft Defender for Cloud is enabled.
5. Container Apps use managed identity to access Key Vault, database, storage, and queues where supported.
6. Use private endpoints for database, Redis, Key Vault, and storage when budget and complexity allow.

### 8.3 Governance Rules

Arkham must review:

1. Public marketing copy.
2. Health-touching copy.
3. Travel safety guidance.
4. Property/legal/compliance copy.
5. Tenant-screening recommendations.
6. Financial or accounting recommendations.
7. Affiliate and partner copy.
8. Any agent-created outbound message.

---

## 9. VM Installation and Verification

This section assumes the VM already exists and Gemma 4 26B is already downloaded through Ollama. These commands verify and standardize the installation.

### 9.1 Verify Disk Mount

```bash
lsblk
findmnt /mnt/gemma4
df -h /mnt/gemma4
```

Expected:

```text
/mnt/gemma4 is mounted from gemma4-data-disk or its attached block device.
```

If not mounted, identify the disk:

```bash
lsblk -o NAME,SIZE,FSTYPE,MOUNTPOINT,MODEL
```

Create mount directory if missing:

```bash
sudo mkdir -p /mnt/gemma4
sudo chown -R ollama:ollama /mnt/gemma4 || true
```

Persist mount in `/etc/fstab` using the disk UUID, not `/dev/sdX` names:

```bash
sudo blkid
sudo nano /etc/fstab
```

Example fstab line:

```text
UUID=<DISK_UUID> /mnt/gemma4 ext4 defaults,nofail 0 2
```

Then test:

```bash
sudo mount -a
findmnt /mnt/gemma4
```

### 9.2 Verify Ollama Systemd Configuration

Open the service override:

```bash
sudo systemctl edit ollama
```

Required override:

```ini
[Service]
Environment="OLLAMA_MODELS=/mnt/gemma4/ollama"
```

Reload and restart:

```bash
sudo systemctl daemon-reload
sudo systemctl restart ollama
sudo systemctl status ollama --no-pager
```

Verify environment:

```bash
sudo systemctl show ollama --property=Environment
```

Expected:

```text
Environment=OLLAMA_MODELS=/mnt/gemma4/ollama
```

### 9.3 Verify Ollama Local API

```bash
curl http://localhost:11434/api/tags
```

Expected model list includes:

```text
gemma4:26b
```

Verify generation:

```bash
curl http://localhost:11434/api/generate \
  -H 'Content-Type: application/json' \
  -d '{"model":"gemma4:26b","prompt":"Return exactly: stelar-ready","stream":false}'
```

Expected output contains:

```text
stelar-ready
```

### 9.4 Verify Model Storage Path

```bash
sudo du -sh /mnt/gemma4/ollama
sudo find /mnt/gemma4/ollama -maxdepth 3 -type f | head -50
```

The model files must be under `/mnt/gemma4/ollama`, not the OS disk.

### 9.5 Lock Down Ollama

Check listening address:

```bash
sudo ss -ltnp | grep 11434
```

Preferred result:

```text
127.0.0.1:11434
```

If Ollama is exposed on `0.0.0.0`, restrict it unless a private network gateway is intentionally configured.

Recommended default:

```ini
[Service]
Environment="OLLAMA_HOST=127.0.0.1:11434"
Environment="OLLAMA_MODELS=/mnt/gemma4/ollama"
```

Restart:

```bash
sudo systemctl daemon-reload
sudo systemctl restart ollama
```

---

## 10. Inference Bridge Installation

Create a small FastAPI bridge on the VM to control model access.

### 10.1 Directory

```bash
sudo mkdir -p /opt/fullstack-ollama-bridge
sudo chown -R $USER:$USER /opt/fullstack-ollama-bridge
cd /opt/fullstack-ollama-bridge
```

### 10.2 Python Environment

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install fastapi uvicorn httpx pydantic
```

### 10.3 Bridge App

Create `app.py`:

```python
import os
import httpx
from fastapi import FastAPI, Header, HTTPException
from pydantic import BaseModel

OLLAMA_URL = os.getenv("OLLAMA_URL", "http://127.0.0.1:11434")
MODEL_NAME = os.getenv("OLLAMA_MODEL", "gemma4:26b")
BRIDGE_SECRET = os.getenv("OLLAMA_BRIDGE_SHARED_SECRET", "CHANGE_ME")

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


def require_secret(x_fullstack_bridge_key: str | None):
    if not x_fullstack_bridge_key or x_fullstack_bridge_key != BRIDGE_SECRET:
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
```

### 10.4 Bridge Systemd Service

Create `/etc/systemd/system/fullstack-ollama-bridge.service`:

```ini
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
Environment="OLLAMA_BRIDGE_SHARED_SECRET=<LOAD_FROM_KEY_VAULT_OR_SECURE_FILE>"

[Install]
WantedBy=multi-user.target
```

Start it:

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now fullstack-ollama-bridge
sudo systemctl status fullstack-ollama-bridge --no-pager
```

Local test:

```bash
curl http://127.0.0.1:18080/health
```

---

## 11. Azure Resource Setup

Set variables:

```bash
export AZ_SUBSCRIPTION_ID="d3a405bf-c7f7-4480-8fc0-a0762ebbb5c0"
export AZ_LOCATION="eastus2"
export AZ_RG="rg-stelar-prod"
export AZ_ACA_ENV="cae-stelar-prod"
export AZ_ACR="acrstelarprod" # remove space; must be globally unique lowercase
export AZ_KEYVAULT="kv-stelar-prod" # must be globally unique
```

Login:

```bash
az login
az account set --subscription "$AZ_SUBSCRIPTION_ID"
```

Create resource group:

```bash
az group create \
  --name "$AZ_RG" \
  --location "$AZ_LOCATION"
```

Create Container Apps environment:

```bash
az containerapp env create \
  --name "$AZ_ACA_ENV" \
  --resource-group "$AZ_RG" \
  --location "$AZ_LOCATION"
```

Create Key Vault:

```bash
az keyvault create \
  --name "$AZ_KEYVAULT" \
  --resource-group "$AZ_RG" \
  --location "$AZ_LOCATION" \
  --enable-rbac-authorization true
```

Store `gemmaco-key`:

```bash
az keyvault secret set \
  --vault-name "$AZ_KEYVAULT" \
  --name "gemmaco-key" \
  --value "<actual-secret-value>"
```

Create Azure Container Registry:

```bash
az acr create \
  --resource-group "$AZ_RG" \
  --name "<globally-unique-acr-name>" \
  --sku Basic \
  --admin-enabled false
```

---

## 12. Container Apps Deployment Layout

Deploy these Container Apps:

```text
fullstack-gateway
fullstack-dashboard
stelargem-api
stelargem-web
stelarvacay-api
stelarvacay-web
stelarpeople-api
stelarpeople-web
arkham-governance
fullstack-aisquad-worker
fullstack-aisquad-scheduler
```

Minimum environment variables for every app:

```text
APP_ENV=production
AZURE_KEY_VAULT_NAME=kv-stelar-prod
FULLSTACK_GATEWAY_URL=https://api.<domain>
LOG_LEVEL=info
```

Minimum environment variables for FullStack Gateway:

```text
GEMMA_PROVIDER=ollama-vm
GEMMA_MODEL=gemma4:26b
GEMMA_MODEL_PARAMETERS=25.8B
GEMMA_QUANTIZATION=Q4_K_M
OLLAMA_BRIDGE_URL=<private bridge URL>
OLLAMA_BRIDGE_SECRET_NAME=OLLAMA-BRIDGE-SHARED-SECRET
KEYVAULT_SECRET_NAME=gemmaco-key
```

---

## 13. FullStack Gateway Provider Configuration

Add this provider entry:

```yaml
providers:
  gemma4_26b_ollama_vm:
    type: ollama_bridge
    display_name: Gemma 4 26B on Azure VM
    model: gemma4:26b
    parameters: 25.8B
    quantization: Q4_K_M
    endpoint: ${OLLAMA_BRIDGE_URL}
    auth_header: X-FullStack-Bridge-Key
    auth_secret_ref: OLLAMA-BRIDGE-SHARED-SECRET
    timeout_seconds: 180
    max_retries: 2
    default_temperature: 0.2
    public_access: false
    allowed_products:
      - stelargem
      - stelarvacay
      - stelarpeople
      - fullstack-aisquad
      - arkham
```

Routing defaults:

```yaml
routes:
  stelargem.spatial_summary:
    provider: gemma4_26b_ollama_vm
    governance: standard

  stelarvacay.itinerary_generate:
    provider: gemma4_26b_ollama_vm
    governance: travel_safety_review

  stelarpeople.leasing_agent:
    provider: gemma4_26b_ollama_vm
    governance: property_compliance_review

  fullstack_aisquad.external_copy:
    provider: gemma4_26b_ollama_vm
    governance: hard_publish_block

  arkham.compliance_review:
    provider: gemma4_26b_ollama_vm
    governance: self_check_required
```

---

## 14. Repository Standards

Recommended monorepo layout:

```text
/stelar-platform
  /apps
    /stelargem-web
    /stelargem-api
    /stelarvacay-web
    /stelarvacay-api
    /stelarpeople-web
    /stelarpeople-api
    /fullstack-dashboard
  /services
    /fullstack-gateway
    /arkham-governance
    /fullstack-aisquad        # FullStack AiSquad service root; no nested hermes-workspace app root
    /ollama-bridge
  /packages
    /shared-types
    /auth
    /telemetry
    /agent-sdk
    /governance-sdk
  /infra
    /azure
    /containerapps
    /bicep
    /scripts
  /docs
    /runbooks
    /security
    /launch
  SPEC.md
```

### 14.1 Graphify Knowledge Graph

The repo keeps a local graphify knowledge graph under `graphify-out/`.

Required workflow:

```bash
# Before architecture or cross-module work
cat graphify-out/GRAPH_REPORT.md

# After code edits
graphify update .
```

The Azure VM has Node 20 and `@nodesify/graphify` installed. The `graphify` command is an alias to `nodesify-graphify`.

### 14.2 FullStack AiSquad Path Standard

FullStack AiSquad lives at:

```text
services/fullstack-aisquad/
```

The former nested workspace path is retired:

```text
services/fullstack-aisquad/hermes-workspace/
```

All new AiSquad application code, scripts, agent docs, triggers, package metadata, and launch notes belong in the service root. Runtime profile/session state may remain under `services/fullstack-aisquad/hermes-config/` until promoted or migrated.

Branch standards:

```text
main        production-ready
staging     integration testing
feature/*   short-lived feature work
hotfix/*    urgent production fixes
```

Commit standards:

```text
feat(stelargem): add corridor summary endpoint
fix(gateway): protect ollama bridge timeout
chore(infra): add Key Vault secret refs
sec(arkham): enforce publish block on claims
```

---

## 15. API Standards

Every API response must include:

```json
{
  "request_id": "...",
  "status": "ok|error",
  "data": {},
  "error": null
}
```

Every AI run must store:

```text
request_id
tenant_id
product
agent_name
provider
model
prompt_hash
input_token_estimate
output_token_estimate
latency_ms
cache_hit
policy_result
governance_review_id
created_at
```

---

## 16. FullStack AiSquad Operating Rules

FullStack AiSquad must operate as an approval-gated marketing system.

Workflow:

```text
Signal Monitor
  -> Signal Orchestrator
  -> Engagement Writer
  -> Compliance Reviewer
  -> Arkham Governance
  -> Human Approval
  -> Funnel Manager
  -> Publish / Send / Schedule
  -> Analytics Review
```

Hard blocks:

1. No auto-posting in first 90 days.
2. No medical, legal, tenant-screening, financial, or safety claims without review.
3. No outreach send without human approval.
4. No affiliate link creation without partner approval.
5. No scraped private data.
6. No platform spam or burner-account automation.

---

## 17. Deployment Procedure

### 17.1 VM First

Run:

```bash
findmnt /mnt/gemma4
sudo systemctl show ollama --property=Environment
curl http://localhost:11434/api/tags
curl http://localhost:11434/api/generate \
  -H 'Content-Type: application/json' \
  -d '{"model":"gemma4:26b","prompt":"Return exactly: vm-ready","stream":false}'
```

Do not deploy product apps until the VM returns `vm-ready`.

### 17.2 Gateway Second

Deploy FullStack Gateway to Container Apps.

Required checks:

```bash
curl https://api.<domain>/health
curl https://api.<domain>/ready
curl -X POST https://api.<domain>/v1/ai/generate \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <internal-token>' \
  -d '{"product":"system","agent_name":"smoke_test","prompt":"Return exactly: gateway-ready"}'
```

### 17.3 Governance Third

Deploy Arkham Governance.

Required checks:

```bash
curl https://arkham.<domain>/health
curl https://arkham.<domain>/ready
```

Test a blocked claim:

```json
{
  "claim": "This will guarantee rental approval and cure travel anxiety.",
  "channel": "public_post",
  "product": "stelarpeople"
}
```

Expected:

```text
blocked
```

### 17.4 Product APIs Fourth

Deploy:

```text
stelargem-api
stelarvacay-api
stelarpeople-api
```

Smoke tests:

```bash
curl https://stelargem-api.<domain>/health
curl https://stelarvacay-api.<domain>/health
curl https://stelarpeople-api.<domain>/health
```

### 17.5 Web Apps Fifth

Deploy:

```text
stelargem-web
stelarvacay-web
stelarpeople-web
fullstack-dashboard
```

Verify:

1. Login works.
2. API calls return JSON, not HTML fallbacks.
3. Gateway calls return Gemma output.
4. Governance queue catches publishable content.
5. Logs appear in Application Insights.

---

## 18. Launch Checklist

### 18.1 Infrastructure

- [ ] `gemma4-data-disk` attached to VM.
- [ ] `/mnt/gemma4` mounted persistently.
- [ ] Ollama service uses `OLLAMA_MODELS=/mnt/gemma4/ollama`.
- [ ] `gemma4:26b` appears in `ollama list` or `/api/tags`.
- [ ] Ollama listens only on localhost.
- [ ] Inference bridge is installed and protected.
- [ ] `gemmaco-key` exists in Azure Key Vault.
- [ ] Container Apps environment exists.
- [ ] Container Registry exists.
- [ ] Database exists.
- [ ] Blob containers exist.
- [ ] Service Bus queues exist.
- [ ] Application Insights is connected.

### 18.2 Product

- [ ] StelarGem beta routes live.
- [ ] StelarVacay planner live.
- [ ] StelarPeople operator intake live.
- [ ] FullStack AiSquad review queue live.
- [ ] Arkham hard blocks enabled.
- [ ] Human approval dashboard live.
- [ ] All public copy uses updated names.
- [ ] No old MamaNav/CheapVacay/RentOut labels in UI.

### 18.3 Security

- [ ] No secrets in repo.
- [ ] No public Ollama port.
- [ ] No direct frontend model calls.
- [ ] Managed identities configured.
- [ ] Key Vault access scoped.
- [ ] Database firewall restricted.
- [ ] Storage containers private by default.
- [ ] Logs do not contain raw secrets or sensitive user content.

---

## 19. Day-One Operating Model

### 19.1 What Runs on the VM

```text
Ollama
Gemma 4 26B model files
Inference bridge
Model health scripts
Disk monitoring scripts
Optional local semantic cache
```

### 19.2 What Runs in Azure Container Apps

```text
FullStack Gateway
FullStack Dashboard
StelarGem API and web
StelarVacay API and web
StelarPeople API and web
Arkham Governance
FullStack AiSquad workers
Schedulers
Queue processors
```

### 19.3 What Runs in Azure Managed Services

```text
Key Vault
PostgreSQL
Blob Storage
Service Bus
Redis
Application Insights
Log Analytics
Container Registry
Managed Certificates
```

---

## 20. Backup and Recovery

### 20.1 VM Backup

Back up:

```text
/mnt/gemma4/ollama
/opt/fullstack-ollama-bridge
/etc/systemd/system/ollama.service.d
/etc/systemd/system/fullstack-ollama-bridge.service
```

Use Azure Backup or scheduled disk snapshots for `gemma4-data-disk`.

### 20.2 Database Backup

Enable automated PostgreSQL backups.

Minimum retention:

```text
7 days for beta
35 days for production
```

### 20.3 Blob Backup

Enable soft delete and versioning for production containers.

---

## 21. Monitoring and Alerts

Create alerts for:

```text
VM CPU > 85% for 10 minutes
VM memory > 85% for 10 minutes
/mnt/gemma4 disk usage > 80%
Ollama health failure
Inference bridge health failure
Gateway 5xx rate > 2%
Gateway latency p95 > 30 seconds
Queue depth > threshold
Arkham review backlog > threshold
Database connections > 80%
Container restart count > threshold
```

---

## 22. Immediate Build Order

1. Verify VM disk, Ollama, and Gemma 4 26B.
2. Lock Ollama to localhost.
3. Install inference bridge.
4. Create Azure Key Vault and add `gemmaco-key`.
5. Create Azure Container Apps environment.
6. Deploy FullStack Gateway.
7. Wire Gateway to inference bridge.
8. Deploy Arkham Governance.
9. Deploy StelarVacay first because deterministic quote logic is simplest.
10. Deploy StelarGem second because it feeds spatial intelligence.
11. Deploy StelarPeople third because property workflows require stronger governance.
12. Deploy FullStack AiSquad with hard human approval gates.
13. Add domains and TLS.
14. Run end-to-end smoke tests.
15. Open beta traffic.

---

## 23. Done Definition

The deployment is considered ready when:

1. `gemma4:26b` responds from the VM through FullStack Gateway.
2. No app calls Ollama directly.
3. All products use new Stelar names.
4. FullStack AiSquad can draft but not auto-publish.
5. Arkham can block unsafe claims.
6. Azure Key Vault contains `gemmaco-key` and all production secrets.
7. `/mnt/gemma4` survives VM reboot.
8. Container Apps expose healthy production endpoints.
9. Logs and traces appear in Azure Monitor.
10. Old Render/GCS/Supabase/Firebase dependencies are removed from production configuration.

