# Contributing to Stelar Platform


## Repository Layout

The production monorepo root is `/mnt/gemma4/stelar-platform` on the Azure VM managed disk.

Key paths:
- `services/fullstack-aisquad/` — FullStack AiSquad service root. This replaces the legacy nested `services/fullstack-aisquad/hermes-workspace/` layout.
- `services/fullstack-aisquad/hermes-config/` — runtime profiles, sessions, memories, and local agent config. Treat this as sensitive runtime state unless a file is explicitly promoted to source.
- `services/fullstack-gateway/` — required next service to expose the OpenAI-compatible internal API.
- `services/arkham-governance/` — publish safety, compliance review, and human approval gates.
- `services/ollama-bridge/` — VM-local bridge pattern for controlled Ollama access.

Do not reintroduce the `hermes-workspace` directory as an application root. New AiSquad code, docs, scripts, triggers, and package metadata belong directly under `services/fullstack-aisquad/`.

## Graphify

This repo uses graphify for local architecture context.

Before architecture or cross-module questions:

```bash
cat graphify-out/GRAPH_REPORT.md
```

After modifying code files:

```bash
graphify update .
```

On the Azure VM, `graphify` is installed as an alias to `nodesify-graphify`.

## Branch Strategy

```
main        Production-ready. No direct commits. Merge from staging only.
staging     Integration testing. Merge from feature/* after review.
feature/*   Short-lived feature work. Branch from staging.
hotfix/*    Urgent production fixes only. Branch from main, merge to main + staging.
```

Never commit directly to `main`. All merges to `main` require a passing `staging` build.

## Commit Format

All commits must follow Conventional Commits:

```
type(scope): description
```

**Allowed types:**

| Type | Use for |
|------|---------|
| `feat` | New feature or capability |
| `fix` | Bug fix |
| `chore` | Maintenance, deps, config |
| `sec` | Security fix or hardening |
| `docs` | Documentation only |
| `refactor` | Code change with no behaviour change |
| `test` | Tests only |
| `build` | Build system or CI changes |
| `ci` | CI pipeline changes |

**Scope** is the affected service or package in lowercase kebab-case:
`stelargem`, `stelarvacay`, `stelarpeople`, `fullstack-gateway`, `arkham`, `fullstack-aisquad`, `ollama-bridge`, `infra`, `shared-types`, `auth`, `telemetry`

**Examples:**
```
feat(stelargem): add corridor summary endpoint
fix(gateway): protect ollama bridge timeout
sec(arkham): enforce publish block on health claims
chore(infra): add Key Vault secret refs
docs(fullstack-aisquad): update swarm worker registry
```

## Pre-commit Checks

The `pre-commit` hook will block any staged commit containing:
- `.env` files or files matching `*.credentials.json`, `auth.json`, `*.pem`
- Private key content (`PRIVATE KEY`, `BEGIN RSA`, `BEGIN OPENSSH`, etc.)
- API key patterns (OpenAI `sk-`, AWS `AKIA`, GitHub `ghp_`, Slack `xox*`)
- Azure Storage `AccountKey=` values

**If blocked:** Remove the flagged content, add it to `.gitignore`, and store it in Azure Key Vault.

## Approval Gates

These paths require Arkham Governance review before merge:

| Path | Reason |
|------|--------|
| `services/fullstack-aisquad/**` | All agent config and output definitions |
| `services/arkham-governance/**` | Governance rule changes |
| `docs/**` | Security, launch, and runbook documentation |

These items **never** auto-execute. Agent drafts; human approves:

- Public marketing copy
- Health-touching copy
- Travel safety guidance
- Property / legal / compliance copy
- Tenant-screening recommendations
- Financial or accounting recommendations
- Affiliate and partner copy
- Any agent-created outbound message

## Secrets

- No secret may exist in code, `.env` committed files, Docker images, or agent memory.
- All production secrets live in Azure Key Vault (`kv-stelar-prod`).
- Apps retrieve secrets through managed identity only.
- VM credentials (`~/.credentials-*.json`) must be migrated to Key Vault before any product goes live.

## Service Standards

Every service must:
- Expose `/health` and `/ready`
- Emit structured JSON logs
- Include `tenant_id`, `product`, `agent_name`, `request_id`, `trace_id` in all AI run records
- Route all AI calls through FullStack Gateway — never call Ollama directly
