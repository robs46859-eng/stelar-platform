# ICP-as-Shared-Skill Pattern

When a swarm needs workers to all reference the same customer profile, persona, or domain knowledge, store it as a shared SKILL.md in the same category directory and list it in every worker's `skills` array.

## How It Works

1. Place the ICP as `icp-<persona-name>` in `~/.hermes/skills/<category>/`
2. Every worker in the swarm lists it in their `skills` array alongside their core skill
3. Swarm.yaml workers reference it directly — no wrapper, no profile needed

## Template

```
---
name: icp-prepared-paige
description: Ideal Customer Profile for Prepared Paige — pregnancy/postpartum digital product consumer age 29-36, first pregnancy, $90K-200K HH income.
---

# Ideal Customer Profile: Persona Name

## Demographics
<table or bullet list>

## Psychographics
- key trait 1
- key trait 2

## Jobs-to-be-Done
- "quote from persona"

## Watering Holes (ranked by value)
1. Platform 1
2. Platform 2

## Buying Behavior
- impulse window, price ladder, triggers

## Common Objections
- objection → counter

## Messaging Angles That Convert
1. angle 1
2. angle 2
```

## Usage in swarm.yaml Workers

```yaml
skills:
  - <worker-id>-core        # worker's own skill
  - icp-prepared-paige      # shared ICP
  - humanizer               # other shared skills
```

## Why This Pattern

- Every worker loads the SAME file — no drift between copies
- Update ICP once → all workers benefit
- Agents can `skill_view('icp-prepared-paige')` at any time
- Location is predictable: `~/.hermes/skills/<category>/icp-<name>/`

## File Location

Store at `~/hermes-workspace/memory/icp-<name>.md` for human-readable reference.
Store at `~/.hermes/skills/<category>/icp-<name>/SKILL.md` for agent loading.

Both should be kept in sync. The agent-loaded version needs YAML frontmatter.
