# Final Repair Spec

## Scope

Final pre-deploy pass for `stelar-platform` covering local build health, Azure Container Apps deploy templates, and the production swarm placement.

## Findings

1. `apps/stelarpeople-api` did not compile.
   - `screening.ts` inferred overview rows as `{ prospect_name: string }`, then read `decision`.
   - Risk: image builds or CI fail before deployment.

2. `stelarpeople-api` health probes did not match the server.
   - Bicep probes called `/health` and `/ready`.
   - The server only exposed `/api/health` and `/api/ready`.
   - Risk: Azure Container Apps marks otherwise running revisions unhealthy.

3. `infra/containerapps/deploy.sh` only worked from the repo root.
   - README instructed `cd infra/containerapps && bash deploy.sh`.
   - The script referenced `infra/containerapps/main.bicep` relative to the caller.
   - Risk: documented deployment path fails.

4. Bicep emitted deployment-readiness warnings.
   - Fractional CPU values were string literals.
   - Key Vault URLs hardcoded `vault.azure.net`.
   - `main.bicep` declared an unused existing Key Vault resource.
   - Risk: noisy validation hides real issues and can block stricter CI.

5. `stelar-swarm-team` is not the production 45-agent layer.
   - The production agent build is `services/fullstack-aisquad` inside this repo.
   - Local inventory shows 51 worker entries in `swarm.yaml`, 50 worker docs, and 51 Hermes profiles.
   - Risk: deploying or repairing the wrong repository.

## Repair Plan

1. Fix the TypeScript type for screening overview applications.
2. Add `/health` and `/ready` aliases to `stelarpeople-api`.
3. Make the Container Apps deploy script location-independent and configurable by environment variables.
4. Clean Bicep warnings by using Azure environment suffixes and typed fractional CPU values.
5. Verify Node app builds, AiSquad tests/build, Bicep validation, and Azure deployment.
