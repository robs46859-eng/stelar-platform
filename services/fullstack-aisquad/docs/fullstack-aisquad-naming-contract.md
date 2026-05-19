# FullStack AiSquad Naming Contract

This service is for **FullStack AiSquad** marketing and growth operations in the Stelar / FullStack Azure deployment.

## Canonical product names

Use these names in all new UI, docs, skills, prompts, tests, review comments, and handoffs:

- **FullStack AiSquad**
- **FullStack Gateway**
- **Arkham Governance Sidecar**
- **Swarm**
- **Approval Queue**
- **HERMES_HOME**
- `~/.hermes`

## Forbidden new references

Do **not** introduce these in new work unless quoting legacy history or compatibility behavior:

- MamaNav
- CheapVacay
- RentOut
- ProjectMama
- direct public Ollama access
- auto-publish without review

## Legacy compatibility rule

If older code, docs, tests, or handoffs contain Hermes-era, MamaNav, CheapVacay, RentOut, or ProjectMama wording, treat it as legacy residue.

Default action:
- normalize it to Stelar / FullStack / Arkham naming
- preserve old wording only when explicitly documenting migration or backwards compatibility

## Runtime/path rules

For FullStack AiSquad runtime work, prefer:

- `HERMES_HOME`
- `~/.hermes/profiles/<workerId>`
- `claude`
- Hermes worker sessions

Do not expose raw Ollama endpoints or bypass Arkham Governance for live FullStack AiSquad behavior.

## Swarm/UI language rules

Prefer:
- **Ready** not person-specific hardcoded labels
- **Board / Cards / List** for reports views
- **FullStack AiSquad** and **Hermes Agent** in update/config/status UI

Avoid:
- person-specific product labels baked into UI
- Claude-branded wording in FullStack AiSquad surfaces

## Reviewer rule

Any PR or patch that introduces old product names or bypasses governance in FullStack AiSquad should be treated as a regression unless it is:
- a legacy compatibility note
- a migration guide
- a quoted historical artifact

## Agent instruction rule

When an agent is working in this repo:
- assume Stelar / FullStack / Arkham naming is canonical
- rewrite legacy product references to current names by default
- do not invent public model endpoints or auto-publish paths
- if uncertain, prefer the repository SPEC.md terminology
