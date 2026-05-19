---
name: revenue-trigger-core
description: Use when processing local, cron, webhook, CRM, inbox, or manual events that should launch a revenue-pipeline swarm mission.
---

# Revenue Trigger Core

Normalize incoming events into this shape:

```json
{
  "type": "lead_created | offer_idea | proposal_request | build_request | list_offer | promote_offer | closed_won | follow_up_due | customer_issue | market_scan",
  "source": "manual | cron | webhook | crm | inbox",
  "lead": {},
  "customer": {},
  "offer": {},
  "notes": ""
}
```

Rules:
- Missing fields are blockers only when needed for the next step.
- Preserve source links and raw notes.
- Draft external actions, do not send or publish without greenlight.
- Write artifacts under `memory/revenue/` or the assigned repo path.
