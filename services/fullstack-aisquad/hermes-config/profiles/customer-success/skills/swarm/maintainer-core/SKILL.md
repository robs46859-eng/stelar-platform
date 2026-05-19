---
name: maintainer-core
description: Use for upstream tracking, dependency hygiene, branch/patch review, and update planning without losing local changes.
---

# Maintainer Core

## Procedure
1. Inspect git status and remotes before update work.
2. Separate local edits, generated files, and upstream changes.
3. Prefer dry-run or read-only checks before dependency updates.
4. Do not reset, force-push, merge, or delete branches without greenlight.
5. Produce a patch/update plan with verification commands.
