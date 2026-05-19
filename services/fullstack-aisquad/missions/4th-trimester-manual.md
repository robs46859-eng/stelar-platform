---
name: plan-4th-trimester-manual.md
created: 2026-05-15
goal: Ship 4th Trimester Operating Manual on Stan Store
target_units: 100_paid_pre_kill
kill_criteria: "<30 organic sales/cycle after 3 cycles"
product: digital-postpartum-guide
status: phase-0
---

# 4th Trimester Operating Manual — Mission Plan

## Phase 0 — Initialize
### Step 0.1 — Set Mission

**Agent**: `base:orchestrator:plan`
```
mission: Ship 4th Trimester Operating Manual on Stan Store.
         Target: 100 paid units before kill check.
         Kill criteria: <30 organic sales/cycle after 3 sales cycles.
```

### Step 0.2 — Lock Wedge + Exits
**Agent**: `base:strategist:review`
- Confirm wedge: 4th trimester (postpartum weeks 0-12) — underserved, high anxiety, immediate need
- Confirm kill criteria: <30 organic sales/cycle, 3 cycles, then diagnose or pivot
- Output: wedge confirmed, bets locked

### Step 0.3 — Load Context
**Agent**: `base:km:health`
- Ingest: ICP.md (Prepared Paige), this playbook, disclaimer template, brand guidelines
- Store as source-of-record for all downstream agents

---

## Phase 1 — Engagement (LISTEN MODE)
Runs BEFORE product build. Output feeds product research. Continues running after launch.

### Step 1.1 — Configure Signal Orchestrator
**Agent**: `engagement:signal:orchestrate` (mode: LISTEN_ONLY)
- ICP: Prepared Paige, postpartum 0-12 weeks
- min_score: 70
- prime_window: 21:00-01:00 ET (her breastfeeding window)
- Output: signal queue

### Step 1.2 — Activate Monitors (Parallel)

| Monitor | Targets | Notes |
|---------|---------|-------|
| `engagement:reddit:monitor` | r/BabyBumps, r/beyondthebump, r/breastfeeding, r/sleeptrain | FREE, RSS-based, no credentials |
| `engagement:quora:monitor` | postpartum recovery, BF pain, baby sleep W1-12, red flags | FREE, RSS-based, no credentials |
| `engagement:yt:monitor` | Top 50 pregnancy/parenting channels | WAITING — needs YouTube API key |
| `engagement:ig:monitor` | #4thtrimester #postpartumlife #firsttimemom #newbornlife | Burner account @stelarbaby, view-only |

### Step 1.3 — Triage Output
**Agent**: `engagement:signal:orchestrator` (review queue)
- Human gate: read top 100 signals
- Tag: pain phrases, exact pull-quotes, competitor mentions, fear topics, recurring questions by postpartum week
- Output: `signals_dossier.md` (raw input for content:research)

---

## Phase 2 — Product Creation

### Step 2.1 — Research Brief
**Agent**: `media:content:research`
- Inputs: signals_dossier.md, ICP.md
- Outputs: per-week pain map, language register, competitor product list, claim-evidence ledger seed

### Step 2.2 — Frame the Product
**Agent**: `product:product:orchestrate`
**Agent**: `product:pm:frame`
PRD spec:
- 12 weekly chapters × 5 fixed sections (body / baby / mental / partner / call doctor)
- 3 appendices: decision tree, feeding+diaper log, partner scripts
- Acceptance: <8000 words core, ≤90-min audio, every health claim citation-backed, 6th-grade reading level

### Step 2.3 — Source Content (Parallel × 12)
**Agent**: `base:researcher:quick` (one per chapter)
- Medical sources for body week N
- Developmental milestones for baby week N
- PPD/PPA screening, red-flag thresholds
- Output: `chapter_N_sources.md` (citations only, no prose)

### Step 2.4 — Draft Chapters (Sequential for voice)
**Agent**: `media:content:write`
- Constraints: no "should", prefer "many moms", no absolutes, cite reviewer name once per chapter
- Output: `chapter_N_draft.md`, `appendix_decision_tree.md`

### Step 2.5 — Design Experience (Parallel)
**Agent**: `product:ped:vision` → PDF layout spec, mobile-first, audio timing
**Agent**: `media:visual:design` → Cover, chapter dividers, decision-tree infographic (4 formats)
**Agent**: `media:content:produce` → 12 × ~8-min audio episodes from drafts

### Step 2.6 — Brand Kit
**Agent**: `product:bv:brand`
- Brand identity doc, sales-page visual language
- Social-asset templates (Reels, carousels, Pinterest pins, YouTube thumbs)

---

## Phase 3 — Optimization & Gates

### Step 3.1 — QA
**Agent**: `product:qa:verify` (BLOCKING)
- Factual accuracy vs sources, internal consistency
- Accessibility (alt text, contrast), readability score
- Mobile-PDF rendering on iPhone
- Output: per-chapter pass/fail

### Step 3.2 — Compliance
**Agent**: `engagement:compliance:review` (BLOCKING)
- Every health/nutritional/safety claim has cited source
- No absolutes ("will", "cures", "guarantees")
- Lawyer-approved disclaimer on PDF cover, audio intro, sales page, checkout
- Refund policy meets FTC + Stan requirements
- No impermissible IBCLC/medical-advice framing
- Output: BLOCKING report

### Step 3.3 — Human Gates (Cannot Skip)
- [ ] RN, CNM, or IBCLC reviews manuscript (paid $500-1500)
- [ ] Lawyer approves disclaimer + refund policy ($300-500)
- [ ] You read every chapter end-to-end on iPhone

### Step 3.4 — Re-run After Redlines
- `media:content:write` → apply reviewer redlines
- `product:qa:verify` → re-run
- `engagement:compliance:review` → re-run

---

## Phase 4 — Stan Store Listing

### Step 4.1 — Design SKUs
**Agent**: `base:revenue:orchestrate` (when awake) → `offer:design`
- SKU-001: $39 core
- SKU-002: $29 founding price, first 100 buyers, time-boxed
- SKU-003: $49 gift edition
- BUNDLE: $59 (Manual + Decision Tree + Partner Playbook) — draft, release after 200 sales

### Step 4.2 — Draft Listings
**Agent**: `base:listing:publish` (when awake)
- Per platform: title, subtitle, long description, hero image, gallery, tags, price, refund policy
- Stan-specific: link-in-bio layout, checkout customization, abandoned-cart copy, Apple Pay
- Human gate: you publish manually

### Step 4.3 — Funnel Setup
**Agent**: `engagement:funnel:nurture`
- Lead magnet: "Is this an emergency?" decision-tree PDF (FREE)
- Welcome sequence: 5 emails over 7 days
- Post-purchase: testimonial ask at 14d + 45d
- Abandoned cart: 2 emails, 24h
- Tool: Kit/ConvertKit
- Human gate: approve every email

### Step 4.4 — Launch Assets
**Agent**: `product:pmm:launch` → positioning, 5 hook variations, "founding mothers" narrative
**Agent**: `media:content:plan` → 30-day editorial calendar
**Agent**: `media:content:write` + `media:visual:design` + `media:content:produce` → full first-30-content batch
**Agent**: `media:distribution:manage` → scheduled queue

### Step 4.5 — Partnership Pipeline
**Agent**: `engagement:partner:scout`
- 25 IBCLCs with newsletters, 25 postpartum doulas, mom-influencers 5K-50K
- Warm-intro drafts (batch of 10/day), affiliate 40% revshare
- Human gate: approve every outbound message

---

## Phase 5 — Engagement (ACTIVE MODE)

### Step 5.1 — Flip Mode
**Agent**: `engagement:signal:orchestrate` (mode: ENGAGE)

### Step 5.2 — Draft Responses
**Agent**: `engagement:engage:write`
- Reddit: casual honest, 2-4 sentences, no link unless asked
- Quora: helpful personal tone, 1 paragraph, cite sources
- YouTube: conversational comment, 1-2 sentences
- Instagram: warm short reply, 1 sentence + natural emoji
- Hard rule: NO product mention unless directly asked
- Hard rule: every draft passes humanizer + compliance:review
- Output: review queue (no auto-post)

### Step 5.3 — Seed Founding Mothers (MANUAL)
- You personally DM 20 free copies in 5 Facebook bumper groups for testimonials

---

## Phase 6 — Ongoing Optimization Loop

### Step 6.1 — Approval Cadence (You)
- engage:write queue → approve 10-20 comments per session
- distribution:manage queue → approve next scheduled posts
- funnel:nurture queue → approve outbound emails
- partner:scout queue → approve outreach messages
- listing:publish queue → approve listing edits

### Step 6.2 — Analytics
**Agent**: `media:analytics:review`
- Per-hook conversion, per-channel CPA/ROAS, save/share/click rates
- Refund rate, gift-buyer fraction (>25% → lean into gift positioning)
- Email list growth, open rate, CTR, RPS

### Step 6.3 — Re-prioritize Content
**Agent**: `media:content:plan`
- Double down on top 3 converting hooks → 5 variations each
- Kill bottom-quartile formats

### Step 6.4 — Kill Criteria Check
**Agent**: `base:strategist:review`
- PASS (>=30 organic sales/cycle): release $59 BUNDLE, spin up Weeks 13-26 companion, activate registry affiliates
- FAIL: 1 adjustment per cycle (not 4), if 2 consecutive fails → invoke kill

---

## Approval Gates — Master List

| Gate | Drafted By | Approved By |
|------|-----------|-------------|
| Manuscript final | content:write | RN/IBCLC reviewer + you |
| Disclaimer + refund | compliance:review | Lawyer + you |
| Stan / Etsy / Gumroad listings | listing:publish | You |
| Pricing changes | offer:design | You |
| Email sends | funnel:nurture | You |
| Social posts | distribution:manage | You |
| Engagement comments | engage:write | You |
| Partner outreach | partner:scout | You |
| Affiliate payouts | partner:scout | You |
| Any public claim | compliance:review | You |

## Credentials

| Platform | Account | Status |
|----------|---------|--------|
| Instagram (@stelarbaby) | Hermes123! | SECURED, view-only, burner account |
| Stan Store (stelartechos@gmail.com) | Hermes123! | SECURED |
| YouTube | WAITING | Needs API key setup |
| LinkedIn | SLEEPING | Reactivate when ready |

## Sleeping Agents

Revenue swarm (9 workers): `revenue-orchestrator`, `market-intel`, `offer-architect`, `solution-builder`, `listing-manager`, `growth-promoter`, `sales-closer`, `delivery-manager`, `customer-success`

Social monitor: `linkedin-monitor`

Reason: B2C focus (Prepared Paige) takes priority. Revenue swarm reactivated when funnel manager replaces B2C sales functions. Reactivate when needed for SKU design + listing management.
