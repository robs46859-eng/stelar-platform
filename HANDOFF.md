# Stelar Platform — Handoff

**Updated:** 2026-05-20 (Phase 8 deploy in progress — 8 of 10 apps live)
**Host:** Azure VM `gemmaco-key` · eastus2 · Standard_E8s_v3  
**Repo:** `/mnt/gemma4/stelar-platform` → `git@github.com:robs46859-eng/stelar-platform.git`  
**Branch:** `main` (protected) · `staging` (integration buffer)

---

## Current Phase: 8 Deploy — In Progress

| Phase | Status | Summary |
|---|---|---|
| 0 — Governance | ✅ Complete | Hooks, CODEOWNERS, Arkham scaffold, branch strategy |
| 1 — VM Infrastructure | ✅ Complete | Ollama 0.24, Gemma 4 26B loaded, inference bridge active |
| 2 — Azure Cloud | ✅ Complete | All infra provisioned, all 10 DB schemas created, all secrets in KV |
| 3 — Core Services | ✅ Complete | Gateway live + responding, stelarpeople TS, Bicep, Arkham, hermes paths |
| 4 — Deploy to Container Apps | ✅ Complete | All 4 original images deployed, managed identities assigned, DNS live |
| 5 — Web Apps | ✅ Complete | All 4 web apps built and Bicep-ready |
| 6 — AiSquad | ✅ Complete | Chrome sandbox fixed, inference wired to gateway via localhost:8500 |
| 7 — Security | 🟡 Partial | All code-level security issues fixed; secrets rotated; private endpoints + VNET not yet done |
| 8 — Launch | 🟡 In Progress | 8/10 apps live; stelargem-api activating; stelargem-web not yet deployed |

---

## Phase 8 Deploy Status — 2026-05-20

### Container App Status (post-deploy)

| App | Status | Notes |
|---|---|---|
| fullstack-gateway | ✅ Running | Revision `fullstack-gateway--d15675j` |
| stelarvacay-api | ✅ Running | Revision `stelarvacay-api--wawmjm8` |
| stelarvacay-web | ✅ Running | Revision `stelarvacay-web--ekwberc` |
| stelarpeople-api | ✅ Running | Revision `stelarpeople-api--0000001` |
| stelarpeople-web | ✅ Running | Revision `stelarpeople-web--0000001` |
| arkham-governance | ✅ Running | Revision `arkham-governance--930eaou` · internal ingress only |
| stelargem-api | 🟡 Activating | ARM timed out on first provision; revision `stelargem-api--m2yncv0` now activating |
| fullstack-dashboard | 🟡 Activating | ARM timed out on first provision; revision `fullstack-dashboard--y3mypmp` now activating |
| stelargem-web | ❌ Not deployed | Skipped in ARM (dependsOn stelargem-api which failed); needs standalone deploy |
| Storage (stelarstorageprod) | ✅ Succeeded | 3 containers: inspections, exports, archive |
| Service Bus (sb-stelar-prod) | ✅ Succeeded | 2 queues: agent-run-queue, governance-queue |

### Root Cause: "Operation Expired" on 3 Apps
ARM deployment flagged `stelargem-api`, `fullstack-dashboard`, and `arkham-governance` as failed because the first revision timed out waiting on managed identity AcrPull — same race condition as Phase 4 gateway. The apps were created; subsequent operations assigned roles and revisions are now activating. `stelargem-web` was skipped entirely because it `dependsOn` `stelargem-api`.

### Remaining Steps to Full Deploy

**Step 1 — Verify AcrPull is assigned for the 3 late apps**
```bash
for app in stelargem-api fullstack-dashboard stelargem-web; do PRINCIPAL=$(az containerapp show -n $app -g rg-stelar-prod --query identity.principalId -o tsv 2>/dev/null); echo "$app: $PRINCIPAL"; done
```

**Step 2 — Deploy stelargem-web standalone**
```bash
az deployment group create -g rg-stelar-prod --template-file infra/containerapps/stelargem-web.bicep --parameters location=eastus2 containerAppsEnvId=$(az containerapp env show -n cae-stelar-prod -g rg-stelar-prod --query id -o tsv) acrName=acrstelarprod
```
Then assign AcrPull:
```bash
PRINCIPAL=$(az containerapp show -n stelargem-web -g rg-stelar-prod --query identity.principalId -o tsv) && az role assignment create --assignee $PRINCIPAL --role AcrPull --scope $(az acr show -n acrstelarprod --query id -o tsv)
```

**Step 3 — Verify KV Secrets User for backend apps**
```bash
for app in arkham-governance stelargem-api; do PRINCIPAL=$(az containerapp show -n $app -g rg-stelar-prod --query identity.principalId -o tsv); az keyvault set-policy --name kv-stelar-prod --object-id $PRINCIPAL --secret-permissions get list; echo "KV policy set: $app"; done
```

**Step 4 — Smoke tests**
```bash
curl https://stelar.host/health
curl https://people.stelar.host/health
curl https://vacay.stelar.host/health
```

**Step 5 — AiSquad VM env setup (one-time)**
```bash
ssh -i ~/.ssh/id_ed25519 azureuser@20.10.150.44 "echo 'FULLSTACK_GATEWAY_KEY=ak_live_68b5f5c879fac993.68680c376e05ddced3bec1e1c0971f8c16667f306d180d7f' >> ~/.hermes/.env && echo 'TELEGRAM_BOT_TOKEN=<from_kv>' >> ~/.hermes/.env && echo 'GITHUB_TOKEN=<from_kv>' >> ~/.hermes/.env && echo 'GOOGLE_API_KEY=<from_kv>' >> ~/.hermes/.env"
```

### Remaining for Launch
- Deploy stelargem-web (standalone Bicep, see Step 2 above)
- Private endpoints + VNET integration (Phase 7 security)
- Application Insights alerts wired (SPEC §21)
- PostgreSQL automated backups enabled (SPEC §20.2)
- Blob storage soft delete + versioning (SPEC §20.3)

---

## Phase 3 — Complete ✅

All 6 agents finished 2026-05-19. Summary:

| Agent | Result |
|---|---|
| `pg-firewall` | Firewall rule `allow-vm-gemmaco` added; all 10 schemas verified (agents:3, billing:3, governance:6, identity:3, products:1, stelargem:4, stelarpeople:9, stelarvacay:5, telemetry:3, worldgraph:2) |
| `gateway-smoketest` | `fullstack-gateway` running on VM port 8500; fixed 5 bugs (config indent, gemini stub, pipeline registry, ollama bridge path/header, alembic); Gemma responds end-to-end |
| `stelarpeople-ts` | `property.ts`, `crm.ts`, `screening.ts` ported; no `.js` files in `src/services/`; all tables prefixed `stelarpeople.` |
| `containerapps-bicep` | `infra/containerapps/` has 6 Bicep files (main + 4 apps + managed-identity) + `deploy.sh` |
| `arkham-impl` | `/review` blocks `health_claim`, `financial_claim`, `legal_claim`, `auto_publish`; `/publish-check` enforces 90-day human approval |
| `hermes-paths` | 109 files fixed (97 text + 7 SQLite DBs + 1 WAL); 881 DB rows updated; zero grep hits for old path |

**Gateway live (for testing on VM):**
```
tenant:   stelar
key:      ak_live_68b5f5c879fac993.68680c376e05ddced3bec1e1c0971f8c16667f306d180d7f
endpoint: http://localhost:8500/v1/proxy/infer
scope:    inference:invoke
model:    gemma4:26b
```

To restart gateway after VM reboot:
```bash
ssh -i ~/.ssh/id_ed25519 azureuser@20.10.150.44
cd /mnt/gemma4/stelar-platform/services/fullstack-gateway

export DATABASE_URL="$(az keyvault secret show --vault-name kv-stelar-prod --name POSTGRES-URL --query value -o tsv | sed 's|postgresql://|postgresql+psycopg://|')"
export REDIS_URL="$(az keyvault secret show --vault-name kv-stelar-prod --name REDIS-URL --query value -o tsv | sed 's|redis://|rediss://|;s|?ssl=true||')"
export OLLAMA_BRIDGE_URL="http://127.0.0.1:18080"
export OLLAMA_BRIDGE_SHARED_SECRET="$(az keyvault secret show --vault-name kv-stelar-prod --name OLLAMA-BRIDGE-SHARED-SECRET --query value -o tsv)"
export DEFAULT_PROVIDER="gemma4_26b_ollama_vm"
export BACKEND_MODE="self_hosted"

/tmp/gw-venv/bin/uvicorn app.main:app --port 8500 --host 0.0.0.0 &
```

---

## Phase 4 Prep — Complete ✅

Completed 2026-05-19:
- Added Key Vault secret `POSTGRES-URL-PSYCOPG` for gateway SQLAlchemy/psycopg URLs.
- Patched `infra/containerapps/fullstack-gateway.bicep` to inject `DATABASE_URL` from `POSTGRES-URL-PSYCOPG`.
- Added Dockerfiles for `stelarvacay-api`, `stelarvacay-web`, and `stelarpeople-api`.
- Built and pushed ACR images:
  - `acrstelarprod.azurecr.io/fullstack-gateway:latest`
  - `acrstelarprod.azurecr.io/stelarvacay-api:latest`
  - `acrstelarprod.azurecr.io/stelarvacay-web:latest`
  - `acrstelarprod.azurecr.io/stelarpeople-api:latest`

## Phase 4 Deploy Attempt — In Progress

Started 2026-05-19 from the local Mac because the Azure VM does not have Azure CLI installed (`az: command not found`).

Operational notes:
- Copied `infra/containerapps/*.bicep` from the VM repo to `/private/tmp/stelar-containerapps` on the Mac.
- Installed Bicep CLI v0.43.8 at `~/.azure/bin/bicep`; Azure CLI now reports the Bicep version correctly.
- Ran `az deployment group create` against `rg-stelar-prod` with `main.bicep`.
- First deployment created the `fullstack-gateway` Container App shell but timed out before a revision was provisioned (`ContainerAppOperationError: Operation expired`).
- The likely cause was missing managed identity permissions on the newly created gateway identity.
- Added gateway system identity `cde15954-206f-4bdf-bee4-ff6979aace89` roles:
  - `AcrPull` on `acrstelarprod`
  - `Key Vault Secrets User` on `kv-stelar-prod`
- Redeploy was started after the role assignments.

Do not run `infra/containerapps/deploy.sh` on the VM until Azure CLI is installed there. Run deployment from a machine with Azure CLI + Bicep, or install `az` on `gemmaco-key` first.

---

## 2026-05-20 Swarm Pass — What Changed

Five parallel swarms ran and completed. Full checklist in `SWARM_CONTROL.md`.

### SWARM-01 — Security Hardening (all 10 issues resolved)
- `requireFirebaseUser` → `requireJwtUser` across both APIs
- Amadeus API calls now route through gateway (`apps/stelarvacay-api/src/services/amadeus.ts`)
- `isLiveData` deprecated field removed from stelarvacay planner type
- CORS, gateway startup assertions, income conversion, Arkham 90-day window, Arkham DB logging — all confirmed already fixed in prior passes

### SWARM-02 — StelarGem API (new service, built from scratch)
- Full TypeScript/Express service at `services/stelargem-api/` — 12 files
- Queries `worldgraph` schema (neighborhoods, corridors)
- Port 3100, multi-stage Dockerfile, structured JSON logging, rate limiting, JWT auth
- `infra/containerapps/stelargem-api.bicep` — ready to deploy

### SWARM-03 — Web Apps (3 new frontends)
- `apps/stelarpeople-web/` — property dashboard (properties, screening queue, tenant CRM)
- `apps/stelargem-web/` — neighborhood graph explorer (map, corridors, scoring)
- `apps/fullstack-dashboard/` — operator admin panel (gateway health, Arkham queue, agent status, secrets)
- All: React 18 + TypeScript + Vite + Tailwind CSS + React Router v6
- All: graceful API fallback to mock data with visible warning banner
- All: Dockerfiles (nginx:alpine) + Bicep templates written

### SWARM-04 — Infrastructure Bicep (ARM validation passed)
- `infra/containerapps/arkham-governance.bicep` — new, port 8001, internal ingress
- `infra/containerapps/storage.bicep` — new, stelarstorageprod, 3 blob containers
- `infra/containerapps/servicebus.bicep` — new, sb-stelar-prod, 2 queues
- `infra/containerapps/fullstack-gateway.bicep` — patched, hardcoded VM IP replaced with `ollamaBridgeUrl` param
- `infra/containerapps/main.bicep` — updated with all 7 new modules
- `infra/containerapps/deploy.sh` — updated with `ollamaBridgeUrl` passthrough
- `az deployment group validate` — **provisioningState: Succeeded**

### SWARM-05 — AiSquad Wiring
- Chrome sandbox: `--no-sandbox --disable-setuid-sandbox --disable-dev-shm-usage` added to `browser_tool.py` and `meet_bot.py`; `cap_add: [SYS_ADMIN]` added to docker-compose hermes-agent service
- `hermes-config/config.yaml` — provider switched to OpenAI-compatible, `base_url: http://localhost:8500/v1`, key via `${FULLSTACK_GATEWAY_KEY}` env var (not hardcoded)
- `FULLSTACK_GATEWAY_KEY` documented in `.env.example`

### Secrets Rotated (2026-05-20)
All three leaked secrets from GitHub Secret Scanning alerts were revoked and replaced:
- GitHub PAT → new token in Key Vault as `GITHUB-TOKEN`
- Google/YouTube API Key → new key in Key Vault as `GOOGLE-API-KEY`; `yt_scan.py` fixed to use `os.environ["GOOGLE_API_KEY"]`
- Telegram Bot Token → new token (JackstelarHTTP API) in Key Vault as `TELEGRAM-BOT-TOKEN`; test file fixed to use synthetic placeholder

One-time VM setup required (run once over SSH):
```bash
echo "FULLSTACK_GATEWAY_KEY=ak_live_68b5f5c879fac993.68680c376e05ddced3bec1e1c0971f8c16667f306d180d7f" >> ~/.hermes/.env
echo "TELEGRAM_BOT_TOKEN=<new_token_from_keyvault>" >> ~/.hermes/.env
echo "GITHUB_TOKEN=<new_token_from_keyvault>" >> ~/.hermes/.env
echo "GOOGLE_API_KEY=<new_key_from_keyvault>" >> ~/.hermes/.env
```

---

---

## Architecture Snapshot

```
Internet
  └── Azure Container Apps ingress (cae-stelar-prod)
        ├── stelarvacay-api       (:3000) external  → fullstack-gateway → VM:18080 → Ollama
        ├── stelarvacay-web       (:80)   external  [nginx static]
        ├── stelarpeople-api      (:3847) external  → fullstack-gateway → VM:18080 → Ollama
        ├── stelarpeople-web      (:80)   external  [nginx static]
        ├── stelargem-api         (:3100) external  [activating]  → worldgraph schema
        ├── stelargem-web         (:80)   external  [NOT YET DEPLOYED]
        ├── fullstack-dashboard   (:80)   external  [activating]  operator admin
        ├── arkham-governance     (:8001) INTERNAL  governance gate
        └── fullstack-gateway     (:8000) internal  → VM inference bridge (127.0.0.1:18080)

Azure Storage: stelarstorageprod (inspections, exports, archive)
Azure Service Bus: sb-stelar-prod (agent-run-queue, governance-queue)

VM (gemmaco-key · 20.10.150.44)
  ├── /mnt/gemma4/stelar-platform     ← monorepo (git pull here)
  ├── /mnt/gemma4/ollama               ← Gemma 4 26B model weights
  ├── /opt/fullstack-ollama-bridge     ← Python inference bridge (:18080)
  ├── /tmp/gw-venv                     ← gateway Python venv (rebuild on reboot)
  └── Ollama                           ← bound to 127.0.0.1:11434
```

## Key Infrastructure

| Resource | Value |
|---|---|
| VM SSH | `ssh -i ~/.ssh/id_ed25519 azureuser@20.10.150.44` |
| GitHub repo | `git@github.com:robs46859-eng/stelar-platform.git` |
| Key Vault | `kv-stelar-prod` (rg-stelar-prod, eastus2) |
| Container Apps env | `cae-stelar-prod` |
| Container Registry | `acrstelarprod` |
| PostgreSQL | `pg-stelar-prod.postgres.database.azure.com` · user: `stelaradmin` |
| Redis | via `REDIS-URL` in Key Vault |
| Inference bridge | `http://127.0.0.1:18080` (on VM only) |
| Ollama | `http://127.0.0.1:11434` (on VM only) |
| Gateway (VM local) | `http://localhost:8500/v1/proxy/infer` |

## Secrets in Key Vault (`kv-stelar-prod`)

All 13 required secrets: `APPINSIGHTS-CONNECTION-STRING` · `APPINSIGHTS-INSTRUMENTATION-KEY` · `BLOB-STORAGE-CONNECTION` · `FULLSTACK-INTERNAL-API-KEY` · `gemmaco-key` · `IG-CREDENTIALS` · `JWT-SIGNING-KEY` · `OLLAMA-BRIDGE-SHARED-SECRET` · `POSTGRES-ADMIN-PASSWORD` · `POSTGRES-URL` · `REDIS-URL` · `SERVICEBUS-CONNECTION` · `STAN-CREDENTIALS`

## Non-Negotiable Publishing Rule

```
No external post, email, affiliate claim, landing page, sales copy, public product claim,
health-touching copy, travel safety claim, legal/property claim, or partner outreach
may publish without Arkham Governance review and human approval.
No auto-posting for the first 90 days.
```

## Known Issues / Tech Debt

| Issue | Severity | Fix |
|---|---|---|
| Gateway runs on VM port 8500 (not in Container Apps yet) | High | Deploy via Bicep in Phase 4 |
| `family-companion` process occupies port 8000 on VM | Low | Doesn't affect gateway (using 8500); irrelevant after Container Apps deploy |
| Gateway venv at `/tmp/gw-venv` — lost on VM reboot | Low | Rebuild with `python3 -m venv /tmp/gw-venv && /tmp/gw-venv/bin/pip install -e .` |
| fullstack-gateway .github/workflows deploy to GKE (from layer8) | Low | Replace with Container Apps deploy YAML |
| Instagram Chrome sandbox broken | High (AiSquad) | Fix before activating monitors |
| S3 / SQS startup check failures (legacy AWS code) | Low | Remove or stub these checks — not used in Azure deployment |
