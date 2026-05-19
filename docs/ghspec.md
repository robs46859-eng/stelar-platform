# Legacy Repo Migration Map — Stelar Platform

**Audited:** 2026-05-19  
**Repos:** rentout · cheapvacay · layer8  
**Verdict:** All three have production-grade logic worth porting. Zero from-scratch builds needed for Phase 3–4.

---

## Summary

| Legacy Repo | Stelar Target | Effort | Status |
|---|---|---|---|
| `layer8` | `services/fullstack-gateway` | Medium — add Ollama provider, strip K8s | **Port directly — highest priority** |
| `cheapvacay` | `apps/stelarvacay-api` + `apps/stelarvacay-web` | Medium — strip Firebase, wire Gateway | Port backend logic, reuse frontend components |
| `rentout` | `apps/stelarpeople-api` | Medium — strip Render/Supabase, wire Gateway | Port all service layer logic |

---

## 1. layer8 → `services/fullstack-gateway`

### What it is
A FastAPI Python AI gateway with a fully-built inference pipeline:

```
request → auth → policy → rate-limit → plugin → cache → route → audit → response
```

This is exactly what SPEC § 6.1 and § 13 require. Building it from scratch would take 3–5 days. Porting layer8 takes ~4 hours.

### Files to copy verbatim (no changes needed)

| Source | Destination |
|---|---|
| `app/core/pipeline.py` | `services/fullstack-gateway/app/core/pipeline.py` |
| `app/core/security.py` | `services/fullstack-gateway/app/core/security.py` |
| `app/core/logging.py` | `services/fullstack-gateway/app/core/logging.py` |
| `app/providers/base.py` | `services/fullstack-gateway/app/providers/base.py` |
| `app/services/routing.py` | `services/fullstack-gateway/app/services/routing.py` |
| `app/services/rate_limit.py` | `services/fullstack-gateway/app/services/rate_limit.py` |
| `app/services/cache.py` | `services/fullstack-gateway/app/services/cache.py` |
| `app/services/auth.py` | `services/fullstack-gateway/app/services/auth.py` |
| `app/services/audit.py` | `services/fullstack-gateway/app/services/audit.py` |
| `app/services/policy.py` | `services/fullstack-gateway/app/services/policy.py` |
| `app/services/tenants.py` | `services/fullstack-gateway/app/services/tenants.py` |
| `app/services/context.py` | `services/fullstack-gateway/app/services/context.py` |
| `app/services/readiness.py` | `services/fullstack-gateway/app/services/readiness.py` |
| `app/schemas/inference.py` | `services/fullstack-gateway/app/schemas/inference.py` |
| `app/schemas/admin.py` | `services/fullstack-gateway/app/schemas/admin.py` |
| `app/db/` (all) | `services/fullstack-gateway/app/db/` |
| `alembic/` (all) | `services/fullstack-gateway/alembic/` |
| `pyproject.toml` | `services/fullstack-gateway/pyproject.toml` |
| `tests/` (all) | `services/fullstack-gateway/tests/` |

### Files to port (modify before copying)

| Source | Destination | Change required |
|---|---|---|
| `app/providers/openai.py` | keep as reference | Use as template for OllamaProvider |
| `app/core/config.py` | `services/fullstack-gateway/app/core/config.py` | Replace env var names with Key Vault refs; add `OLLAMA_BRIDGE_URL`, `OLLAMA_BRIDGE_SECRET` |
| `app/main.py` | `services/fullstack-gateway/app/main.py` | Strip startup checks for GCP/non-Azure deps |
| `app/api/routes.py` | `services/fullstack-gateway/app/api/routes.py` | Rename to match SPEC § 6.1 endpoint names |

### New file to create (not in layer8)

**`app/providers/ollama.py`** — OllamaProvider that calls the inference bridge at `http://127.0.0.1:18080/generate` using `OLLAMA_BRIDGE_SHARED_SECRET`. Model name: `gemma4:26b`. ~30 lines following `app/providers/base.py` Protocol.

### Files to discard from layer8

| File | Reason |
|---|---|
| `app/providers/gemini.py` | Not used in Stelar (Gemma via Ollama only) |
| `deploy/kubernetes/` | Azure Container Apps, not Kubernetes |
| `.github/workflows/deploy-production.yml` | Replace with Azure Container Apps deploy |
| `.github/workflows/deploy-staging.yml` | Replace with Azure Container Apps deploy |
| `deploy/docker-compose.prod.yml` | Not used |

### DB tables provided (in `governance` schema)

From `alembic/versions/20260327_0001_initial_schema.py`:
- `tenants` — multi-tenant isolation
- `api_keys` — hashed key store with scopes + allowed_models
- `provider_accounts` — per-tenant provider credential refs
- `provider_models` — registered models per provider
- `routing_policies` — per-tenant routing rules (JSON)
- `plugin_registrations` + `plugin_bindings` — plugin system
- `request_audit` — full audit log per inference request
- `quota_snapshots` — per-tenant token/request usage
- `cache_manifests` — cache metadata with Blob Storage URI

These go into the **`governance`** schema in Azure PostgreSQL.

### Config changes for Azure

```
# Old (layer8)            # New (stelar-gateway)
DATABASE_URL          →   POSTGRES-URL (from Key Vault)
REDIS_URL             →   REDIS-URL (from Key Vault)
-                     →   OLLAMA_BRIDGE_URL = http://127.0.0.1:18080
-                     →   OLLAMA_BRIDGE_SHARED_SECRET (from Key Vault)
DEFAULT_PROVIDER      →   gemma4_26b_ollama_vm
```

---

## 2. cheapvacay → `apps/stelarvacay-api` + `apps/stelarvacay-web`

### What it is
A TypeScript Express + React app with a complete travel budget engine. The domain logic in `server/domain/planner.ts` is production-ready and directly maps to SPEC requirements for StelarVacay.

### Backend — files to port

| Source | Destination | Change required |
|---|---|---|
| `server/domain/planner.ts` | `apps/stelarvacay-api/src/domain/planner.ts` | None — logic is clean, AI-agnostic |
| `server/domain/seasonal.ts` | `apps/stelarvacay-api/src/domain/seasonal.ts` | None |
| `server/data/destinations.ts` | `apps/stelarvacay-api/src/data/destinations.ts` | Expand for Stelar destinations dataset |
| `server/middleware/rateLimits.ts` | `apps/stelarvacay-api/src/middleware/rateLimits.ts` | None |
| `server/middleware/httpLogger.ts` | `apps/stelarvacay-api/src/middleware/httpLogger.ts` | Add `tenant_id`, `product`, `trace_id` fields per SPEC § 3.3 |
| `server/persistence/tripPlans.ts` | `apps/stelarvacay-api/src/persistence/tripPlans.ts` | Swap Supabase client for Azure PostgreSQL |
| `server/services/amadeus.ts` | `apps/stelarvacay-api/src/services/amadeus.ts` | None — live fare sampling stays |
| `server/routes/api.ts` | `apps/stelarvacay-api/src/routes/api.ts` | Replace `assistant.ts` OpenAI call with Gateway call |

### Key domain types (copy exactly into stelarvacay schema)

```typescript
BudgetProfile: "lean" | "smart" | "comfort"
TransportPreference: "cheapest" | "balanced" | "fastest"
StayType: "hostel" | "homestay" | "boutique"
PlannerQuote  // full output type with transparency badges
QuoteBreakdown
PricingTransparency
```

### Backend — files to discard

| File | Reason |
|---|---|
| `server/auth/appCheck.ts` | Firebase App Check — replaced by JWT + managed identity |
| `server/lib/firebase-admin.ts` | Firebase Admin SDK — remove entirely |
| `server/services/assistant.ts` | Direct OpenAI call — replace with Gateway `POST /v1/ai/generate` |
| `firebase-applet-config.json` | Firebase config |
| `firestore.rules` | Firebase rules |
| `render.yaml` | Render deploy config |

### Frontend — files to port

| Source | Destination | Change required |
|---|---|---|
| `src/components/PlannerForm.tsx` | `apps/stelarvacay-web/src/components/PlannerForm.tsx` | Rename "CheapVacay" → "StelarVacay" in labels |
| `src/components/QuoteCard.tsx` | `apps/stelarvacay-web/src/components/QuoteCard.tsx` | None — data-driven, no hardcoded brand |
| `src/components/AdvicePanel.tsx` | `apps/stelarvacay-web/src/components/AdvicePanel.tsx` | None |
| `src/components/DestinationRail.tsx` | `apps/stelarvacay-web/src/components/DestinationRail.tsx` | None |
| `src/components/Hero.tsx` | `apps/stelarvacay-web/src/components/Hero.tsx` | Rename brand only |
| `src/components/SavedPlans.tsx` | `apps/stelarvacay-web/src/components/SavedPlans.tsx` | None |
| `src/components/LegalChrome.tsx` | `apps/stelarvacay-web/src/components/LegalChrome.tsx` | Update company name |
| `src/pages/` (all) | `apps/stelarvacay-web/src/pages/` | Rename brand in copy only |
| `src/lib/api.ts` | `apps/stelarvacay-web/src/lib/api.ts` | Point to stelarvacay-api URL |
| `src/lib/format.ts` | `apps/stelarvacay-web/src/lib/format.ts` | None |
| `src/index.css` | `apps/stelarvacay-web/src/index.css` | None |
| `vite.config.ts` | `apps/stelarvacay-web/vite.config.ts` | Update proxy target |
| `tsconfig.json` | `apps/stelarvacay-web/tsconfig.json` | None |

### Frontend — files to discard

| File | Reason |
|---|---|
| `src/lib/firebase-app.ts` | Firebase client — replaced by JWT auth |
| `src/components/AuthBar.tsx` | Firebase auth UI — replace with Stelar auth component |

### DB tables provided (in `stelarvacay` schema)

From `database/schema.sql`:
- `users` — already exists in `identity` schema; use FK reference instead
- `destinations` — rich destination metadata (region, budgets, transport notes, seasonal tags)
- `trips` — user trip records
- `routes` — per-trip transport legs
- `hotels` — destination hotel samples
- `stops` — route waypoints
- `budgets` — full cost breakdown per trip
- `ratings` — post-trip scoring (cost/safety/comfort/time/reliability)
- `deals` — discount codes

---

## 3. rentout → `apps/stelarpeople-api`

### What it is
A Node.js Express app (JavaScript) for property management. Has full CRUD for assets, units, leases, work orders, CRM pipeline, and Buildium PMS sync. Maps directly to SPEC StelarPeople requirements.

### Files to port

| Source | Destination | Change required |
|---|---|---|
| `server/services/property.js` | `apps/stelarpeople-api/src/services/property.ts` | Rewrite queries from SQLite dual-mode to PostgreSQL only; add TypeScript types |
| `server/services/crm.js` | `apps/stelarpeople-api/src/services/crm.ts` | Same — drop SQLite path |
| `server/services/screening.js` | `apps/stelarpeople-api/src/services/screening.ts` | Same |
| `server/services/market.js` | `apps/stelarpeople-api/src/services/market.ts` | Port as-is |
| `server/services/demographics.js` | `apps/stelarpeople-api/src/services/demographics.ts` | Port as-is |
| `server/services/buildium.js` | `apps/stelarpeople-api/src/integrations/buildium.ts` | Move to integrations folder |
| `server/auth.js` | `apps/stelarpeople-api/src/auth/` | Replace session-based auth with JWT; keep MFA logic |
| `server/db.js` | `apps/stelarpeople-api/src/db/` | Drop SQLite adapter; PostgreSQL only via `POSTGRES-URL` from Key Vault |
| `datasets/schemas/` (all 3) | `apps/stelarpeople-api/src/schemas/` | Copy exactly — JSON schemas for market/demographic/SEO data are solid |
| `datasets/prompts/` (all 3) | `apps/stelarpeople-api/src/prompts/` | Copy — use these as Gemma prompt templates via Gateway |
| `scripts/chunk-raw-sources.js` | `apps/stelarpeople-api/scripts/` | Copy — used for dataset ingestion pipeline |
| `scripts/normalize-dataset-json.js` | `apps/stelarpeople-api/scripts/` | Copy |
| `scripts/export-seed-artifacts.js` | `apps/stelarpeople-api/scripts/` | Copy |

### Files to discard

| File | Reason |
|---|---|
| `server/services/pms.js` | Buildium-specific; move logic to `integrations/buildium.ts` cleanly |
| `server/services/consolidated.js` | Aggregator — rebuild as an API composition layer |
| `render.yaml` | Render config |
| `.github/workflows/render-env-sync.yml` | Render deploy |
| `public/` (all HTML/CSS/JS) | Replaced by `stelarpeople-web` React app |

### Work order lifecycle (copy exactly)

```
open → in_progress → vendor_scheduled → completed | canceled
priority: low | medium | high | urgent
```

This state machine is in `server/services/property.js:createWorkOrder` and `updateWorkOrder`. It is the core of stelarpeople-api maintenance module. The validation logic (Set-based status/priority guards) maps directly to TypeScript union types.

### DB tables needed in `stelarpeople` schema

From `server/db.js` (inferred from queries in property.js/crm.js/screening.js):
- `assets` — properties (id, asset_id code, name, address)
- `units` — individual units per asset (unit_number, status, market_rent_cents)
- `leases` — active/historical leases with monthly_rent_cents, deposit_cents, custom_clauses JSONB
- `work_orders` — maintenance tickets (priority, status, category, vendor, estimated_cost_cents)
- `maintenance_snapshots` — periodic maintenance health snapshots per asset
- `prospects` — CRM leads with stage + activity log
- `prospect_activities` — timestamped activity log per prospect
- `screening_applications` — applicant screening records with decision
- `market_snapshots` — submarket intelligence (avg_rent, occupancy, heat_score, source metadata)
- `demographic_snapshots` — census/demographic data per submarket

---

## 4. Cross-cutting reuse

### Shared auth pattern (all three repos → `packages/auth`)

All three repos implement their own auth. Common pattern to extract:
- JWT bearer token validation
- MFA flow (rentout has the cleanest implementation)
- Rate limiting middleware (cheapvacay has Redis-backed rate limiter)

Extract into `packages/auth` so all product APIs share one implementation.

### Structured logging (cheapvacay → `packages/telemetry`)

`cheapvacay/server/lib/logger.ts` already emits structured JSON. Add the SPEC § 3.3 required fields (`tenant_id`, `product`, `agent_name`, `request_id`, `trace_id`) and move to `packages/telemetry`.

### Dataset ingestion pipeline (rentout → `packages/agent-sdk` or standalone)

`rentout/scripts/` + `rentout/datasets/` is a reusable AI-assisted data extraction pipeline:
1. Chunk raw sources
2. Run AI extraction via prompt templates
3. Normalize to JSON schema
4. Export seed artifacts

This pipeline works for any product. Port to `packages/agent-sdk/dataset-pipeline/` so StelarGem's worldgraph and StelarVacay's destinations can use the same flow.

---

## 5. Migration order (fastest path to Phase 3 completion)

```
1. Copy layer8 → services/fullstack-gateway  (1 day)
   Add OllamaProvider (~30 lines)
   Smoke test: POST /v1/ai/generate returns Gemma output

2. Port cheapvacay backend → apps/stelarvacay-api  (1 day)
   Strip Firebase, wire to Gateway
   DB: create stelarvacay schema tables

3. Port rentout services → apps/stelarpeople-api  (1 day)
   JS → TS, drop SQLite, wire to Gateway
   DB: create stelarpeople schema tables

4. Extract shared auth + logger → packages/  (half day)

5. Port cheapvacay frontend → apps/stelarvacay-web  (half day)
   Brand rename only
```

**Total: ~4.5 days to have Phases 3–4 functional.**  
Without this migration, estimate 3–4 weeks building equivalent from scratch.

---

## 6. What these repos do NOT provide (still needs building)

| Gap | Required for |
|---|---|
| `services/arkham-governance/` implementation | Phase 3 — claim classifier, publish-block enforcement |
| `stelargem-api` — neighborhood graph, corridor scoring, worldgraph | Phase 4 |
| `stelarpeople-web` React app | Phase 5 |
| `stelargem-web` React app | Phase 5 |
| `fullstack-dashboard` | Phase 5 |
| AiSquad → Gateway wiring | Phase 6 |
| Container Apps deployment configs (Bicep/YAML) | Phase 3 deploy |
| Managed identities on all Container Apps | Phase 3 deploy |
| Private endpoints (Key Vault, DB, Redis, Storage) | Phase 7 |
