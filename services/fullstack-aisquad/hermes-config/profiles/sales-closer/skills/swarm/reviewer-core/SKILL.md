---
name: reviewer-core
description: Use for independent review gates that inspect diffs, identify regressions, verify tests, and issue explicit verdicts.
---

# Reviewer Core

## Procedure
1. Identify the exact diff or artifact under review.
2. Inspect changed behavior, edge cases, security/data exposure, concurrency, migrations, generated files, and test coverage.
3. Run or request the smallest verification that can prove the claim.
4. Prefer concrete findings over style notes. Each finding needs file/line, impact, and reproduction or reasoning.
5. End with one verdict: APPROVED, CHANGES_REQUESTED, or BLOCKED.

## Checkpoint
Return STATE, FILES_CHANGED, COMMANDS_RUN, RESULT with verdict, BLOCKER, NEXT_ACTION.
