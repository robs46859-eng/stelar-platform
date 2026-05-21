# Phase 7 Security Hardening Checklist

Working directory: `/Users/joeiton/stelar-platform`

Resource group: `rg-stelar-prod`
Region: `eastus2`
Subscription: `d3a405bf-c7f7-4480-8fc0-a0762ebbb5c0`

## 1. VNET and Subnets

- [x] Confirm repo is clean on `main`
- [x] Create VNET `vnet-stelar-prod`
  - Address space: `10.0.0.0/16`
- [x] Create Container Apps subnet `snet-containerapps`
  - Prefix: `10.0.0.0/23`
  - Resource ID: `/subscriptions/d3a405bf-c7f7-4480-8fc0-a0762ebbb5c0/resourceGroups/rg-stelar-prod/providers/Microsoft.Network/virtualNetworks/vnet-stelar-prod/subnets/snet-containerapps`
- [x] Create private endpoints subnet `snet-private-endpoints`
  - Prefix: `10.0.2.0/27`
  - Private endpoint network policies: `Disabled`
  - Resource ID: `/subscriptions/d3a405bf-c7f7-4480-8fc0-a0762ebbb5c0/resourceGroups/rg-stelar-prod/providers/Microsoft.Network/virtualNetworks/vnet-stelar-prod/subnets/snet-private-endpoints`
- [x] Verify original Container Apps environment is not integrated
  - `cae-stelar-prod` cannot be VNET-integrated in place. Azure returned `ManagedEnvironmentCannotAddVnetToExistingEnv`.
- [x] Create replacement VNET-integrated Container Apps environment
  - `cae-stelar-prod-vnet`
  - Default domain: `proudbay-d7864c81.eastus2.azurecontainerapps.io`

## 2. Private Endpoints

- [x] PostgreSQL `pg-stelar-prod`
  - Group ID: `postgresqlServer`
- [x] Redis
  - Source secret: `kv-stelar-prod/REDIS-URL`
- [ ] Service Bus `sb-stelar-prod`
  - Group ID: `namespace`
  - Blocked: Azure requires Service Bus Premium for private endpoints. Current namespace returned `PrivateEndpointInvalidSku`.
- [x] Storage `stelarstorageprod`
  - Group ID: `blob`

## 3. Destructive Step

- [x] Integrate Container Apps with `snet-containerapps`
  - Completed by creating replacement environment `cae-stelar-prod-vnet`; existing `cae-stelar-prod` could not be modified in place.
- [x] Wait for all 9 Container Apps to return to `Running`
- [x] Run smoke tests
  - `stelarvacay-api /health` 200
  - `stelarpeople-api /health` 200
  - `stelargem-api /health` 200
  - `stelarvacay-web /` 200
  - `stelarpeople-web /` 200
  - `stelargem-web /` 200
  - `fullstack-dashboard /` 200

This step is "destructive" because the Container Apps environment networking changes cause app revisions to restart and may briefly interrupt service.

## 4. Lock Down PostgreSQL

- [ ] Disable PostgreSQL public access only after app-to-PostgreSQL connectivity is confirmed from `cae-stelar-prod-vnet`

## 5. Alerts

- [x] Create App Insights failed-request alert via ARM
  - Resource: `ai-stelar-prod`
  - Metric: `requests/failed`
  - Threshold: `> 10 in 5m`
  - Action group: `ag-stelar-ops`
  - Severity: `1`

## 6. Finalize

- [x] Run partial smoke tests
- [x] Update `HANDOFF.md`
- [x] Implement graphify fragmentation; do not run root-wide `graphify update .`
- [ ] Cut over `stelar.host` custom domains to `proudbay-d7864c81.eastus2.azurecontainerapps.io`
- [ ] Commit infra/documentation changes
- [ ] Push `main`
