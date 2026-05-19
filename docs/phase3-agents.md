# Phase 3 Agent Tracker

**Created:** 2026-05-19  
**Purpose:** Tracks parallel build agents for Phase 3 completion. Any new session can read this file, check the status column, and pick up where agents left off.

**Repo:** `git@github.com:robs46859-eng/stelar-platform.git`  
**VM:** `ssh -i ~/.ssh/id_ed25519 azureuser@20.10.150.44`  
**PG:** `postgresql://stelaradmin:cLOo9kZL1HM3wAaZt2EKSWQ61Ziq@pg-stelar-prod.postgres.database.azure.com:5432/postgres?sslmode=require`

---

## Agent Status Board

| # | Agent | Task | Status | Verify |
|---|---|---|---|---|
| 1 | `pg-firewall` | Add VM IP to PG firewall, verify all 10 schemas | 🔄 Running | `psql <url> -c "\dn"` shows 10 schemas |
| 2 | `gateway-smoketest` | Install deps, start gateway on VM, confirm Gemma responds | 🔄 Running | `curl http://localhost:8000/v1/ai/generate` returns output_text |
| 3 | `stelarpeople-ts` | Port property.js, crm.js, screening.js → TypeScript | ✅ Done | `.ts` files exist, no `.js` service files remain |
| 4 | `containerapps-bicep` | Write Bicep for gateway + 3 APIs + 2 web apps | ✅ Done | `infra/containerapps/*.bicep` committed |
| 5 | `arkham-impl` | Implement claim classifier + publish-block service | ✅ Done | `services/arkham-governance/src/` exists, tests pass |
| 6 | `hermes-paths` | Fix AiSquad hermes-config path refs | ✅ Done | 97 text files + 7 SQLite DBs updated; grep count = 0 |

---

## Agent 1 — `pg-firewall`

**Task:** Open PostgreSQL firewall to VM IP, then verify all 10 schemas and table counts.

**Commands to run:**
```bash
# Add firewall rule
az postgres flexible-server firewall-rule create \
  --resource-group rg-stelar-prod \
  --name pg-stelar-prod \
  --rule-name allow-vm-gemmaco \
  --start-ip-address 20.10.150.44 \
  --end-ip-address 20.10.150.44

# Verify schemas via VM
ssh -i ~/.ssh/id_ed25519 -o StrictHostKeyChecking=no azureuser@20.10.150.44 \
  "psql 'postgresql://stelaradmin:cLOo9kZL1HM3wAaZt2EKSWQ61Ziq@pg-stelar-prod.postgres.database.azure.com:5432/postgres?sslmode=require' \
  -c \"SELECT schemaname, COUNT(*) as tables FROM pg_tables WHERE schemaname IN ('identity','billing','products','stelargem','stelarvacay','stelarpeople','agents','governance','worldgraph','telemetry') GROUP BY schemaname ORDER BY schemaname;\""
```

**Done when:** 10 rows returned, each with correct table count. Update status to ✅.

**Pickup:** If firewall rule already exists, skip to verify step.

---

## Agent 2 — `gateway-smoketest`

**Task:** Install Python dependencies for fullstack-gateway on the VM, run it, and verify Gemma responds end-to-end.

**Service path on VM:** `/mnt/gemma4/stelar-platform/services/fullstack-gateway`

**Steps:**
```bash
ssh -i ~/.ssh/id_ed25519 -o StrictHostKeyChecking=no azureuser@20.10.150.44 << 'EOF'
cd /mnt/gemma4/stelar-platform/services/fullstack-gateway

# Install deps
pip install -e "." --quiet

# Check bridge is alive
curl -s http://127.0.0.1:18080/health

# Set required env vars (from Key Vault values)
export POSTGRES_URL="postgresql://stelaradmin:cLOo9kZL1HM3wAaZt2EKSWQ61Ziq@pg-stelar-prod.postgres.database.azure.com:5432/postgres?sslmode=require"
export REDIS_URL=$(az keyvault secret show --vault-name kv-stelar-prod --name REDIS-URL --query value -o tsv)
export OLLAMA_BRIDGE_URL="http://127.0.0.1:18080"
export OLLAMA_BRIDGE_SHARED_SECRET=$(az keyvault secret show --vault-name kv-stelar-prod --name OLLAMA-BRIDGE-SHARED-SECRET --query value -o tsv)
export FULLSTACK_INTERNAL_API_KEY=$(az keyvault secret show --vault-name kv-stelar-prod --name FULLSTACK-INTERNAL-API-KEY --query value -o tsv)
export JWT_SIGNING_KEY=$(az keyvault secret show --vault-name kv-stelar-prod --name JWT-SIGNING-KEY --query value -o tsv)
export DEFAULT_PROVIDER=gemma4_26b_ollama_vm
export BACKEND_MODE=self_hosted

# Start gateway in background
uvicorn app.main:app --port 8000 &
sleep 3

# Test health
curl -s http://localhost:8000/health

# Test inference end-to-end
curl -s -X POST http://localhost:8000/v1/ai/generate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $FULLSTACK_INTERNAL_API_KEY" \
  -d '{"messages":[{"role":"user","content":"Say hello in one sentence."}]}'
EOF
```

**Done when:** `/v1/ai/generate` returns JSON with `output_text` field containing Gemma output.

**Pickup:** If pip install fails, check Python version (`python3 --version` should be 3.11+). If bridge health fails, check `systemctl status fullstack-ollama-bridge`.

---

## Agent 3 — `stelarpeople-ts`

**Task:** Port the three JS service files to TypeScript. Drop SQLite dual-mode. Use `stelarpeople.` schema prefix on all queries.

**Files to port:**
- `apps/stelarpeople-api/src/services/property.js` → `property.ts`
- `apps/stelarpeople-api/src/services/crm.js` → `crm.ts`
- `apps/stelarpeople-api/src/services/screening.js` → `screening.ts`

**Key rules for each port:**
1. Replace `import { execute, queryAll, queryOne } from "../db.js"` with `import { execute, queryAll, queryOne } from "../db/client.js"`
2. For every SQL query with two variants (SQLite + PostgreSQL), keep only the PostgreSQL variant (second argument)
3. Add `stelarpeople.` prefix to every table name: `assets` → `stelarpeople.assets`, `units` → `stelarpeople.units`, etc.
4. Add TypeScript types: `WorkOrder`, `Asset`, `Unit`, `Lease`, `Prospect`, `ScreeningApplication`
5. Delete the `.js` files after `.ts` files are confirmed

**Commit message:** `feat(stelarpeople): port service layer JS → TS, PostgreSQL-only queries`

**Done when:** No `.js` files in `src/services/`, TypeScript compiles without errors (`cd apps/stelarpeople-api && npx tsc --noEmit`).

**Pickup:** Read each `.js` file, write the `.ts` equivalent, delete the `.js`.

---

## Agent 4 — `containerapps-bicep`

**Task:** Create Bicep deployment files for all services under `infra/containerapps/`.

**Services to configure:**

| Service | Image | Port | Ingress | Env secrets needed |
|---|---|---|---|---|
| `fullstack-gateway` | `acrstelarprod.azurecr.io/fullstack-gateway:latest` | 8000 | Internal only | POSTGRES_URL, REDIS_URL, OLLAMA_BRIDGE_URL, OLLAMA_BRIDGE_SHARED_SECRET, FULLSTACK_INTERNAL_API_KEY, JWT_SIGNING_KEY |
| `stelarvacay-api` | `acrstelarprod.azurecr.io/stelarvacay-api:latest` | 3000 | External | POSTGRES_URL, GATEWAY_URL, FULLSTACK_INTERNAL_API_KEY, JWT_SIGNING_KEY, AMADEUS_CLIENT_ID, AMADEUS_CLIENT_SECRET |
| `stelarvacay-web` | `acrstelarprod.azurecr.io/stelarvacay-web:latest` | 4173 | External | VITE_API_URL |
| `stelarpeople-api` | `acrstelarprod.azurecr.io/stelarpeople-api:latest` | 3847 | External | POSTGRES_URL, GATEWAY_URL, FULLSTACK_INTERNAL_API_KEY, JWT_SIGNING_KEY |

**Pattern for each app (use Key Vault references, not hardcoded values):**
```bicep
resource containerApp 'Microsoft.App/containerApps@2023-05-01' = {
  name: 'fullstack-gateway'
  location: 'eastus2'
  identity: { type: 'SystemAssigned' }
  properties: {
    managedEnvironmentId: containerAppsEnv.id
    configuration: {
      ingress: { external: false, targetPort: 8000 }
      secrets: [
        { name: 'postgres-url', keyVaultUrl: 'https://kv-stelar-prod.vault.azure.net/secrets/POSTGRES-URL', identity: 'system' }
        // ... one entry per secret
      ]
    }
    template: {
      containers: [{
        name: 'fullstack-gateway'
        image: 'acrstelarprod.azurecr.io/fullstack-gateway:latest'
        env: [
          { name: 'POSTGRES_URL', secretRef: 'postgres-url' }
          // ... one entry per env var
        ]
        resources: { cpu: '0.5', memory: '1Gi' }
        probes: [
          { type: 'liveness', httpGet: { path: '/health', port: 8000 } }
          { type: 'readiness', httpGet: { path: '/ready', port: 8000 } }
        ]
      }]
      scale: { minReplicas: 1, maxReplicas: 3 }
    }
  }
}
```

**Files to create:**
- `infra/containerapps/main.bicep` — orchestrates all apps
- `infra/containerapps/fullstack-gateway.bicep`
- `infra/containerapps/stelarvacay-api.bicep`
- `infra/containerapps/stelarvacay-web.bicep`
- `infra/containerapps/stelarpeople-api.bicep`
- `infra/containerapps/managed-identity.bicep` — grants Key Vault access to all apps

**Commit message:** `feat(infra): Container Apps Bicep — all services with managed identity + KV refs`

**Done when:** All `.bicep` files are committed. Run `az bicep build --file infra/containerapps/main.bicep` to validate (no errors).

**Pickup:** Check `infra/containerapps/` on VM for any partial work first.

---

## Agent 5 — `arkham-impl`

**Task:** Implement the Arkham Governance service — claim classifier and publish-block enforcement.

**Location:** `services/arkham-governance/`  
**Existing files:** `rules/hard-blocks.yaml`, `rules/claim-review.yaml`, `gates/publish-gate.md`

**Read these first:**
- `services/arkham-governance/rules/hard-blocks.yaml`
- `services/arkham-governance/rules/claim-review.yaml`
- `services/arkham-governance/gates/publish-gate.md`
- `SPEC.md` sections 8.3 and 16 and 17.3

**Build a FastAPI service with these endpoints:**
```
POST /review          — classify content, return {risk_score, classification, decision}
POST /publish-check   — hard block or approve for publication
GET  /health
GET  /ready
```

**Claim classifications** (from hard-blocks.yaml):
- `health_claim` — any health/medical/wellness claim → BLOCK
- `financial_claim` — income guarantees, ROI promises → BLOCK  
- `legal_claim` — legal advice, property rights claims → BLOCK
- `auto_publish` — any autonomous publication attempt → BLOCK (first 90 days)
- `safe` — general content, no sensitive claims → APPROVE (pending human review)

**Structure:**
```
services/arkham-governance/src/
  main.py          — FastAPI app
  classifier.py    — rule-based claim classifier using hard-blocks.yaml
  reviewer.py      — review record storage (writes to governance.claim_reviews table)
  config.py        — settings (POSTGRES_URL, FULLSTACK_INTERNAL_API_KEY from env)
  schemas.py       — ReviewRequest, ReviewResponse pydantic models
pyproject.toml
Dockerfile
```

**DB table already exists:** `governance.claim_reviews` (from Phase 2 schema migration).

**Commit message:** `feat(arkham): implement claim classifier and publish-block enforcement`

**Done when:** `POST /review` with body `{"content":"guaranteed to cure anxiety","product":"stelargem","agent_name":"test"}` returns `decision: "BLOCK"` and `classification: "health_claim"`.

**Pickup:** Read existing rule files first, then implement classifier.

---

## Agent 6 — `hermes-paths`

**Task:** Fix all stale path references in AiSquad hermes-config from the old workspace location to the new repo location.

**Old path:** `/home/azureuser/hermes-workspace`  
**New path:** `/mnt/gemma4/stelar-platform/services/fullstack-aisquad`

**Find all occurrences on VM:**
```bash
ssh -i ~/.ssh/id_ed25519 -o StrictHostKeyChecking=no azureuser@20.10.150.44 \
  "grep -r '/home/azureuser/hermes-workspace' /mnt/gemma4/stelar-platform/services/fullstack-aisquad/ --include='*.yaml' --include='*.json' --include='*.toml' --include='*.env' -l"
```

**Then for each file found:**
```bash
sed -i 's|/home/azureuser/hermes-workspace|/mnt/gemma4/stelar-platform/services/fullstack-aisquad|g' <file>
```

**After all replacements:**
```bash
cd /mnt/gemma4/stelar-platform
git add services/fullstack-aisquad/
git commit -m "fix(aisquad): update hermes-config paths to new monorepo location"
git push origin main
```

**Verify:** `grep -r '/home/azureuser/hermes-workspace' services/fullstack-aisquad/` returns nothing.

**Done when:** Zero grep hits for old path. Commit pushed.

**Pickup:** Run the grep first to see what's left, then fix remaining files.

---

## How to Resume a Stalled Agent

If a session ends mid-build, any new session should:

1. Read this file: `docs/phase3-agents.md`
2. Check which agents are still `🔄 Running`
3. For each incomplete agent, follow the **Pickup** instructions in that section
4. Update the status column when done and push: `git commit -m "docs(agents): mark <name> complete"`

**Quick status check command:**
```bash
ssh -i ~/.ssh/id_ed25519 -o StrictHostKeyChecking=no azureuser@20.10.150.44 "
echo '=== GATEWAY ===' && ls services/fullstack-gateway/app/providers/ollama.py 2>/dev/null && echo OK
echo '=== STELARVACAY ===' && ls apps/stelarvacay-api/src/services/gateway.ts 2>/dev/null && echo OK
echo '=== STELARPEOPLE TS ===' && ls apps/stelarpeople-api/src/services/property.ts 2>/dev/null && echo OK || echo PENDING
echo '=== ARKHAM ===' && ls services/arkham-governance/src/main.py 2>/dev/null && echo OK || echo PENDING
echo '=== BICEP ===' && ls infra/containerapps/main.bicep 2>/dev/null && echo OK || echo PENDING
echo '=== HERMES PATHS ===' && grep -r hermes-workspace services/fullstack-aisquad/ --include=*.yaml -l 2>/dev/null | wc -l && echo files with old paths
" 2>/dev/null
```

---

## Phase 3 Done Definition

All 6 agents complete when:
- [ ] All 10 PostgreSQL schemas verified with correct table counts
- [ ] `POST /v1/ai/generate` on gateway returns Gemma output
- [ ] stelarpeople-api has no `.js` files in `src/services/`
- [ ] `infra/containerapps/` has Bicep for all 4 services
- [ ] Arkham blocks health/financial/legal claims
- [ ] Zero hermes-workspace path references in AiSquad config
