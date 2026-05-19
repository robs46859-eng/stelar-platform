---
name: autoresearch
description: Use for mechanical optimization loops where success can be measured by a locked scalar eval and guarded against regressions.
---

# Autoresearch

Do not use for taste, strategy, or manually judged research. Use only when a verifier emits a parseable metric.

## Guardrails
- The loop may not edit evals, fixtures, answer keys, or scoring scripts.
- A passing metric with failing guards is a failed iteration.
- Equal metric with more complexity is not an improvement.
- Destructive, public, credential, deploy, merge, or bulk actions require greenlight.
