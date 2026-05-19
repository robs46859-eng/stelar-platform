# Stelar Platform Handoff

Date: 2026-05-19
Host: Azure VM `gemmaco-key`
Repo: `/mnt/gemma4/stelar-platform`
Branch: `main`

## Current State

- Managed disk `/dev/sda1` is mounted at `/mnt/gemma4`.
- Repo is located at `/mnt/gemma4/stelar-platform`.
- FullStack AiSquad has been moved to the spec-aligned service root:
  `services/fullstack-aisquad/`.
- The legacy nested app root `services/fullstack-aisquad/hermes-workspace/` has been removed.
- `services/fullstack-aisquad/hermes-config/` remains as runtime profile/session/config state.
- Node 20.20.2 is installed under `/usr/local/bin/node`.
- npm 10.8.2 is installed under `/usr/local/bin/npm`.
- `@nodesify/graphify` is installed globally and exposed as `graphify`.

## Documentation Updated

- `CONTRIBUTING.md` now documents the service layout and graphify workflow.
- `SPEC.md` now records the FullStack AiSquad path standard and graphify requirement.
- `docs/IMPLEMENTATION_CHECKLIST.md` now marks the AiSquad move, Node install, and graphify install complete.
- `services/fullstack-aisquad/README.md` now describes FullStack AiSquad as the 45-agent marketing and growth layer.
- `services/fullstack-aisquad/AGENTS.md` now includes the non-negotiable Arkham/human approval publishing rule.

## Non-Negotiable Publishing Rule

```text
No external post, email, affiliate claim, landing page, sales copy, public product claim, health-touching copy, travel safety claim, legal/property claim, or partner outreach may publish without Arkham Governance review and human approval.
```

## Known Gaps

- Git remote is not configured yet, so pushing requires adding a remote.
- `services/fullstack-aisquad/hermes-config/` still contains historical runtime/session references to `/home/azureuser/hermes-workspace`.
- `hermes` runtime config paths still need a focused migration pass.
- FullStack Gateway is not scaffolded yet.
- Arkham Governance exists as a scaffold/policy layer but is not deployed.
- Container Apps services are not deployed yet.

## Recommended Next Steps

1. Configure a Git remote for `/mnt/gemma4/stelar-platform`.
2. Stage the FullStack AiSquad directory move with rename detection and commit:
   `docs(fullstack-aisquad): align service root with Azure spec`.
3. Run a focused path migration for `services/fullstack-aisquad/hermes-config/`.
4. Scaffold `services/fullstack-gateway/` with `/health`, `/ready`, and `/v1/ai/generate`.
5. Wire Gateway to the VM inference bridge at `127.0.0.1:18080` through the private path.
6. Implement Arkham Governance claim review and publish blocking.
7. Deploy Gateway, Arkham, then StelarVacay API first.
