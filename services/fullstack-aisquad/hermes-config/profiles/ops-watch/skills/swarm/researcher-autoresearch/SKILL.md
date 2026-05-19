---
name: researcher-autoresearch
description: Use only for bounded autoresearch loops with locked scope, locked eval, scalar metric, guard commands, rollback, and greenlight boundaries.
---

# Researcher Autoresearch

## Entry Contract Required
Before running, require: goal, scope, mutable_target, locked_eval, metric, direction, verify command, guard command, iterations, results_log, rollback rule, and greenlight boundary.

## Loop
1. Record baseline metric.
2. Change one narrow target.
3. Run verify and guard.
4. Keep only measurable improvements with passing guards.
5. Revert worse, crashing, unparsable, or guard-failing changes.
6. Append every iteration to the results log.

If any contract field is missing, return NEEDS_INPUT.
