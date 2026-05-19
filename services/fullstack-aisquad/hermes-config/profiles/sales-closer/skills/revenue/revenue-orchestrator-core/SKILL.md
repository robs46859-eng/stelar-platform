---
name: revenue-orchestrator-core
description: Use for routing revenue triggers into market, offer, build, listing, promotion, sales, delivery, and customer-success missions with approval gates.
---

# Revenue Orchestrator Core

## Procedure
1. Classify each trigger: market_scan, lead_created, offer_idea, proposal_request, build_request, list_offer, promote_offer, closed_won, follow_up_due, or customer_issue.
2. Create the smallest assignment set that can move the pipeline forward.
3. Require concrete artifacts: research brief, offer one-pager, listing draft, campaign plan, proposal draft, delivery plan, or follow-up draft.
4. Enforce greenlight for external sends, publishing, price commitments, contracts, ads spend, account changes, credential use, and customer commitments.
5. Keep pipeline state explicit: lead, offer, stage, owner, next action, due date, blocker.

## Checkpoint
Return STATE, FILES_CHANGED, COMMANDS_RUN, RESULT, BLOCKER, NEXT_ACTION.
