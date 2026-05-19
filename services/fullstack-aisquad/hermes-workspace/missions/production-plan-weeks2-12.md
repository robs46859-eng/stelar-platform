# Production Plan: Weeks 2-12 (Drafting & Audio)

**Context**: Research brief, PRD, and Week 01 draft are complete. This plan covers the remaining 11 weeks (Week 02 through Week 12) for the 4th Trimester Operating Manual, including drafting each chapter, generating audio, reviewing, and final assembly.

**Assumptions**
- Medical source gathering (`researcher:quick`) can be done in parallel for all weeks prior to drafting.
- Each week's chapter follows the same structure: Body, Baby, Mental Health, Partner Playbook, Call Doctor?.
- Audio production uses the draft text as script; recording and editing estimated at 1 hour per week.
- Review steps include self-review and optional peer review (using `reviewer:gate` or `product-qa:verify`).
- Final PDF layout and audio assembly occur after all chapters are drafted and reviewed.
- Estimated effort is approximate and assumes focused work; actual time may vary.

---

## Phase A: Preparatory Tasks (Weeks 2-12)

| Task | Description | Estimated Effort | Dependencies |
|------|-------------|------------------|--------------|
| A1 | Run `researcher:quick` for weeks 2-12 (parallel) to gather medical sources (ACOG, AAP, Cochrane, etc.) | 0.5 hr (setup) + 2 hr parallel compute | None (research brief & PRD done) |
| A2 | Organize gathered sources into a reference library (e.g., `missions/refs/week02.md`, etc.) | 1 hr | A1 |
| A3 | Define chapter template & style guide (based on week01.md) | 0.5 hr | None |

---

## Phase B: Weekly Chapter Production (Repeat for weeks 02-12)

For each week **N** (02 ≤ N ≤ 12):

| Task | Description | Estimated Effort | Dependencies |
|------|-------------|------------------|--------------|
| B.N.1 | Draft chapter N using `content:write`, incorporating signal pull-quotes, decision trees, and structured sections | 2.5 hr | A2 (sources), A3 (template) |
| B.N.2 | Self‑review draft for clarity, tone, and completeness; adjust based on week01.md exemplar | 0.5 hr | B.N.1 |
| B.N.3 | Optional peer review (assign `reviewer:gate` or `product-qa:verify`) – can be batched | 0.5 hr | B.N.2 |
| B.N.4 | Generate audio script (extract narration text) and produce audio via `content:produce` (record & edit) | 1.0 hr | B.N.2 (final draft) |
| B.N.5 | QA audio: check volume, pacing, clarity; re‑record segments if needed | 0.25 hr | B.N.4 |
| B.N.6 | Mark week N as “Draft + Audio Complete” | – | B.N.3, B.N.5 |

**Total per week**: ~4.75 hrs (can be overlapped across weeks for different tasks).

---

## Phase C: Consolidation & Final Production (After all weeks)

| Task | Description | Estimated Effort | Dependencies |
|------|-------------|------------------|--------------|
| C1 | Compile all weekly drafts into a single manuscript PDF using `visual:design` + `ped:vision` (apply branding, layout, decision trees, registry list, partner playbook) | 3.0 hr | All B.N.2 (drafts complete) |
| C2 | Assemble final audio companion: concatenate week audio files, add intro/outro, normalize levels via `content:produce` | 1.5 hr | All B.N.5 (audio files ready) |
| C3 | Internal QA of PDF (spelling, layout, hyperlinks) via `product-qa:verify` | 1.0 hr | C1 |
| C4 | Internal QA of audio (consistent voice, no artifacts) via `qa:smoke` or `product-qa:verify` | 0.5 hr | C2 |
| C5 | Prepare disclaimer, refund policy, and legal review package (`compliance:review`) | 1.0 hr | C3, C4 |
| C6 | Medical review gates: RN/IBCLC manuscript review (external) – coordinate | 2.0 hr (coord) | C3 |
| C7 | Final PDF & audio package ready for Stan Store upload | – | C5, C6 |

---

## Phase D: Launch Preparation

| Task | Description | Estimated Effort | Dependencies |
|------|-------------|------------------|--------------|
| D1 | Configure Stan Store: billing, payout, upload PDF & audio bundle, set price ($29) | 1.0 hr | C7 |
| D2 | Write product description using signal language, create cover image | 1.0 hr | D1 |
| D3 | Set up refund policy & disclaimer in storefront | 0.5 hr | C5 |
| D4 | Perform end‑to‑end iPhone read test (download, navigate, audio play) | 0.5 hr | D2 |
| D5 | Launch announcement (social, email) – optional for Phase 5 | – | D4 |

---

## Summary Checklist (Markdown)

Copy the following into your task manager or note‑taking app:

```markdown
# Production Plan: Weeks 2-12

## Phase A: Preparatory Tasks
- [ ] A1: Run researcher:parallel for weeks 2-12 (medical sources)
- [ ] A2: Organize source library
- [ ] A3: Define chapter template & style guide

## Phase B: Weekly Production (Weeks 02-12)
### Week 02
- [ ] B.02.1: Draft chapter 02
- [ ] B.02.2: Self‑review draft
- [ ] B.02.3: Peer review (optional)
- [ ] B.02.4: Produce audio
- [ ] B.02.5: QA audio
- [ ] B.02.6: Mark week 02 complete
### Week 03
- [ ] B.03.1: Draft chapter 03
- [ ] B.03.2: Self‑review draft
- [ ] B.03.3: Peer review (optional)
- [ ] B.03.4: Produce audio
- [ ] B.03.5: QA audio
- [ ] B.03.6: Mark week 03 complete
### Week 04
- [ ] B.04.1: Draft chapter 04
- [ ] B.04.2: Self‑review draft
- [ ] B.04.3: Peer review (optional)
- [ ] B.04.4: Produce audio
- [ ] B.04.5: QA audio
- [ ] B.04.6: Mark week 04 complete
### Week 05
- [ ] B.05.1: Draft chapter 05
- [ ] B.05.2: Self‑review draft
- [ ] B.05.3: Peer review (optional)
- [ ] B.05.4: Produce audio
- [ ] B.05.5: QA audio
- [ ] B.05.6: Mark week 05 complete
### Week 06
- [ ] B.06.1: Draft chapter 06
- [ ] B.06.2: Self‑review draft
- [ ] B.06.3: Peer review (optional)
- [ ] B.06.4: Produce audio
- [ ] B.06.5: QA audio
- [ ] B.06.6: Mark week 06 complete
### Week 07
- [ ] B.07.1: Draft chapter 07
- [ ] B.07.2: Self‑review draft
- [ ] B.07.3: Peer review (optional)
- [ ] B.07.4: Produce audio
- [ ] B.07.5: QA audio
- [ ] B.07.6: Mark week 07 complete
### Week 08
- [ ] B.08.1: Draft chapter 08
- [ ] B.08.2: Self‑review draft
- [ ] B.08.3: Peer review (optional)
- [ ] B.08.4: Produce audio
- [ ] B.08.5: QA audio
- [ ] B.08.6: Mark week 08 complete
### Week 09
- [ ] B.09.1: Draft chapter 09
- [ ] B.09.2: Self‑review draft
- [ ] B.09.3: Peer review (optional)
- [ ] B.09.4: Produce audio
- [ ] B.09.5: QA audio
- [ ] B.09.6: Mark week 09 complete
### Week 10
- [ ] B.10.1: Draft chapter 10
- [ ] B.10.2: Self‑review draft
- [ ] B.10.3: Peer review (optional)
- [ ] B.10.4: Produce audio
- [ ] B.10.5: QA audio
- [ ] B.10.6: Mark week 10 complete
### Week 11
- [ ] B.11.1: Draft chapter 11
- [ ] B.11.2: Self‑review draft
- [ ] B.11.3: Peer review (optional)
- [ ] B.11.4: Produce audio
- [ ] B.11.5: QA audio
- [ ] B.11.6: Mark week 11 complete
### Week 12
- [ ] B.12.1: Draft chapter 12
- [ ] B.12.2: Self‑review draft
- [ ] B.12.3: Peer review (optional)
- [ ] B.12.4: Produce audio
- [ ] B.12.5: QA audio
- [ ] B.12.6: Mark week 12 complete

## Phase C: Consolidation & Final Production
- [ ] C1: Compile manuscript PDF
- [ ] C2: Assemble final audio companion
- [ ] C3: Internal QA of PDF
- [ ] C4: Internal QA of audio
- [ ] C5: Prepare disclaimer & legal review package
- [ ] C6: Medical review (RN/IBCLC)
- [ ] C7: Final PDF & audio package ready

## Phase D: Launch Preparation
- [ ] D1: Configure Stan Store (upload, price)
- [ ] D2: Write product description & create cover
- [ ] D3: Set up refund policy & disclaimer
- [ ] D4: End‑to‑end iPhone test
- [ ] D5: Launch announcement (optional)
```

---

## Estimated Total Effort (approx.)
- Phase A: ~4 hrs
- Phase B (11 weeks): ~52 hrs (4.75 hrs/week)
- Phase C: ~9 hrs
- Phase D: ~4 hrs
- **Grand Total**: ~69 hrs spread over 11 weeks (~6.3 hrs/week if working sequentially; can be reduced by parallelizing research, drafting, and audio across weeks).

---

**Next Step**: Begin with **A1** (`researcher:quick` for weeks 2-12) to gather sources, then proceed weekly drafting.
