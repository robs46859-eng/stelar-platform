# Stelar Platform — Handoff

**Updated:** 2026-05-19 (Phase 4 deploy in progress)  
**Host:** Azure VM `gemmaco-key` · eastus2 · Standard_E8s_v3  
**Repo:** `/mnt/gemma4/stelar-platform` → `git@github.com:robs46859-eng/stelar-platform.git`  
**Branch:** `main` (protected) · `staging` (integration buffer)

---

## Current Phase: 3 Complete → 4 Next

| Phase | Status | Summary |
|---|---|---|
| 0 — Governance | ✅ Complete | Hooks, CODEOWNERS, Arkham scaffold, branch strategy |
| 1 — VM Infrastructure | ✅ Complete | Ollama 0.24, Gemma 4 26B loaded, inference bridge active |
| 2 — Azure Cloud | ✅ Complete | All infra provisioned, all 10 DB schemas created, all secrets in KV |
| 3 — Core Services | ✅ Complete | Gateway live + responding, stelarpeople TS, Bicep, Arkham, hermes paths |
| 4 — Deploy to Container Apps | 🟡 In progress | Images pushed; first deploy timed out on gateway revision; gateway identity roles added; redeploy running |
| 5 — Web Apps | 🟡 Partial | stelarvacay-web scaffolded; stelargem-web, stelarpeople-web, dashboard not started |
| 6 — AiSquad | 🟡 Partial | Paths fixed, monitors not wired, Chrome sandbox broken |
| 7 — Security | ❌ Not started | Private endpoints, VNET integration |
| 8 — Launch | ❌ Not started | |

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

## Immediate Next Steps (Phase 4 — Deploy)

### 1. Deploy all services to Azure Container Apps
```bash
cd /mnt/gemma4/stelar-platform
bash infra/containerapps/deploy.sh
# OR directly:
az deployment group create \
  --resource-group rg-stelar-prod \
  --template-file infra/containerapps/main.bicep \
  --parameters containerAppsEnvName=cae-stelar-prod keyVaultName=kv-stelar-prod
```

**Prerequisite status:** Complete — all four `:latest` images are in `acrstelarprod`. Gateway identity has `AcrPull` and `Key Vault Secrets User`; later app identities may need the same roles if their first revisions time out.

### 2. Wire gateway DATABASE_URL env var in Bicep
Complete — `POSTGRES-URL-PSYCOPG` exists in Key Vault and `fullstack-gateway.bicep` maps it to `DATABASE_URL`.

### 3. Build remaining web apps (Phase 5)
- `stelarpeople-web` — React property management dashboard
- `stelargem-web` — neighborhood graph explorer
- `fullstack-dashboard` — operator/admin dashboard

### 4. AiSquad wiring (Phase 6)
- Fix Chrome sandbox: `--no-sandbox` flag or run in Docker with proper kernel caps
- Connect AiSquad agent calls → Gateway `POST /v1/proxy/infer` with `inference:invoke` key

---

## Architecture Snapshot

```
Internet
  └── Azure Container Apps ingress (cae-stelar-prod)
        ├── stelarvacay-api     (:3000) external  → fullstack-gateway → VM:18080 → Ollama
        ├── stelarvacay-web     (:4173) external
        ├── stelarpeople-api    (:3847) external  → fullstack-gateway → VM:18080 → Ollama
        └── fullstack-gateway   (:8000) internal  → VM inference bridge (127.0.0.1:18080)

VM (gemmaco-key · 20.10.150.44)
  ├── /mnt/gemma4/stelar-platform     ← monorepo (git pull here)
  ├── /mnt/gemma4/ollama               ← Gemma 4 26B model weights
  ├── /opt/fullstack-ollama-bridge     ← Python inference bridge (:18080)
  ├── /tmp/gw-venv                     ← gateway Python venv
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
