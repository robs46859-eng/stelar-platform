---
name: README
description: FullStack AiSquad — AI Agent Swarm Infrastructure
---

# FullStack AiSquad — AI Agent Swarm Infrastructure

Autonomous AI agent workspace with semantic swarm architecture. 48 specialized workers across 5 swarms, each with dedicated triggers, profiles, CLI wrappers, and approval gates.

## Mission (Active)

**4th Trimester Operating Manual** — Ship a 12-week postpartum digital guide (mobile PDF + 90-min audio) for first-time moms on Stan Store.
- **Target:** 100 paid units before kill check
- **Kill criteria:** <30 organic sales/cycle after 3 cycles
- **ICP:** "Prepared Paige" — 29–36yo, $90K–200K income, iPhone-first
- **Status:** Phase 1 (signal collection) complete. 83 signals collected (14 ENGAGE, 69 WATCH).
- **See:** `missions/4th-trimester-manual.md`, `missions/HANDOFF.md`

## Quick Start

```bash
# List all active agents
hermes sessions

# Run a specific worker
hermes -p reddit-monitor       # Reddit signal monitor
hermes -p content:write        # Content worker
hermes -p signal:orchestrate   # Signal orchestrator

# Trigger-based dispatch
./scripts/product-trigger-dispatch.mjs --dry-run
./scripts/engagement-trigger-dispatch.py --dry-run

# Restart session (applies config changes like Chrome sandbox fix)
/new
```

## Swarm Architecture

### Base Swarm

**Workers:** 10

| Worker | Wrapper | Role |
|--------|---------|------|
| `orchestrator` ✅ | `orchestrator:plan` | Swarm Orchestrator / Greenlight Gate |
| `km-agent` ✅ | `km:health` | RAZSOC / GBrain Knowledge Steward |
| `builder` ✅ | `builder:task` | Scoped Implementation Agent |
| `reviewer` ✅ | `reviewer:gate` | Independent Review / Merge Gate |
| `qa` ✅ | `qa:smoke` | Browser / Workflow / CLI Smoke Verification |
| `researcher` ✅ | `researcher:quick` | Brain-first Research / Bounded Autoresearch |
| `ops-watch` ✅ | `ops:health` | Local Infra / Runtime Health Watch |
| `maintainer` ✅ | `maintainer:check` | Upstream Dependency / Patch Hygiene |
| `strategist` ✅ | `strategist:review` | Wedges / Bets / Kill Criteria |
| `inbox-triage` ✅ | `inbox:triage` | Capture / Discard / Route / Task Triage |

### Product Swarm

**Workers:** 8

| Worker | Wrapper | Role |
|--------|---------|------|
| `product-orchestrator` ✅ | `product:orchestrate` | Product Pipeline Orchestrator / Greenlight Gate |
| `product-manager` ✅ | `pm:frame` | Problem Framing / Requirements / Roadmap Agent |
| `product-experience-director` ✅ | `ped:vision` | UX Strategy / Experience Vision Agent |
| `product-engineer` ✅ | `pe:build` | Technical Feasibility / Architecture / Delivery Agent |
| `product-marketing-manager` ✅ | `pmm:launch` | GTM Strategy / Positioning / Launch Comms Agent |
| `project-manager` ✅ | `md:track` | Milestone Tracking / Resource Coordination Agent |
| `product-qa` ✅ | `qa:verify` | Quality Assurance / Release Verification Agent |
| `brand-visionary` ✅ | `bv:brand` | Brand Identity / Sales Samples / Prospective Client Materials Agent |

**Triggers (10 total):**

| Trigger | Routed To |
|---------|----------|
| `beta_launch` | `project-manager`, `product-qa`, `product-marketing-manager`, `product-engineer` |
| `competitive_gap` | `product-manager`, `product-marketing-manager`, `product-engineer`, `product-orchestrator` |
| `domain_acquisition` | `product-manager`, `brand-visionary`, `product-experience-director`, `product-engineer`, `content-writer`, `product-orchestrator` |
| `feature_release` | `project-manager`, `product-qa`, `product-marketing-manager`, `product-orchestrator`, `product-engineer` |
| `internal_innovation` | `product-engineer`, `product-manager`, `product-orchestrator` |
| `market_opportunity` | `product-manager`, `product-marketing-manager`, `product-experience-director` |
| `new_feature` | `product-manager`, `product-experience-director`, `product-engineer`, `project-manager`, `product-orchestrator` |
| `optimization_experiment` | `product-manager`, `product-qa`, `product-engineer`, `project-manager` |
| `product_update` | `product-manager`, `product-marketing-manager`, `project-manager` |
| `user_feedback` | `product-manager`, `product-experience-director`, `product-qa`, `project-manager` |

### Media Swarm

**Workers:** 8

| Worker | Wrapper | Role |
|--------|---------|------|
| `media-orchestrator` ✅ | `media:orchestrate` | Content Pipeline Orchestrator / Greenlight Gate |
| `content-researcher` ✅ | `content:research` | Topic Research / Trend Discovery Agent |
| `content-planner` ✅ | `content:plan` | Editorial Calendar / Content Strategy Agent |
| `content-writer` ✅ | `content:write` | Script / Blog / Social Copy Writer |
| `content-producer` ✅ | `content:produce` | Video / Audio / Music / Media Production Agent |
| `visual-designer` ✅ | `visual:design` | Thumbnails / Infographics / Visual Asset Agent |
| `distribution-manager` ✅ | `distribution:manage` | Publishing / Channel / Scheduling Agent |
| `analytics-reviewer` ✅ | `analytics:review` | Performance Analysis / Content Audit Agent |

**Triggers (8 total):**

| Trigger | Routed To |
|---------|----------|
| `channel_update` | `distribution-manager`, `content-producer` |
| `content_audit` | `analytics-reviewer`, `content-researcher` |
| `content_idea` | `content-researcher`, `content-planner`, `media-orchestrator` |
| `editorial_deadline` | `content-writer`, `content-planner`, `distribution-manager` |
| `performance_review` | `analytics-reviewer`, `content-planner` |
| `production_request` | `content-producer`, `visual-designer` |
| `publish_ready` | `distribution-manager`, `media-orchestrator`, `analytics-reviewer` |
| `trend_alert` | `content-researcher`, `content-planner` |

### Engagement Swarm

**Workers:** 10

| Worker | Wrapper | Role |
|--------|---------|------|
| `signal-orchestrator` ✅ | `signal:orchestrate` | Central Engagement Swarm Coordinator |
| `reddit-monitor` ✅ | `reddit:monitor` | Reddit Parenting Community Signal Detector |
| `youtube-monitor` ✅ | `yt:monitor` | YouTube Pregnancy/Parenting Content Monitor |
| `linkedin-monitor` 💤 SLEEPING | `linkedin:monitor` | LinkedIn Career & Funding Signal Monitor |
| `quora-monitor` ✅ | `quora:monitor` | Quora Parenting Question Monitor |
| `instagram-monitor` ✅ | `ig:monitor` | Instagram Reels & Carousel Signal Monitor |
| `engagement-writer` ✅ | `engage:write` | Authentic Response Writer |
| `compliance-reviewer` ✅ | `compliance:review` | Health/Medical Compliance Auditor |
| `funnel-manager` ✅ | `funnel:nurture` | Email Funnel and Nurture Sequence Architect |
| `partnership-scout` ✅ | `partner:scout` | Influencer / Expert Partner Finder and Outreach Drafter |

**Triggers (13 total):**

| Trigger | Routed To |
|---------|----------|
| `affiliate_review` | `partnership-scout`, `compliance-reviewer` |
| `campaign_review` | `engagement-writer`, `compliance-reviewer`, `signal-orchestrator` |
| `competitor_update` | `linkedin-monitor` 💤, `signal-orchestrator` |
| `compliance_review` | `compliance-reviewer` |
| `engagement_queue_ready` | `engagement-writer`, `signal-orchestrator` |
| `funnel_flow_active` | `funnel-manager`, `signal-orchestrator` |
| `instagram_signal` | `instagram-monitor`, `signal-orchestrator` |
| `linkedin_signal` | `linkedin-monitor` 💤, `signal-orchestrator` |
| `partner_opportunity` | `partnership-scout`, `signal-orchestrator` |
| `quora_signal` | `quora-monitor`, `signal-orchestrator` |
| `reddit_signal` | `reddit-monitor`, `signal-orchestrator` |
| `signal_detected` | `signal-orchestrator`, `engagement-writer` |
| `youtube_signal` | `youtube-monitor`, `signal-orchestrator` |

### Revenue Swarm (10 sleeping)

**Workers:** 9 (all sleeping)

| Worker | Wrapper | Role |
|--------|---------|------|
| `revenue-orchestrator` 💤 SLEEPING | `revenue:orchestrate` | Revenue Pipeline Orchestrator / Greenlight Gate |
| `market-intel` 💤 SLEEPING | `market:scan` | Market / Lead Research Agent |
| `offer-architect` 💤 SLEEPING | `offer:design` | Service Offer / Packaging Agent |
| `solution-builder` 💤 SLEEPING | `solution:build` | AI Widget / Automation / Integration Builder |
| `listing-manager` 💤 SLEEPING | `listing:publish` | Listings / Catalog / Marketplace Agent |
| `growth-promoter` 💤 SLEEPING | `growth:promote` | Promotion / Content / Campaign Agent |
| `sales-closer` 💤 SLEEPING | `sales:close` | Sales / Discovery / Proposal Agent |
| `delivery-manager` 💤 SLEEPING | `delivery:manage` | Fulfillment / Project Delivery Agent |
| `customer-success` 💤 SLEEPING | `success:followup` | Customer Follow-up / Retention Agent |

**Triggers (11 total):**

| Trigger | Routed To |
|---------|----------|
| `build_request` | `delivery-manager` 💤, `solution-builder` 💤 |
| `closed_won` | `delivery-manager` 💤, `solution-builder` 💤, `customer-success` 💤 |
| `customer_issue` | `customer-success` 💤, `delivery-manager` 💤, `solution-builder` 💤 |
| `domain_flip` | `offer-architect` 💤, `listing-manager` 💤, `market-intel` 💤, `sales-closer` 💤, `revenue-orchestrator` 💤 |
| `follow_up_due` | `customer-success` 💤, `sales-closer` 💤 |
| `lead_created` | `market-intel` 💤, `sales-closer` 💤, `revenue-orchestrator` 💤 |
| `list_offer` | `listing-manager` 💤, `offer-architect` 💤 |
| `market_scan` | `market-intel` 💤, `offer-architect` 💤, `revenue-orchestrator` 💤 |
| `offer_idea` | `market-intel` 💤, `offer-architect` 💤, `solution-builder` 💤 |
| `promote_offer` | `growth-promoter` 💤, `sales-closer` 💤 |
| `proposal_request` | `sales-closer` 💤, `offer-architect` 💤, `solution-builder` 💤, `revenue-orchestrator` 💤 |

---

## Directory Structure

```
~/fullstack-aisquad/
├── swarm.yaml                          # Master worker registry (48 workers)
├── AGENTS.md                           # Agent roster table
├── missions/
│   ├── 4th-trimester-manual.md         # Full 6-phase mission plan
│   ├── 4th-trimester-checklist.md      # Execution checklist
│   ├── execution-status.md             # Live phase tracker
│   ├── signals_dossier.md              # 83 scored signals from Reddit/Quora/YouTube
│   └── HANDOFF.md                      # Handoff document (this session)
├── triggers/
│   ├── product/
│   │   ├── trigger-map.yaml            # Product swarm routing
│   │   └── templates/                  # JSON trigger payloads
│   ├── media/
│   │   ├── trigger-map.yaml            # Media swarm routing
│   │   └── templates/
│   ├── revenue/
│   │   ├── trigger-map.yaml            # Revenue swarm routing
│   │   └── templates/
│   └── engagement/
│       ├── trigger-map.yaml            # Engagement swarm routing
│       └── templates/
├── scripts/
│   ├── product-trigger-dispatch.mjs    # Product dispatch script
│   ├── media-trigger-dispatch.mjs      # Media dispatch script
│   ├── revenue-trigger-dispatch.mjs    # Revenue dispatch script
│   ├── engagement-trigger-dispatch.py  # Engagement dispatch script
│   ├── domain-hunter-pipeline.py       # Domain → swarm dispatcher
│   └── marketplace-monitor.py          # GoDaddy + Dynadot scanner
├── agents/                             # README per worker
└── integrations/
    ├── godaddy/                        # GoDaddy API wrapper
    └── dynadot/                        # Dynadot API wrapper

~/.hermes/
├── skills/
│   ├── revenue/                        # Revenue worker skills
│   ├── product/                        # Product worker skills
│   ├── media/                          # Media worker skills
│   ├── engagement/                     # Engagement worker skills
│   └── domain-hunter-pipeline/         # Domain pipeline skill
├── profiles/                           # Worker profiles (7 dirs × 48 workers)
└── config.yaml                         # Hermes agent config

~/domain-hunter/
└── domain_hunter.py                    # Proactive domain discovery engine
```

## Approval Gates — Master Table

These **never** auto-execute. The agent drafts; you approve.

| Gate | Drafted By | Approved By |
|------|-----------|-------------|
| Manuscript final | `content:write` | RN/IBCLC + you |
| Disclaimer + refund policy | `compliance:review` | Lawyer + you |
| Stan/Etsy/Gumroad listings | `listing:publish` | You |
| Pricing changes | `offer:design` | You |
| Email sends | `funnel:nurture` | You |
| Social posts | `distribution:manage` | You |
| Engagement comments | `engage:write` | You |
| Partner outreach | `partner:scout` | You |
| Affiliate payouts | `partner:scout` | You |
| Any public claim | `compliance:review` | You |

## Credentials

| Platform | Account | File | Notes |
|----------|---------|------|-------|
| Instagram | @stelarbaby | `~/.credentials-ig.json` | Burner account, view-only |
| Stan Store | stelartechos@gmail.com | `~/.credentials-stan.json` | Payout not configured |
| YouTube API | Active | `~/.credentials-ig.json` | Verified working |
| Reddit | N/A | None needed | Public RSS |
| Quora | N/A | None needed | Public search |

All credentials are `chmod 600` and excluded from git via `.gitignore`.

---

*Generated by Hermes agent on 2026-05-15. Run `/new` to restart session after config changes.*
