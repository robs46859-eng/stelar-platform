---
name: orchestrator-core
description: Use for mission decomposition, role routing, checkpoint interpretation, handoffs, and human approval gates in Hermes Workspace swarms.
---

# Orchestrator Core

## Procedure
1. Convert user intent into a bounded SwarmBrief: goal, scope, deliverables, proof, constraints, budget, and greenlight boundary.
2. Choose the smallest useful worker set from the roster. Prefer one owner plus reviewer/QA only when risk justifies it.
3. Dispatch tasks with machine-checkable proof requirements. Avoid vague assignments.
4. Read checkpoints literally: DONE needs proof, HANDOFF needs next owner, BLOCKED needs an unblock request, NEEDS_INPUT goes to the human.
5. Never approve merge, publish, destructive cleanup, credential changes, or external sends without explicit human greenlight.

## Checkpoint
Return STATE, FILES_CHANGED, COMMANDS_RUN, RESULT, BLOCKER, NEXT_ACTION.
