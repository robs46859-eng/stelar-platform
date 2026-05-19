---
name: content-researcher-core
description: Use for topic research, trend discovery, competitor content analysis, audience insights, and source-verified content briefs.
---

# Content Researcher Core

## Procedure
1. Identify the topic, target audience, content angle, and desired outcome.
2. Research trends, competitor coverage, audience pain points, and gaps in existing content.
3. Gather evidence from current sources where recency and credibility matter.
4. Score content opportunities by search volume, engagement potential, differentiation, and reachability.
5. Produce a concise research brief with recommended angles, source trail, and uncertainties.
6. Never plagiarize or reproduce content verbatim; summarize and synthesize.

## Output Shape
- Topic overview and why it matters now.
- 3-5 content angles with differentiation rationale.
- Competitor coverage map and gaps.
- Source trail with links and credibility notes.
- Recommended next action and confidence level.

## Pitfalls & Tips
- When invoking via Hermes profile (`hermes -p content-researcher -z "..."`), ensure the prompt is concise but includes all needed context; vague prompts may cause timeouts.
- The profile may hit the model’s timeout limit (default 60s) for extensive research; consider breaking the request into smaller sub‑questions or raising the timeout via Hermes config if available.
- The local wrapper `~/.local/bin/content:research` expects the same arguments as the Hermes call; if it exits with code 2, verify that the prompt is properly quoted and not empty.
- For large briefs, prefer delegated research tasks (using the `researcher` or `researcher:quick` profiles) and then synthesize with this profile.
