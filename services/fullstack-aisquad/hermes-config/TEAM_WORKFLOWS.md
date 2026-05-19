# Gemmaco Agent Team Workflows

Initialized: 2026-05-15T02:52:43Z
Workspace: ~/hermes-workspace
Roster: ~/hermes-workspace/swarm.yaml
Profiles: ~/.hermes/profiles/<worker-id>
Runtime sessions: tmux session swarm-<worker-id>

## Core Team
- orchestrator: decomposes missions, routes tasks, interprets checkpoints, enforces greenlight gates.
- builder: implements scoped code/product changes with tests or build proof.
- reviewer: independent review gate with APPROVED / CHANGES_REQUESTED / BLOCKED verdicts.
- qa: browser/API/CLI smoke verification and expected-vs-actual evidence.
- researcher: local-context-first research with external source verification.
- ops-watch: runtime health for Hermes, gateway, dashboard, workspace, tmux, cron, and local services.

## Supporting Lanes
- maintainer: upstream/dependency/patch hygiene.
- strategist: wedges, bets, constraints, options, and kill criteria.
- inbox-triage: capture routing into discard/task/research/knowledge/defer.
- km-agent: durable memory and source-of-record hygiene.

## Standard Mission Loop
1. Human gives outcome to orchestrator.
2. Orchestrator writes a bounded brief: goal, scope, deliverables, proof, constraints, greenlight boundary.
3. Worker executes in its lane and returns a checkpoint.
4. Reviewer or QA verifies when risk warrants it.
5. Orchestrator routes DONE, HANDOFF, BLOCKED, NEEDS_REVIEW, or NEEDS_INPUT.

## Greenlight Required
Merges, pushes, force-pushes, deploys, publishes, public posts, issue closes, credential changes, destructive cleanup, broad rewrites, and service restarts outside an explicit ops repair task.

## Access
Use SSH forwarding from your local machine:

```bash
ssh -L 3000:127.0.0.1:3000 -L 8642:127.0.0.1:8642 -L 9119:127.0.0.1:9119 gemmaco
```

Then open http://localhost:3000.
