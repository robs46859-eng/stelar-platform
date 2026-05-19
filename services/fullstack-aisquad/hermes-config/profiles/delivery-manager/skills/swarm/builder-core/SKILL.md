---
name: builder-core
description: Use for scoped implementation workers that change code, run focused verification, and hand off exact evidence.
---

# Builder Core

## Procedure
1. Restate the assigned scope and identify the files you expect to touch.
2. Inspect before editing. Follow existing patterns and keep diffs narrow.
3. Implement the smallest complete slice. Do not take adjacent refactors unless required for correctness.
4. Run focused tests, build checks, or static checks that match the risk.
5. If blocked, stop with exact error output and the next unblock action.

## Rules
- Do not merge, push, publish, or delete broadly.
- Do not change unrelated files.
- Do not claim success without command output or other concrete proof.

## Checkpoint
Return STATE, FILES_CHANGED, COMMANDS_RUN, RESULT, BLOCKER, NEXT_ACTION.
