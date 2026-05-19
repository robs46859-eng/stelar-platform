# 4th Trimester Operating Manual — Execution Plan

**Mission:** Ship 4th Trimester Operating Manual on Stan Store
**Target:** 100 paid units before kill check
**Kill Criteria:** <30 organic sales/cycle after 3 sales cycles
**ICP:** Prepared Paige (first-time mom, 29-36, 7-min attention windows, iPhone-first, buys 9pm-1am)
**Status:** Phase 0 — IN PROGRESS

---

## PHASE 0 — Initialize

| Step | Task | Agent | Output | Dependencies | Approval Gate |
|------|------|-------|--------|-------------|---------------|
| 0.1 | Set mission scope, target, kill criteria | `orchestrator:plan` | Mission locked | None | None — auto |
| 0.2 | Confirm wedge + exits (wedge: postpartum weeks 0-12, kill: <30/cyc x 3) | `strategist:review` | Wedge confirmed, bets locked | 0.1 | Strategic alignment |
| 0.3 | Ingest ICP, this playbook, brand guidelines, disclaimer template into KM store | `km-agent:health` | Source-of-record loaded | None | None |

**Dependencies within phase:** 0.2 depends on 0.1. 0.3 is parallel.
**Phase 0 completion criteria:** Mission set, wedge locked, context stored.

**CURRENT STATUS:** 0.1 ✓ Done. 0.2 ✓ Done. 0.3 ✓ Done. — Phase 0 COMPLETE.

---

## PHASE 1 — Engagement (LISTEN MODE)

Runs BEFORE product build. Output feeds Phase 2 research. Continues running after launch.

| Step | Task | Agent | Output | Dependencies | Approval Gate |
|------|------|-------|--------|-------------|---------------|
| 1.1 | Configure Signal Orchestrator (LISTEN_ONLY mode, min_score: 70, prime window 21:00-01:00 ET) | `signal-orchestrator:orchestrate` | Signal queue configured | Phase 0 | None |
| 1.2a | Activate Reddit monitor (r/BabyBumps, r/beyondthebump, r/breastfeeding, r/sleeptrain) | `reddit-monitor:monitor` | Reddit signal stream | 1.1 | None — RSS, no creds |
| 1.2b | Activate Quora monitor (postpartum recovery, BF pain, baby sleep W1-12, red flags) | `quora-monitor:monitor` | Quora signal stream | 1.1 | None — RSS, no creds |
| 1.2c | Activate YouTube monitor (Top 50 pregnancy/parenting channels) | `yt-monitor:monitor` | YouTube signal stream | 1.1 | None — needs YouTube API key |
| 1.2d | Activate Instagram monitor (#4thtrimester, #postpartumlife, #firsttimemom, #newbornlife; burner @stelarbaby) | `ig-monitor:monitor` | Instagram signal stream | 1.1 | None — view-only, creds secured |
| 1.3 | Triage top 100 signals: tag pain phrases, pull-quotes, competitor mentions, fear topics, recurring questions by week | `signal-orchestrator:orchestrate` (review queue) | `signals_dossier.md` | 1.2a, 1.2b, 1.2c, 1.2d | Human gate: read and validate top 100 |

**Dependencies within phase:** 1.2a-d are all parallel once 1.1 is done. 1.3 requires all 1.2 monitors active and producing signals.
**Phase 1 completion criteria:** `signals_dossier.md` exists with tagged signals across all active monitors.

**BLOCKED ON HUMAN ACTION:** YouTube monitor needs API key. Can proceed immediately with Reddit + Quora + Instagram.

---

## PHASE 2 — Product Creation

| Step | Task | Agent | Output | Dependencies | Approval Gate |
|------|------|-------|--------|-------------|---------------|
| 2.1 | Research Brief: per-week pain map, language register, competitor product list, claim-evidence ledger seed | `content-researcher:research` | Research brief doc | Phase 1 (`signals_dossier.md`), ICP | None |
| 2.2 | Frame the Product: 12 weekly chapters x 5 sections, 3 appendices, acceptance criteria (<8000 words, <90min audio, claims cited, 6th-grade reading) | `product:orchestrate` → `pm:frame` | PRD spec | 2.1 | Product strategy approval |
| 2.3 | Source Content ×12 (parallel): medical sources, developmental milestones, PPD/PPA screening, red flags per chapter | `researcher:quick` (1 per chapter, 12 total) | `chapter_N_sources.md` citations only | 2.2 | None |
| 2.4 | Draft Chapters (sequential for voice consistency): no "should", prefer "many moms", no absolutes, cite reviewer name once/chapter | `content-writer:write` | `chapter_N_draft.md`, `appendix_decision_tree.md` | 2.3 (all 12 sources) | None |
| 2.5a | Design Experience: PDF layout spec, mobile-first, audio timing | `product-experience-director:vision` / `ped:vision` | Layout spec | 2.4 | None |
| 2.5b | Visual Design: cover, chapter dividers, decision-tree infographic (4 formats) | `visual-designer:design` | Design assets | 2.5a | None |
| 2.5c | Audio Production: 12 x ~8-min audio episodes from drafts | `content-producer:produce` | Audio files | 2.4 | None |
| 2.6 | Brand Kit: brand identity doc, sales-page visual language, social asset templates (Reels, carousels, Pinterest, YouTube thumbs) | `brand-visionary:brand` | Brand kit package | 2.2 (PRD) | None |

**Dependencies within phase:** 2.3 depends on 2.2. 2.4 depends on 2.3 (all 12). 2.5a depends on 2.4; 2.5b depends on 2.5a; 2.5c depends on 2.4. 2.6 depends on 2.2 but can run parallel to 2.3-2.5.
**2.5a/b/c can run partially in parallel:** 2.5a starts after 2.4 completes. 2.5c starts after 2.4 completes. 2.5b waits on 2.5a.
**Phase 2 completion criteria:** All 12 chapters drafted, designed, and produced in audio format. Brand kit complete.

---

## PHASE 3 — Optimization & Gates

| Step | Task | Agent | Output | Dependencies | Approval Gate |
|------|------|-------|--------|-------------|---------------|
| 3.1 | QA: factual accuracy vs sources, internal consistency, accessibility (alt text, contrast), readability score, mobile-PDF iPhone rendering | `product-qa:verify` (BLOCKING) | Per-chapter pass/fail report | Phase 2 complete | QA gate must pass |
| 3.2 | Compliance: every health claim cited, no absolutes, lawyer-approved disclaimer on PDF+audio+sales+checkout, FTC+Stan refund policy, no impermissible IBCLC/medical-advice framing | `compliance-greenlight` (BLOCKING) | Compliance report | Phase 2 complete | Compliance gate must pass |
| 3.3 | HUMAN GATES (Cannot Skip): | — | — | — | — |
| 3.3a | RN/CNM/IBCLC reviews manuscript (paid $500-1500) | Human expert | Clinical review sign-off | 3.1 | RN/IBCLC sign-off required |
| 3.3b | Lawyer approves disclaimer + refund policy ($300-500) | Human lawyer | Legal review sign-off | 3.2 | Legal sign-off required |
| 3.3c | You read every chapter on iPhone | You (Paige) | Read-through approval | 3.1 | Personal approval required |
| 3.4 | Re-run After Redlines: apply reviewer edits, re-run QA, re-run compliance | `content-writer:write` → `product-qa:verify` → `compliance-greenlight` | Updated manuscript, passing reports | 3.3a, 3.3b, 3.3c | QA + Compliance must re-pass |

**Dependencies within phase:** 3.1 and 3.2 run in parallel (both depend on Phase 2). 3.3a requires 3.1 done. 3.3b requires 3.2 done. 3.3c requires 3.1 done. 3.4 requires all of 3.3.
**Phase 3 completion criteria:** QA pass, compliance pass, human sign-offs complete, redlines applied, re-verification passes.

**BLOCKED ON HUMAN ACTION:** Three human gates — clinical reviewer hire, lawyer hire, personal read-through. These are hard blockers before Phase 4.

---

## PHASE 4 — Stan Store Listing

| Step | Task | Agent | Output | Dependencies | Approval Gate |
|------|------|-------|--------|-------------|---------------|
| 4.1 | Design SKUs: $39 core, $29 founding first-100, $49 gift, $59 bundle (post-200) | `revenue-orchestrator:orchestrate` → `offer-architect:design` | SKU structure | Phase 3 | Pricing approval |
| 4.2 | Draft Listings: title, subtitle, long description, hero image, gallery, tags, price, refund policy, Stan-specific layout, checkout, abandoned-cart, Apple Pay | `listing-manager:publish` | Draft listing package | 4.1 | Human gate: you publish manually |
| 4.3 | Funnel Setup: lead magnet (emergency decision-tree PDF), 5-email welcome sequence, post-purchase testimonial emails (14d + 45d), abandoned cart (2 emails, 24h). Tool: Kit/ConvertKit | `funnel:nurture` (engagement swarm) | Email sequence drafts | 4.1 | Human gate: approve every email |
| 4.4a | Launch positioning: 5 hook variations, "founding mothers" narrative | `product-marketing-manager:launch` | Positioning doc | Phase 3 | None |
| 4.4b | 30-day editorial calendar | `content-planner:plan` | Calendar | 4.4a | None |
| 4.4c | First-30-content batch: write + design + produce full batch | `content-writer:write` + `visual-designer:design` + `content-producer:produce` | Content assets | 4.4b | Human gate: approve content |
| 4.4d | Scheduled queue: load content into distribution schedule | `distribution-manager:manage` | Scheduled queue | 4.4c | Human gate: approve schedule |
| 4.5 | Partnership Pipeline: 25 IBCLCs, 25 postpartum doulas, mom-influencers 5K-50K; warm-intro drafts (10/day), affiliate 40% revshare | `partner:scout` (engagement swarm) | Outreach list + drafts | Phase 3 | Human gate: approve every outbound |

**Dependencies within phase:** 4.1 depends on Phase 3. 4.2 depends on 4.1. 4.3 depends on 4.1 (can run parallel to 4.2). 4.4a depends on Phase 3, can run parallel to 4.1-4.3. 4.4b depends on 4.4a. 4.4c depends on 4.4b. 4.4d depends on 4.4c. 4.5 depends on Phase 3 and can run parallel to 4.2-4.4.
**Phase 4 completion criteria:** Listings drafted, funnel configured, content batch produced and scheduled, partnership pipeline active.

**BLOCKED ON HUMAN ACTION:** Manual publish on Stan, email approvals, content approvals, outbound message approvals. Revenue swarm currently SLEEPING — must be awakened for 4.1+.

---

## PHASE 5 — Engagement (ACTIVE MODE)

| Step | Task | Agent | Output | Dependencies | Approval Gate |
|------|------|-------|--------|-------------|---------------|
| 5.1 | Flip Signal Orchestrator from LISTEN to ENGAGE mode | `signal-orchestrator:orchestrate` | Active engagement mode | Phase 4 (product live) | None |
| 5.2 | Draft Responses: Reddit (casual 2-4 sent, no link unless asked), Quora (helpful, cite sources), YouTube (conversational 1-2 sent), IG (warm 1 sentence + emoji). Hard rule: NO product mention unless asked. Every draft passes humanizer + compliance:review | `engage:write` (engagement swarm) | Draft review queue | 5.1 | Compliance review + human approval |
| 5.3 | Seed Founding Mothers: personally DM 20 free copies in 5 Facebook bumper groups for testimonials | **MANUAL — You (Paige)** | 20 testimonials seeded | Phase 4 (product live) | Manual action required |

**Dependencies within phase:** 5.1 depends on Phase 4 (product must be live). 5.2 depends on 5.1. 5.3 depends on Phase 4.
**5.3 is purely manual — agents cannot access Facebook groups.**
**Phase 5 completion criteria:** Engagement mode active, response drafting pipeline running, founding mothers seeded.

**BLOCKED ON HUMAN ACTION:** No auto-posting — all social responses require human approval. Facebook group seeding is fully manual.

---

## PHASE 6 — Ongoing Optimization Loop

| Step | Task | Agent | Output | Dependencies | Approval Gate |
|------|------|-------|--------|-------------|---------------|
| 6.1 | Approval Cadence: approve 10-20 comments/session, next scheduled posts, outbound emails, outreach messages, listing edits | **MANUAL — You (Paige)** | Approved content pipeline | Phase 5 active | Ongoing human action |
| 6.2 | Analytics Review: per-hook conversion, per-channel CPA/ROAS, save/share/click, refund rate, gift fraction (>25% = lean into gift), email list growth/open/CTR/RPS | `analytics-reviewer:review` | Analytics report | Phase 5 active (needs data) | None |
| 6.3 | Re-prioritize Content: double down on top 3 converting hooks (5 variations each), kill bottom-quartile formats | `content-planner:plan` | Updated content strategy | 6.2 | None |
| 6.4 | Kill Criteria Check: PASS (>=30 organic/cycle → release $59 bundle, spin up Weeks 13-26, registry affiliates). FAIL → 1 adjustment per cycle, 2 consecutive fails → kill | `strategist:review` | Go/No-Go decision | 6.2 (after 3 full sales cycles) | Strategic decision — human final call |

**Dependencies within phase:** 6.1 runs continuously from Phase 5 forward. 6.2 requires sales data (post-launch). 6.3 depends on 6.2. 6.4 depends on 6.2 after 3 full sales cycles.
**Phase 6 is cyclical** — it's a continuous operating loop, not a one-time phase.
**Phase 6 completion criteria:** Not applicable — this is the ongoing optimization engine. Success = passing kill criteria at cycle 3.

**BLOCKED ON HUMAN ACTION:** Approval cadence (6.1) is ongoing human labor. Kill criteria decision (6.4) is a strategic call — human makes final go/no-go.

---

## CRITICAL PATH

```
Phase 0 (DONE)
    ↓
Phase 1 (LISTEN) → Reddit ✓ | Quora ✓ | IG ✓ | YouTube ⏳ (needs API key)
    ↓ signals_dossier.md
Phase 2 (CREATE): 2.1 → 2.2 → 2.3(×12) → 2.4 → 2.5a/b/c + 2.6
    ↓ manuscript + audio + brand kit
Phase 3 (GATES): 3.1 QA || 3.2 Compliance → 3.3 HUMAN (RN/IBCLC + Lawyer + Read) → 3.4 Re-run
    ↓ ALL GATES PASSED
Phase 4 (LIST): 4.1 → 4.2 + 4.3 || 4.4a→b→c→d || 4.5
    ↓ LISTED + LIVE
Phase 5 (ENGAGE): 5.1 → 5.2 || 5.3 (manual)
    ↓ ONGOING
Phase 6 (OPTIMIZE): 6.1 (ongoing) ←→ 6.2 → 6.3 → 6.4 (cycle 3 kill check)
```

---

## APPROVAL GATES — MASTER LIST

| Gate | Drafted By | Approved By | Timing |
|------|-----------|-------------|--------|
| Wedge confirmation | strategist:review | You | Phase 0 — already done |
| Signals dossier (top 100) | signal-orchestrator | You | Phase 1.3 |
| PRD / Product framing | pm:frame | You | Phase 2.2 |
| Manuscript final draft | content-writer:write | RN/IBCLC reviewer + You | Phase 3.3a, 3.3c |
| Disclaimer + refund policy | compliance-greenlight | Lawyer + You | Phase 3.3b |
| SKU pricing | offer-architect:design | You | Phase 4.1 |
| Stan Store listings | listing-manager:publish | You (manual publish) | Phase 4.2 |
| Email sequences | funnel:nurture | You | Phase 4.3 |
| Social content batch | content-writer + visual-designer | You | Phase 4.4c |
| Partner outreach messages | partner:scout | You | Phase 4.5 |
| Social engagement replies | engage:write | You | Phase 5.2 |
| Analytics-driven pivot | strategist:review | You (final call) | Phase 6.4 |

---

## AGENT STATUS SUMMARY

| Swarm | Workers | Status | Notes |
|-------|---------|--------|-------|
| Base Swarm | orchestrator, strategist, km-agent, researcher, builder, reviewer, qa, ops-watch, maintainer, inbox-triage | ACTIVE | Core routing + KM working |
| Revenue Swarm | All 9 workers | SLEEPING | Wake at Phase 4.1 for SKU design |
| Media Swarm | All 8 workers | SLEEPING | Wake at Phase 2.1 for content research |
| Product Swarm | All 7 workers | SLEEPING | Wake at Phase 2.2 for product framing |
| Engagement Swarm | signal-orchestrator, reddit-monitor, quora-monitor, ig-monitor, yt-monitor | PARTIAL | Reddit/Quora/IG ready. YouTube needs API key. LinkedIn sleeping. |

---

## RISK REGISTER

| Risk | Impact | Mitigation | Owner |
|------|--------|-----------|-------|
| No YouTube API key | Medium — lose YouTube signal data | Proceed with Reddit+Quora+IG. Add YouTube later. | You |
| RN/IBCLC reviewer hard to find | High — blocks Phase 3-4 pipeline | Start outreach in Phase 1. Budget $500-1500. | You |
| Lawyer hard to find | High — blocks Phase 3-4 pipeline | Start paralegal/legal template search early. Budget $300-500. | You |
| Revenue/Media/Product swarms not warmed up | Medium — ramp-up time when activated | Load skills and test with small tasks during Phase 1 | Hermes |
| Facebook bumper group access | Medium — founding mothers seeding requires group approval | Join groups now during Phase 1 listen mode | You |
| Content quality vs. voice consistency | High — sequential drafting is slow but necessary | Do not skip sequential constraint in Phase 2.4 | Hermes |
