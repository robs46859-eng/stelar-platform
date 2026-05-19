---
name: browser-harness-power-use
description: Use for browser automation and screenshot-based verification with deterministic expected-vs-actual checks.
---

# Browser Harness Power Use

## Procedure
1. Start from a concrete URL and expected behavior.
2. Use browser automation for screenshots, DOM checks, console errors, network failures, and responsive states.
3. Verify the page is not blank and the relevant element is visible before judging styling.
4. Report exact viewport, URL, and reproduction steps.
5. Do not treat visual inspection as a substitute for functional checks when APIs or tests exist.
