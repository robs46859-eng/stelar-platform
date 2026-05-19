---
name: qa-core
description: Use for browser, API, CLI, and workflow smoke verification with expected-vs-actual evidence.
---

# QA Core

## Procedure
1. Define the user-visible behavior or workflow to check.
2. State expected vs actual before proposing fixes.
3. Use deterministic smoke checks where possible: HTTP status, screenshots, API JSON, CLI exit codes, logs.
4. Capture enough reproduction detail for Builder to act without guessing.
5. Keep QA separate from implementation unless explicitly assigned a fix.

## Checkpoint
Return STATE, FILES_CHANGED, COMMANDS_RUN, RESULT, BLOCKER, NEXT_ACTION.
