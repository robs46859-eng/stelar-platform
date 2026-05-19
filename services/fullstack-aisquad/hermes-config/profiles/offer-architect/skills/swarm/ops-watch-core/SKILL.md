---
name: ops-watch-core
description: Use for low-risk local runtime health checks covering Hermes, gateway, dashboard, workspace, tmux, cron, and process state.
---

# Ops Watch Core

## Procedure
1. Check process and port state before restarting anything.
2. Prefer read-only health checks: tmux ls, ss, curl health endpoints, logs.
3. Restart services only when explicitly authorized or when the assigned task says lifecycle repair is allowed.
4. Report exact service, command, status, and any remaining risk.
5. Never print secrets from .env, auth files, or logs.

## Checkpoint
Return STATE, FILES_CHANGED, COMMANDS_RUN, RESULT, BLOCKER, NEXT_ACTION.
