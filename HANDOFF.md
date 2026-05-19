# Stelar Platform — Handoff

**Updated:** 2026-05-19  
**Host:** Azure VM `gemmaco-key` · eastus2 · Standard_E8s_v3  
**Repo:** `/mnt/gemma4/stelar-platform` → `git@github.com:robs46859-eng/stelar-platform.git`  
**Branch:** `main` (protected) · `staging` (integration buffer)

---

## Current Phase: 2 Complete → 3 In Progress

| Phase | Status | Summary |
|---|---|---|
| 0 — Governance | ✅ Complete | Hooks, CODEOWNERS, Arkham scaffold, branch strategy |
| 1 — VM Infrastructure | ✅ Complete | Ollama 0.24, Gemma 4 26B loaded, inference bridge active |
| 2 — Azure Cloud | ✅ Complete | All infra provisioned, all 10 DB schemas created, all secrets in KV |
| 3 — Core Services | 🟡 Scaffolded, not deployed | Gateway + product APIs exist, not running in Container Apps yet |
| 4 — Product APIs | 🟡 Scaffolded | stelarvacay-api, stelarpeople-api in repo, not deployed |
| 5 — Web Apps | ❌ Not started | stelarvacay-web scaffolded; stelargem-web, stelarpeople-web, dashboard not started |
| 6 — AiSquad | 🟡 Partial | Paths correct, monitors not wired, hermes config paths stale |
| 7 — Security | ❌ Not started | |
| 8 — Launch | ❌ Not started | |

---

## What Was Done in This Session (2026-05-19)

### Git / GitHub
- Created public repo: `https://github.com/robs46859-eng/stelar-platform`
- Generated SSH key on VM (`~/.ssh/id_ed25519`), registered on GitHub account `robs46859-eng`
- Removed a committed Node.js binary (118 MB) from all 10 commits via `git filter-branch`
- Pushed `main` and `staging` branches

### Credentials & Key Vault
- `STAN-CREDENTIALS` updated in Key Vault with actual password (`stelartechos@gmail.com`)
- All 13 required secrets now in `kv-stelar-prod` — confirmed via `az keyvault secret list`

### PostgreSQL Schemas
- All 10 schemas created via `infra/scripts/stelar-schemas.sql`
- Schemas: `identity` · `billing` · `products` · `stelargem` · `stelarvacay` · `stelarpeople` · `agents` · `governance` · `worldgraph` · `telemetry`
- Migration ran exit 0 on VM; SQL file committed to `infra/scripts/stelar-schemas.sql`
- **Known issue:** post-migration SELECT verification times out from VM — PG firewall may need VM IP added for read queries (write path works)

### Legacy Repo Audit
- Audited `rentout`, `cheapvacay`, `layer8` repos
- Migration map committed to `docs/ghspec.md`

### Services Scaffolded (committed to main)

**`services/fullstack-gateway/`** (commit `c38dba3`) — ported from `layer8`
- Full inference pipeline: auth → policy → rate-limit → plugin → cache → route → audit
- `app/providers/ollama.py` — NEW: calls inference bridge at `http://127.0.0.1:18080/generate`
- `app/core/config.py` — patched: `ollama_bridge_url`, `ollama_bridge_shared_secret`, default provider = `gemma4_26b_ollama_vm`
- Alembic migrations for `governance` schema tables
- Tests from layer8 preserved
- **Not yet deployed to Container Apps**

**`apps/stelarvacay-api/`** (commit `5a3a63a`) — ported from `cheapvacay`
- Complete budget engine: `planner.ts`, `seasonal.ts`, Amadeus live fare integration
- Firebase fully removed; JWT auth via `jsonwebtoken`
- `src/services/gateway.ts` — calls FullStack Gateway for all Gemma requests
- PostgreSQL persistence with `stelarvacay.` schema prefix
- **Not yet deployed**

**`apps/stelarvacay-web/`** (commit `5a3a63a`) — ported from `cheapvacay`
- All React components: PlannerForm, QuoteCard, AdvicePanel, DestinationRail, Hero, SavedPlans, SiteFooter
- Firebase/AppCheck removed; auth via `localStorage` JWT token
- Branded as StelarVacay throughout
- **Not yet deployed**

**`apps/stelarpeople-api/`** (commit `a2a8a20`) — ported from `rentout`
- Property, CRM, screening, market, demographics JS service files (from rentout)
- TypeScript scaffold: `config.ts`, `db/client.ts`, `services/gateway.ts`, `server.ts`
- Dataset JSON schemas + AI prompt templates for market/demographic/SEO extraction
- **Service files still in JS** — TS port of `property.js`, `crm.js`, `screening.js` is next step
- **Not yet deployed**

---

## Immediate Next Steps (Phase 3 — ordered by dependency)

### 1. Verify PostgreSQL schemas are readable
Add the VM's public IP to the Azure PostgreSQL firewall allow-list:
```bash
az postgres flexible-server firewall-rule create \
  --resource-group rg-stelar-prod \
  --name pg-stelar-prod \
  --rule-name allow-vm \
  --start-ip-address 20.10.150.44 \
  --end-ip-address 20.10.150.44
```
Then confirm: `psql <url> -c "\dn"`

### 2. Install gateway deps and smoke-test locally on VM
```bash
cd /mnt/gemma4/stelar-platform/services/fullstack-gateway
pip install -e ".[dev]"
# Set env vars from Key Vault, then:
uvicorn app.main:app --port 8000
curl http://localhost:8000/health
curl -X POST http://localhost:8000/v1/ai/generate \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"hello"}]}'
```
Expected: Gemma 4 response proxied through the bridge.

### 3. Port stelarpeople service layer to TypeScript
`apps/stelarpeople-api/src/services/property.js` → `property.ts`  
`apps/stelarpeople-api/src/services/crm.js` → `crm.ts`  
`apps/stelarpeople-api/src/services/screening.js` → `screening.ts`  
Change: drop SQLite dual-mode calls, PostgreSQL only, add `stelarpeople.` schema prefix.

### 4. Build Container Apps deployment configs
Create `infra/containerapps/` Bicep or YAML for:
- `fullstack-gateway` — port 8000, internal ingress only
- `stelarvacay-api` — port 3000, external ingress
- `stelarvacay-web` — static or port 4173, external ingress
- `stelarpeople-api` — port 3847, external ingress

Each needs:
- Managed identity → Key Vault reference for secrets
- `POSTGRES_URL`, `REDIS_URL`, `JWT_SIGNING_KEY`, `FULLSTACK_INTERNAL_API_KEY` from KV
- Gateway additionally needs `OLLAMA_BRIDGE_URL`, `OLLAMA_BRIDGE_SHARED_SECRET`

### 5. Implement Arkham Governance service
`services/arkham-governance/` — claim classifier + publish-block enforcement  
Rules are defined in `services/arkham-governance/rules/hard-blocks.yaml`  
Must block test in SPEC § 17.3 before any AiSquad activation

### 6. Fix AiSquad hermes config paths
`services/fullstack-aisquad/hermes-config/` still references `/home/azureuser/hermes-workspace`  
Update all `config.yaml` path refs to `/mnt/gemma4/stelar-platform/services/fullstack-aisquad`

---

## Architecture Snapshot

```
Internet
  └── Azure Container Apps ingress
        ├── stelarvacay-api     (:3000)   → fullstack-gateway → VM:18080 → Ollama:11434
        ├── stelarvacay-web     (static)
        ├── stelarpeople-api    (:3847)   → fullstack-gateway → VM:18080 → Ollama:11434
        └── fullstack-gateway   (:8000)   → VM inference bridge (127.0.0.1:18080)

VM (gemmaco-key · 20.10.150.44)
  ├── /mnt/gemma4/stelar-platform     ← monorepo
  ├── /mnt/gemma4/ollama               ← Gemma 4 26B model weights
  ├── /opt/fullstack-ollama-bridge     ← Python inference bridge (:18080)
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

## Secrets in Key Vault (`kv-stelar-prod`)

All 13 required secrets present: `APPINSIGHTS-CONNECTION-STRING` · `APPINSIGHTS-INSTRUMENTATION-KEY` · `BLOB-STORAGE-CONNECTION` · `FULLSTACK-INTERNAL-API-KEY` · `gemmaco-key` · `IG-CREDENTIALS` · `JWT-SIGNING-KEY` · `OLLAMA-BRIDGE-SHARED-SECRET` · `POSTGRES-ADMIN-PASSWORD` · `POSTGRES-URL` · `REDIS-URL` · `SERVICEBUS-CONNECTION` · `STAN-CREDENTIALS`

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
| PostgreSQL read queries time out from VM | Medium | Add VM IP to PG firewall rule |
| stelarpeople-api services still in JS | Medium | Port to TS in Phase 3 |
| hermes-config paths reference old workspace | Medium | Run path migration pass |
| fullstack-gateway .env.example in repo | Low | `git rm services/fullstack-gateway/.env.example` |
| gateway .github/workflows deploy to GKE (from layer8) | Low | Replace with Container Apps deploy YAML |
| Instagram Chrome sandbox broken | High (AiSquad) | Fix before activating monitors |
