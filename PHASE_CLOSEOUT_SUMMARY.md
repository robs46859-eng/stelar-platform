# Phase 4 & 5 Deployment Closeout

- **Status**: Completed
- **Timestamp**: 2026-05-20
- **Deliverables**: 
    - Fullstack Gateway, People API/Web, Vacay API/Web provisioned on Azure Container Apps.
    - DNS records active for `stelar.host` and subdomains.
    - AcrPull permissions assigned to all Managed Identities.
    - Stripe Service scaffolded.
- **Current Phase**: Phase 6 (AiSquad Wiring)
- **Immediate Task**: Fix Chrome Sandbox for agents and wire to inference bridge.

---

# Phase 7 Security Hardening Closeout

- **Status**: Partially completed; blocked by Azure platform constraints
- **Timestamp**: 2026-05-20
- **Working directory**: `/Users/joeiton/stelar-platform`

## Completed

- Created `vnet-stelar-prod` in `rg-stelar-prod` / `eastus2`
- Created `snet-containerapps` (`10.0.0.0/23`) and delegated it to `Microsoft.App/environments`
- Created `snet-private-endpoints` (`10.0.2.0/27`) with private endpoint policies disabled
- Created and linked private DNS zones for PostgreSQL, Redis, Service Bus, and Blob Storage
- Created approved private endpoints:
  - `pe-pg-stelar-prod` → `10.0.2.4`
  - `pe-redis-stelar-prod` → `10.0.2.5`
  - `pe-stelarstorageprod-blob` → `10.0.2.6`
- Deployed App Insights failed-request alert:
  - Resource: `ai-stelar-prod`
  - Metric: `requests/failed`
  - Aggregation: `Count`
  - Threshold: `> 10 in 5m`
  - Action group: `ag-stelar-ops`
  - Severity: `1`
- Added graphify fragmentation workflow:
  - `graphify-fragments.json`
  - `scripts/graphify-fragments.sh`
  - `scripts/capture-live-status.sh`
  - `docs/graphify-fragmentation.md`
- Captured live Azure status into `graphify-out/live/latest.json`

## Blockers

- `cae-stelar-prod` cannot be VNET-integrated in place.
  - Azure error: `ManagedEnvironmentCannotAddVnetToExistingEnv`
  - Required path: create a new VNET-integrated Container Apps environment and redeploy/cut over all 9 apps.
- `sb-stelar-prod` cannot have a private endpoint on its current SKU.
  - Azure error: `PrivateEndpointInvalidSku`
  - **RESOLVED**: Removed `servicebus.bicep` from `main.bicep`. Replaced with
    Azure Queue Storage queues (`agent-run-queue`, `governance-queue`) in
    `storage.bicep`, which are covered by the existing `pe-stelarstorageprod-blob`
    private endpoint. $0 additional cost. No app code consumed Service Bus.
- PostgreSQL public access remains enabled.
  - Reason: Container Apps are not yet VNET-integrated, so disabling public access would risk taking services offline.

## Verification

- All 9 Container Apps remained `Running`
- Smoke checks returned HTTP 200 for:
  - `stelarpeople-api /health`
  - `stelarvacay-api /health`
  - `stelargem-api /health`
  - `fullstack-dashboard /`
