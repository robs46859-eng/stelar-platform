# Revenue Triggered Swarm Workflows

Initialized: 2026-05-15T10:55:17Z
Workspace: ~/hermes-workspace
Trigger directory: ~/hermes-workspace/triggers/revenue
Dispatch command: `node ~/hermes-workspace/scripts/revenue-trigger-dispatch.mjs <payload.json>`

## Team
- revenue-orchestrator: trigger routing, approvals, pipeline state.
- market-intel: niches, competitors, leads, opportunity research.
- offer-architect: service packages, scopes, proposal structures.
- solution-builder: AI widgets, automations, integrations, demos, technical plans.
- listing-manager: service listings, catalog, marketplace/landing drafts.
- growth-promoter: promotion plans, content, outbound drafts, lead magnets.
- sales-closer: qualification, discovery, proposal drafts, close plans.
- delivery-manager: won-work onboarding, delivery plans, milestones, acceptance.
- customer-success: follow-up, support triage, retention, referrals/testimonials drafts.

## Trigger Types
- market_scan: find reachable niches and offers.
- lead_created: qualify lead and draft response.
- offer_idea: validate and package an offer.
- proposal_request: draft proposal plan and greenlight checklist.
- build_request: delivery/build planning for approved work.
- list_offer: draft service listing.
- promote_offer: draft campaign assets.
- closed_won: onboarding and delivery kickoff.
- follow_up_due: draft customer check-in or expansion follow-up.
- customer_issue: triage issue and draft response.

## Greenlight Boundary
The swarm may research, draft, plan, prototype, and queue work. It may not send, publish, buy ads, commit final prices, sign contracts, grant refunds/discounts, use customer credentials, or modify customer systems without explicit approval.

## Paused Cron Trigger Stubs
- Revenue daily market scan: `e1cbfaddc75e`, schedule `0 9 * * 1-5`, script `~/.hermes/scripts/revenue_market_scan.py`.
- Revenue follow-up sweep: `080c61a11d1c`, schedule `0 16 * * 1-5`, script `~/.hermes/scripts/revenue_followup_sweep.py`.

Resume with `hermes cron resume <job_id>` when you want these to run automatically. They are paused by default to avoid surprise model/API spend.

## Local Convenience Command
```bash
revenue-trigger --dry-run triggers/revenue/templates/new-lead.json
revenue-trigger triggers/revenue/templates/new-lead.json
```

## Webhook Note
Hermes webhook intake is not enabled on this VM yet. Keep webhook intake localhost-only or behind authenticated tunneling/reverse proxy before exposing it publicly.

## Examples
Dry run:
```bash
cd ~/hermes-workspace
node scripts/revenue-trigger-dispatch.mjs --dry-run triggers/revenue/templates/new-lead.json
```

Dispatch:
```bash
cd ~/hermes-workspace
node scripts/revenue-trigger-dispatch.mjs triggers/revenue/templates/new-lead.json
```
