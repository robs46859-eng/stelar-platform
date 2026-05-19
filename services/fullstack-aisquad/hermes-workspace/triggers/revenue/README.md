# Revenue Triggered Swarm

This directory contains local trigger payloads for the revenue pipeline swarm.

Run a trigger without dispatching:

```bash
cd ~/fullstack-aisquad
node scripts/revenue-trigger-dispatch.mjs --dry-run triggers/revenue/templates/new-lead.json
```

Dispatch it to live swarm sessions:

```bash
cd ~/fullstack-aisquad
node scripts/revenue-trigger-dispatch.mjs triggers/revenue/templates/new-lead.json
```

Supported trigger types: `market_scan`, `lead_created`, `offer_idea`, `proposal_request`, `build_request`, `list_offer`, `promote_offer`, `closed_won`, `follow_up_due`, `customer_issue`.

External emails, DMs, proposals, published listings, ads, customer commitments, credentials, deploys, refunds, discounts, and contracts remain human-greenlight actions.
