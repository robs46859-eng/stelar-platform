# Resume Prompt

Use this prompt if the current CLI session is dropped:

```text
You are taking over /Users/joeiton/stelar-platform.

Read:
- /Users/joeiton/stelar-platform/HANDOFF.md
- /Users/joeiton/stelar-platform/PHASE_CLOSEOUT_SUMMARY.md
- /Users/joeiton/stelar-platform/docs/graphify-fragmentation.md

Current state:
- Repo: git@github.com:robs46859-eng/stelar-platform.git
- Working directory: /Users/joeiton/stelar-platform
- Azure subscription: d3a405bf-c7f7-4480-8fc0-a0762ebbb5c0
- Resource group: rg-stelar-prod
- VNET exists: vnet-stelar-prod, 10.0.0.0/16
- Subnets:
  - snet-containerapps: 10.0.0.0/23, delegated to Microsoft.App/environments
  - snet-private-endpoints: 10.0.2.0/27, private endpoint policies disabled
- Private endpoints approved:
  - pe-pg-stelar-prod: 10.0.2.4
  - pe-redis-stelar-prod: 10.0.2.5
  - pe-stelarstorageprod-blob: 10.0.2.6
- App Insights alert deployed:
  - alert-appinsights-failed-requests
  - requests/failed Count > 10 in 5m, severity 1, action group ag-stelar-ops
- Replacement Container Apps environment is live:
  - cae-stelar-prod-vnet
  - default domain: proudbay-d7864c81.eastus2.azurecontainerapps.io
- All 9 Container Apps are Succeeded/Running in cae-stelar-prod-vnet.
- External smoke tests passed:
  - stelarvacay-api /health 200
  - stelarpeople-api /health 200
  - stelargem-api /health 200
  - stelarvacay-web / 200
  - stelarpeople-web / 200
  - stelargem-web / 200
  - fullstack-dashboard / 200

Critical blockers:
- Existing Container Apps environment cae-stelar-prod cannot be VNET-integrated in place.
  Azure error: ManagedEnvironmentCannotAddVnetToExistingEnv.
- Service Bus private endpoint failed because sb-stelar-prod is not Premium.
  Azure error: PrivateEndpointInvalidSku.
- PostgreSQL public access has NOT been disabled yet. Confirm app-to-PostgreSQL connectivity from cae-stelar-prod-vnet before disabling it.
- stelar.host custom domains are NOT cut over to the VNET environment yet. Use the proudbay Azure Container Apps URLs until DNS/custom domains are updated.

Next tasks:
1. Verify git status and Azure state.
2. Cut over stelar.host custom domains to the proudbay Container Apps environment.
3. Confirm application DB connectivity from cae-stelar-prod-vnet.
4. Plan Service Bus migration to Premium before creating its private endpoint.
5. Only after VNET-integrated app DB connectivity is confirmed, disable PostgreSQL public access:
   az postgres flexible-server update -n pg-stelar-prod -g rg-stelar-prod --public-access Disabled
6. Use graphify fragments, not root-wide graphify update:
   ./scripts/graphify-fragments.sh
   SKIP_GRAPHIFY=1 ./scripts/graphify-fragments.sh
   ./scripts/capture-live-status.sh

Do not claim Phase 7 complete until Service Bus private endpoint exists, PostgreSQL public access is disabled, and post-lockdown smoke tests pass.
```
