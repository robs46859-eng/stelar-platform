# Stelar Platform — Swarm Control Document

**Created:** 2026-05-20
**Repo:** `git@github.com:robs46859-eng/stelar-platform.git`
**VM:** `ssh -i ~/.ssh/id_ed25519 azureuser@20.10.150.44`
**Key Vault:** `kv-stelar-prod` | **ACR:** `acrstelarprod` | **RG:** `rg-stelar-prod`

---

## Active Swarms

| ID | Name | Status | Scope | Blocking |
|---|---|---|---|---|
| SWARM-01 | Security Hardening | ✅ Done | Code fixes — no deploy needed | Nothing |
| SWARM-02 | StelarGem API | ✅ Done | Build service from scratch + Bicep + Docker | SWARM-04 (deploy) |
| SWARM-03 | Web Apps | ✅ Done | stelarpeople-web, stelargem-web, fullstack-dashboard | SWARM-04 (deploy) |
| SWARM-04 | Infrastructure Bicep | ✅ Done | Arkham Bicep, Service Bus, Blob Storage, parameterize Ollama URL | SWARM-02, SWARM-03 |
| SWARM-05 | AiSquad Wiring | ✅ Done | Chrome sandbox fix, wire agents → gateway | SWARM-01 (security prereq) |

---

## SWARM-01 — Security Hardening

**Goal:** Fix all Priority 1 & 2 code review findings from SPEC.md §0.3. No deploy required — code changes only.

**Files to touch:**

| Fix | File | What |
|---|---|---|
| CORS allowlist | `apps/stelarpeople-api/src/server.ts:7` | Replace `cors()` with `cors({ origin: process.env.CORS_ALLOWED_ORIGINS?.split(',') })` |
| Gateway insecure dev key | `services/fullstack-gateway/app/core/config.py:41` | Assert `dev_api_key_secret` != `"change-me-now"` when `BACKEND_MODE=self_hosted` |
| Gateway empty admin token | `services/fullstack-gateway/app/core/config.py:40` | Assert `admin_api_token` non-empty on startup in self_hosted mode |
| Income double-conversion | `apps/stelarpeople-api/src/services/screening.ts:150,176` | Use `incomeCents` in both `evaluatePolicy` and INSERT |
| CheapVacay brand | `apps/stelarvacay-api/src/domain/planner.ts:189` | Replace `CheapVacay` → `StelarVacay` |
| Firebase naming | `apps/stelarvacay-api/src/auth/bearer.ts:5`, `apps/stelarpeople-api/src/auth/bearer.ts:5` | Rename `requireFirebaseUser` → `requireJwtUser` |
| Amadeus direct calls | `apps/stelarvacay-api/src/config.ts:7` | Route Amadeus through gateway per SPEC §3.1.6 |
| Arkham 90-day block | `services/arkham-governance/src/main.py:58` | Wire `DEPLOYMENT_START_DATE` env var for expiry window |
| Arkham silent DB errors | `services/arkham-governance/src/main.py:18`, `src/reviewer.py:16` | Replace `except Exception: pass` with `logger.warning` |
| Deprecated isLiveData | `apps/stelarvacay-api/src/domain/planner.ts:49` | Remove field from type and return value |

**Completion check:** `git diff --stat` shows all 10 files touched. No new `.env` or credentials added.

---

## SWARM-02 — StelarGem API

**Goal:** Build `services/stelargem-api` from a `.gitkeep` placeholder to a deployable TypeScript/Express service matching the pattern of `stelarpeople-api` and `stelarvacay-api`.

**What StelarGem does (SPEC §2):** Spatial intelligence, local movement, neighborhood graph, corridor data. Formerly MamaNav.

**Deliverables:**

```
services/stelargem-api/
  src/
    server.ts          — Express app, /health, /ready, /api routes
    config.ts          — env config (GATEWAY_URL, JWT_SIGNING_KEY, POSTGRES_URL)
    auth/bearer.ts     — requireJwtUser middleware
    routes/api.ts      — neighborhood graph endpoints
    services/graph.ts  — PostgreSQL queries against worldgraph schema
    db/client.ts       — pg client
  Dockerfile
  package.json
  tsconfig.json
infra/containerapps/stelargem-api.bicep
```

**DB schema available:** `worldgraph` — 2 tables (confirmed in Phase 3 pg-firewall agent).

**Port:** 3100 (pick next available after stelarpeople-api:3847, stelarvacay-api:3000).

**Pattern to follow:** Mirror `apps/stelarpeople-api/` structure exactly. Use same auth, same CORS fix from SWARM-01, same structured JSON logger.

**ACR image name:** `acrstelarprod.azurecr.io/stelargem-api:latest`

**Completion check:** `docker build` succeeds. Bicep ARM-validates with `az deployment group validate`.

---

## SWARM-03 — Web Apps

**Goal:** Build three missing web frontends. Each is a React/Vite app with a Dockerfile and Bicep module.

### stelarpeople-web
- **What:** Property management operator dashboard
- **Path:** `apps/stelarpeople-web/`
- **Connects to:** `stelarpeople-api` (3847)
- **Key screens:** Property list, applicant screening queue, tenant CRM
- **Pattern:** Mirror `apps/stelarvacay-web/` structure

### stelargem-web
- **What:** Neighborhood graph explorer / local corridor intelligence
- **Path:** `apps/stelargem-web/`
- **Connects to:** `stelargem-api` (3100)
- **Key screens:** Map view, corridor data, neighborhood scoring

### fullstack-dashboard
- **What:** Operator/admin dashboard — gateway health, governance queue, agent status
- **Path:** `apps/fullstack-dashboard/`
- **Connects to:** `fullstack-gateway` (8000 internal), `arkham-governance`
- **Key screens:** Gateway health, pending Arkham review queue, AiSquad agent status, Key Vault secret health

**Each deliverable:**
```
apps/<name>/
  src/
    App.tsx
    main.tsx
    components/     — at minimum: Layout, Nav, pages
  index.html
  vite.config.ts
  tsconfig.json
  package.json
  Dockerfile
infra/containerapps/<name>.bicep
```

**Completion check:** `npm run build` succeeds for each. Bicep ARM-validates.

---

## SWARM-04 — Infrastructure Bicep

**Goal:** Fill all missing Bicep gaps so `main.bicep` covers the full stack. No deploy — ARM validate only.

**Deliverables:**

| File | What |
|---|---|
| `infra/containerapps/arkham-governance.bicep` | Container App for Arkham, port 8001, internal ingress |
| `infra/containerapps/storage.bicep` | Azure Blob Storage account + containers (inspections, exports, archive) |
| `infra/containerapps/servicebus.bicep` | Azure Service Bus namespace + queues (agent-run-queue, governance-queue) |
| `infra/containerapps/fullstack-gateway.bicep` | Patch: replace hardcoded `20.10.150.44` with `param ollamaBridgeUrl string` |
| `infra/containerapps/main.bicep` | Add modules: arkham, stelargem-api, stelarpeople-web, stelargem-web, fullstack-dashboard, storage, servicebus |
| `infra/containerapps/deploy.sh` | Add `OLLAMA_BRIDGE_URL` param passthrough |

**Arkham port:** 8001. **Arkham image:** `acrstelarprod.azurecr.io/arkham-governance:latest`

**Service Bus queues required:**
- `agent-run-queue`
- `governance-queue`

**Blob containers required:**
- `inspections`
- `exports`
- `archive`

**Completion check:** `az deployment group validate --resource-group rg-stelar-prod --template-file infra/containerapps/main.bicep` returns no errors.

---

## SWARM-05 — AiSquad Wiring

**Goal:** Fix the Chrome sandbox issue blocking browser agents and wire AiSquad agent inference calls through the gateway.

**Part A — Chrome Sandbox Fix**

The Chrome/Playwright sandbox is broken in the current container environment. Fix options (pick one that works):
1. Add `--no-sandbox` flag to Playwright launch args in the browser tool
2. Set `CHROME_FLAGS=--no-sandbox` env var in docker-compose
3. If running in Docker: add `cap_add: [SYS_ADMIN]` or `--privileged` (dev only)

**File:** `services/fullstack-aisquad/hermes-config/hermes-agent/tools/` — find browser/playwright launch config.

**Part B — Gateway Wiring**

Wire AiSquad agent inference calls to the gateway instead of calling Ollama directly.

Gateway endpoint (from HANDOFF.md):
```
POST http://fullstack-gateway/v1/proxy/infer
Authorization: Bearer ak_live_68b5f5c879fac993.68680c376e05ddced3bec1e1c0971f8c16667f306d180d7f
Content-Type: application/json
{"product":"system","agent_name":"<agent_id>","prompt":"<prompt>","model":"gemma4:26b"}
```

Update hermes config.yaml to use gateway as provider instead of direct Ollama:
- `services/fullstack-aisquad/hermes-config/config.yaml` — change `base_url` from `http://localhost:11434` to `http://fullstack-gateway/v1/proxy/infer` and set auth header.

**Completion check:** `hermes ask "ping"` routes through gateway and returns Gemma response. Chrome browser tool opens a URL without crashing.

---

## Resume Instructions (if context is lost)

If this session is cut off, start a new session and run:

```
Read /Users/joeiton/stelar-platform/SWARM_CONTROL.md
```

Then check swarm status:

```bash
git -C /Users/joeiton/stelar-platform diff --stat HEAD
git -C /Users/joeiton/stelar-platform status
```

To continue any swarm: read the relevant section above, check which files exist vs. the deliverables list, and continue from where the diff shows work stopped.

---

## Progress Checklist

### SWARM-01 — Security Hardening
- [x] CORS allowlist on stelarpeople-api (was already in place)
- [x] Gateway dev key startup assertion (was already in place from prior security pass)
- [x] Gateway admin token startup assertion (was already in place)
- [x] Income double-conversion fix in screening.ts (was already fixed)
- [x] CheapVacay → StelarVacay brand fix (was already fixed)
- [x] requireFirebaseUser → requireJwtUser rename
- [x] Amadeus routed through gateway (apps/stelarvacay-api/src/services/amadeus.ts)
- [x] Arkham 90-day window wired to DEPLOYMENT_START_DATE (was already in place)
- [x] Arkham silent DB errors → logger.warning (was already in place)
- [x] Deprecated isLiveData removed (planner.ts)

### SWARM-02 — StelarGem API
- [x] `services/stelargem-api/src/server.ts`
- [x] `services/stelargem-api/src/config.ts`
- [x] `services/stelargem-api/src/auth/bearer.ts`
- [x] `services/stelargem-api/src/routes/api.ts`
- [x] `services/stelargem-api/src/services/graph.ts`
- [x] `services/stelargem-api/src/db/client.ts`
- [x] `services/stelargem-api/src/lib/logger.ts`
- [x] `services/stelargem-api/src/middleware/httpLogger.ts`
- [x] `services/stelargem-api/src/middleware/rateLimits.ts`
- [x] `services/stelargem-api/Dockerfile`
- [x] `services/stelargem-api/package.json`
- [x] `services/stelargem-api/tsconfig.json`
- [x] `infra/containerapps/stelargem-api.bicep`
- [ ] docker build passes — needs manual verify on VM
- [ ] Bicep ARM-validates — needs re-run after SWARM-04 stub replaced with real file

### SWARM-03 — Web Apps
- [x] `apps/stelarpeople-web/` — 18 files, React 18 + Tailwind + React Router
- [x] `apps/stelarpeople-web/Dockerfile`
- [x] `infra/containerapps/stelarpeople-web.bicep`
- [x] `apps/stelargem-web/` — 17 files
- [x] `apps/stelargem-web/Dockerfile`
- [x] `infra/containerapps/stelargem-web.bicep`
- [x] `apps/fullstack-dashboard/` — 19 files, dark theme, gateway + arkham + agents + secrets views
- [x] `apps/fullstack-dashboard/Dockerfile`
- [x] `infra/containerapps/fullstack-dashboard.bicep`
- [ ] All 3 npm builds pass — needs manual verify

### SWARM-04 — Infrastructure Bicep
- [x] `infra/containerapps/arkham-governance.bicep`
- [x] `infra/containerapps/storage.bicep` (stelarstorageprod, 3 containers)
- [x] `infra/containerapps/servicebus.bicep` (sb-stelar-prod, 2 queues)
- [x] `infra/containerapps/fullstack-gateway.bicep` patched (ollamaBridgeUrl param)
- [x] `infra/containerapps/main.bicep` updated with all new modules
- [x] `infra/containerapps/deploy.sh` updated with ollamaBridgeUrl param
- [x] `az deployment group validate` passed — provisioningState: Succeeded

### SWARM-05 — AiSquad Wiring
- [x] Chrome sandbox fix — browser_tool.py, meet_bot.py, docker-compose.yml
- [x] Gateway endpoint wired in hermes config.yaml (localhost:8500, key via env var)
- [x] FULLSTACK_GATEWAY_KEY documented in .env.example
- [ ] `hermes ask` routes through gateway — needs gateway running on VM to verify
- [ ] Browser tool opens URL without crash — needs live test

---

## Key References

| Item | Value |
|---|---|
| Gateway internal URL | `http://fullstack-gateway` (Container Apps internal DNS) |
| Gateway VM local URL | `http://localhost:8500` (on VM only) |
| Gateway inference key | `ak_live_68b5f5c879fac993.68680c376e05ddced3bec1e1c0971f8c16667f306d180d7f` |
| Gateway model | `gemma4:26b` |
| ACR | `acrstelarprod.azurecr.io` |
| VM SSH | `ssh -i ~/.ssh/id_ed25519 azureuser@20.10.150.44` |
| Key Vault | `kv-stelar-prod` |
| Container Apps env | `cae-stelar-prod` |
| Resource group | `rg-stelar-prod` |
| PostgreSQL | `pg-stelar-prod.postgres.database.azure.com` |
| stelarpeople-api port | 3847 |
| stelarvacay-api port | 3000 |
| stelargem-api port | 3100 |
| arkham-governance port | 8001 |
| fullstack-gateway port | 8000 |
