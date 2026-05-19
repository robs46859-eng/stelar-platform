# Stelar Platform — Implementation Checklist

**Spec:** SPEC.md v2 (path-corrected)  
**Repo:** `/mnt/gemma4/stelar-platform` on `gemma4-data-disk`  
**Principle:** Each phase must be complete before the next begins. Governance locks before any service code is written.

---

## Phase 0 — Governance (Lock First)

Establishes the invariants everything else inherits.

- [x] `commit-msg` hook enforcing `feat|fix|chore|sec|docs(scope): message`
- [x] `pre-commit` hook blocking staged `.env`, `*.credentials.json`, `auth.json`, and private key patterns
- [x] `staging` branch created off `main`
- [x] `CODEOWNERS` — Arkham review required for `services/fullstack-aisquad/**` and `docs/**`
- [x] `CONTRIBUTING.md` — branch strategy, commit format, approval gate rules
- [x] `services/arkham-governance/` scaffolded with hard-block rule definitions (SPEC § 8.3, § 16)
- [x] Publish-block policy document committed: no auto-post, no health/legal/financial claims without review
- [ ] Credentials on VM (`~/.credentials-ig.json`, `~/.credentials-stan.json`) flagged for Key Vault migration
- [x] Verify `.gitignore` covers all credential and runtime state patterns

---

## Phase 1 — VM Infrastructure

VM and model are running. Remaining items harden and extend the inference surface.

- [x] VM provisioned (`gemmaco-key`, eastus2, Standard_E8s_v3)
- [x] `gemma4-data-disk` attached and mounted at `/mnt/gemma4` (UUID-pinned in `/etc/fstab`)
- [x] Ollama 0.24.0 active, `OLLAMA_MODELS=/mnt/gemma4/ollama`
- [x] `gemma4:26b` installed (17 GB, Q4_K_M, 25.8B params)
- [x] Stale partial blobs cleaned (~10 GB reclaimed)
- [x] SSH from Mac configured (`arkham_key` injected via VMAccess, `gemmaco-key` alias)
- [x] Lock Ollama to `127.0.0.1:11434` — set `OLLAMA_HOST=127.0.0.1:11434` in systemd, verify with `ss -ltnp`
- [x] Install inference bridge at `/opt/fullstack-ollama-bridge` (SPEC § 10)
- [x] Inference bridge systemd service enabled and active
- [x] Bridge secret loaded from file or Key Vault (not hardcoded)
- [x] Bridge health check passes: `curl http://127.0.0.1:18080/health`
- [x] Bridge generate endpoint tested end-to-end through Ollama

---

## Phase 2 — Azure Cloud Infrastructure

No product code deploys until these exist.

- [x] Azure Resource Group `rg-stelar-prod` in `eastus2`
- [x] Azure Key Vault `kv-stelar-prod` with RBAC enabled
- [x] All required secrets stored in Key Vault (SPEC § 8.1): `gemmaco-key`, `POSTGRES-URL`, `REDIS-URL`, `SERVICEBUS-CONNECTION`, `BLOB-STORAGE-CONNECTION`, `JWT-SIGNING-KEY`, `FULLSTACK-INTERNAL-API-KEY`, `OLLAMA-BRIDGE-SHARED-SECRET`
- [ ] VM credentials migrated from `~/.credentials-*.json` to Key Vault
- [x] Azure Container Apps environment `cae-stelar-prod` created
- [x] Azure Container Registry `acrstelarprod` created (admin disabled, managed identity access)
- [x] Azure Database for PostgreSQL Flexible Server provisioned
- [ ] All 10 schemas created: `identity`, `billing`, `products`, `stelargem`, `stelarvacay`, `stelarpeople`, `agents`, `governance`, `worldgraph`, `telemetry`
- [ ] Minimum table set created (SPEC § 7.1)
- [x] Azure Cache for Redis provisioned
- [x] Azure Blob Storage account with 6 containers: `stelargem-media`, `stelarvacay-plans`, `stelarpeople-inspections`, `fullstack-exports`, `arkham-reviews`, `logs-archive`
- [x] Azure Service Bus with 8 queues/topics (SPEC § 7.3)
- [x] Application Insights + Log Analytics workspace connected
- [ ] Managed identities configured for all Container Apps
- [ ] Private endpoints enabled for Key Vault, database, Redis, storage

---

## Phase 3 — Core Services

Deploy in order. Each is a dependency for the next.

- [ ] `services/fullstack-gateway/` scaffolded (FastAPI or Node, OpenAI-compatible internal API)
- [ ] Gateway implements all required endpoints (SPEC § 6.1)
- [ ] Gateway provider config for `gemma4_26b_ollama_vm` (SPEC § 13)
- [ ] Gateway routing table for all four products (SPEC § 13)
- [ ] Gateway deployed to Container Apps as `fullstack-gateway`
- [ ] Gateway wired to inference bridge via private channel
- [ ] Gateway smoke test passes: `POST /v1/ai/generate` returns Gemma output
- [ ] `services/arkham-governance/` implemented — claim classification, publish-block enforcement
- [ ] Arkham deployed to Container Apps as `arkham-governance`
- [ ] Arkham blocks unsafe claim test (SPEC § 17.3)
- [ ] All governance approval gates wired (SPEC § 16 workflow)

---

## Phase 4 — Product APIs

- [ ] `stelargem-api` scaffolded and deployed — neighborhood profile, corridor scoring, worldgraph pipeline
- [ ] `stelarvacay-api` scaffolded and deployed — quote engine, itinerary builder, budget compression
- [ ] `stelarpeople-api` scaffolded and deployed — property intake, leasing, maintenance, owner reports
- [ ] All APIs route AI calls through Gateway only (no direct Ollama access)
- [ ] All APIs expose `/health` and `/ready`
- [ ] All APIs emit structured JSON logs with required fields (SPEC § 3.3)
- [ ] All API smoke tests pass

---

## Phase 5 — Web Apps + Dashboard

- [ ] `stelargem-web` scaffolded and deployed
- [ ] `stelarvacay-web` scaffolded and deployed
- [ ] `stelarpeople-web` scaffolded and deployed
- [ ] `fullstack-dashboard` scaffolded and deployed
- [ ] No old names in UI (`MamaNav`, `CheapVacay`, `RentOut`) — all use Stelar namespace
- [ ] All apps authenticate through managed identity, not static keys
- [ ] Login flow works end-to-end
- [ ] Gateway calls return Gemma output through each product

---

## Phase 6 — FullStack AiSquad

- [ ] AiSquad paths updated to reflect repo location (`/mnt/gemma4/stelar-platform/services/fullstack-aisquad`)
- [ ] `hermes` config.yaml paths corrected for new repo location
- [ ] Instagram Chrome sandbox fixed (`/new` session reload or headless flag)
- [ ] LinkedIn monitor reactivated
- [ ] Phase 1 signal collection completed (all 4 monitors active)
- [ ] Phase 2 product creation started (4th Trimester Manual)
- [ ] AiSquad wired to Arkham Governance for all outbound content
- [ ] AiSquad wired to FullStack Gateway for all Gemma calls
- [ ] Hard approval gates enforced — no auto-post in first 90 days
- [ ] Revenue swarm activated when product is live
- [ ] Stan Store payout configured

---

## Phase 7 — Security & Observability Hardening

- [ ] `sudo ss -ltnp | grep 11434` confirms `127.0.0.1` only
- [ ] No secrets in repo — full scan passes
- [ ] Database firewall rules restricted to Container Apps only
- [ ] All Blob containers default to private
- [ ] Logs confirmed free of raw secrets and sensitive user content
- [ ] Alerts created for all conditions in SPEC § 21
- [ ] Azure Backup or disk snapshots configured for `gemma4-data-disk`
- [ ] PostgreSQL automated backups enabled (7-day retention for beta)
- [ ] Soft delete and versioning enabled on production Blob containers

---

## Phase 8 — Domains, TLS, and Beta Launch

- [ ] Custom domains configured on Container Apps
- [ ] Managed TLS certificates issued
- [ ] End-to-end smoke test suite passes (SPEC § 17.1–17.5)
- [ ] Azure Monitor alerts live
- [ ] Logs and traces appear in Application Insights
- [ ] Old Render / GCS / Supabase / Firebase config removed from production
- [ ] Beta traffic opened

---

## Done Definition (SPEC § 23)

All boxes checked when:

- `gemma4:26b` responds from VM through FullStack Gateway
- No app calls Ollama directly
- All products use Stelar names
- FullStack AiSquad can draft but not auto-publish
- Arkham blocks unsafe claims
- Key Vault holds `gemmaco-key` and all production secrets
- `/mnt/gemma4` survives VM reboot
- Container Apps expose healthy endpoints
- Logs and traces appear in Azure Monitor
- Render / GCS / Supabase / Firebase removed from production config
