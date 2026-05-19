# Arkham Governance Sidecar

Arkham is the red-team, compliance, safety, claim review, and approval gate layer for the Stelar platform.

## Responsibilities

1. Scan all agent-authored content for hard-block violations before publish
2. Route flagged content to human review queue
3. Block unsafe claims: health, legal, financial, travel safety, property compliance
4. Enforce the 90-day no-auto-publish rule
5. Audit affiliate and partner copy before any link or payout is created
6. Review any agent-created outbound message

## Structure

```
services/arkham-governance/
├── README.md                       ← this file
├── rules/
│   ├── hard-blocks.yaml            ← absolute publish blockers
│   └── claim-review.yaml           ← review routing triggers
└── gates/
    └── publish-gate.md             ← approval gate sequence and table
```

## Integration Points

- **FullStack Gateway** calls `POST /v1/governance/review` before returning agent output to any publisher
- **FullStack AiSquad** routes all outbound drafts through `compliance-reviewer` worker before the gate
- **Service Bus** `governance-review-requests` queue feeds the human review dashboard

## What Arkham Does NOT Do

- Arkham does not generate content
- Arkham does not make publish decisions autonomously
- Arkham does not override human rejection
