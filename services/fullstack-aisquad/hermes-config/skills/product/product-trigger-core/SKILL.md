---
name: product-trigger-core
description: Use when processing local, cron, webhook, jira, github, or manual events that should launch a product development swarm mission.
---

# Product Trigger Core

```json
{
  "type": "new_feature | user_feedback | competitive_gap | market_opportunity | internal_innovation | feature_release | product_update | beta_launch | optimization_experiment",
  "source": "manual | cron | webhook | jira | github | customer",
  "feature": {},
  "product": {},
  "stakeholders": {},
  "notes": ""
}
```

Rules:
- Missing fields are blockers only when needed for the next step.
- Preserve source links, issue references, and raw notes.
- Do not ship, publish, announce, or change pricing without greenlight.
- Write artifacts under `memory/product/` or the assigned repo path.
