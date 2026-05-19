# Engagement Agent Swarm Architecture

## Vision
A team of specialized platform monitors (Reddit, YouTube, LinkedIn, Quora, Instagram) that feed into a Central Orchestrator. They detect **buying signals** from Prepared Paige ICP, score prospects, and enable **authentic, helpful engagement** — no AI slop, no sales pitches, no fake engagement bait.

## Core Principles
- **No fake engagement** — Real comments, real value
- **No "buy my SaaS"** — Lead with helpfulness, not pitches
- **No AI slop** — Comments must pass human sniff test
- **Speed + relevance** — Respond to signals within 15 minutes
- **Score against ICP** — Only engage when signals match Prepared Paige profile

## Architecture

```
[Reddit Monitor]──┐
[YouTube Monitor]─┤
[LinkedIn Monitor]┼──▶ [Central Orchestrator] ──▶ [Engagement Writer]
[Quora Monitor]───┤                                    │
[Instagram Monitor┘                                    │
                                                [ICP Scorer]
                                                [Signal Queue]
                                                [Response Scheduler]
```

## Agent Roster (Planned)

### 1. Signal Orchestrator (`signal-orchestrator`)
- **Role**: Central coordinator, queues, deduplication, priority routing
- **Model**: Premium (claude-opus or equivalent)
- **Tools**: file, terminal, todo, session_search, skills, cronjob
- **Skills**: orchestrator-core, kanban-orchestrator
- **Wrapper**: `signal:orchestrate`
- **Modes**: orchestration, scoring, routing
- **Capabilities**: signal-dedupulation, ICP-scoring, priority-queue, engagement-timing
- **Profile**: signal-orchestrator
- **Greenlight**: external-post, direct-message

### 2. Reddit Monitor (`reddit-monitor`)
- **Role**: Monitor r/BabyBumps, r/beyondthebump, r/breastfeeding, r/sleeptrain
- **Model**: Premium (claude-sonnet-4 or equivalent)
- **Tools**: browser, web, file, terminal, session_search, skills
- **Skills**: reddit-monitor-core, icp-prepared-paige
- **Wrapper**: `reddit:monitor`
- **Capabilities**: subreddit-polling, keyword-tracking, thread-analysis, sentiment-scoring
- **Profile**: reddit-monitor
- **Buy Signals**:
  - "First time mom..."
  - "Anyone else struggling with..."
  - "My baby won't..."
  - "What did you pack..."
  - "Is this normal..."
  - Competitor mentions (Taking Cara Babies, Hatch Rest, Love to Dream)
  - Breastfeeding pain/supply issues
  - Sleep deprivation posts

### 3. YouTube Monitor (`youtube-monitor`)
- **Role**: Monitor pregnancy/parenting channels, birth vlogs, product reviews
- **Model**: Premium
- **Tools**: browser, web, file, terminal, skills
- **Skills**: youtube-monitor-core, icp-prepared-paige
- **Wrapper**: `yt:monitor`
- **Capabilities**: comment-scraping, channel-tracking, transcript-analysis
- **Profile**: youtube-monitor
- **Buy Signals**: Comments on birth prep videos, product reviews, "how to" tutorials

### 4. LinkedIn Monitor (`linkedin-monitor`)
- **Role**: Monitor career transitions, funding announcements, competitor employee changes
- **Model**: Premium
- **Tools**: browser, web, file, skills
- **Skills**: linkedin-monitor-core, icp-prepared-paige
- **Wrapper**: `linkedin:monitor`
- **Capabilities**: profile-tracking, post-monitoring, company-update-analysis
- **Profile**: linkedin-monitor
- **Buy Signals**:
  - "Excited to announce my new role at..." (competitors)
  - "Going on maternity leave..."
  - Startup funding in pregnancy/baby space
  - People posting about work-life balance with newborns

### 5. Quora Monitor (`quora-monitor`)
- **Role**: Monitor parenting questions, birth prep queries, breastfeeding advice
- **Model**: Premium
- **Tools**: browser, web, file, terminal, skills
- **Skills**: quora-monitor-core, icp-prepared-paige
- **Wrapper**: `quora:monitor`
- **Capabilities**: question-tracking, answer-scoring, topic-monitoring
- **Profile**: quora-monitor
- **Buy Signals**: Direct questions matching ICP jobs-to-be-done

### 6. Engagement Writer (`engagement-writer`)
- **Role**: Write authentic, context-aware comments/responses
- **Model**: Premium (highest priority for quality)
- **Tools**: file, terminal, session_search, skills, web
- **Skills**: engagement-writer-core, humanizer, icp-prepared-paige
- **Wrapper**: `engage:write`
- **Capabilities**: comment-generation, humanization, context-synthesis
- **Profile**: engagement-writer
- **Greenlight**: post-comment, direct-message

## Signal Scoring Matrix

| Signal | Weight | Example |
|---|---|---|
| Matches ICP demographics | 20 | Age 29–36, mentions pregnancy/postpartum |
| Explicit buying intent | 25 | "What do you all recommend for...", "Should I buy..." |
| Frustration expression | 15 | "My baby hasn't slept in...", "I'm so overwhelmed..." |
| Competitor engagement | 10 | Mentions Taking Cara Babies, Hatch, etc. |
| Community trust | 15 | Regular poster, high-quality history |
| Timing match | 15 | Posting 9pm–1am (impulse window) |
| Mobile indicators | 5 | Short posts, on-the-go language |
| **Total threshold** | **70+** | Triggers Engagement Writer |

## Engagement Rules

### DO
- Lead with specific, actionable advice
- Reference personal experience when appropriate
- Acknowledge their specific situation
- Keep it conversational (7 sentences max on mobile)
- Ask a follow-up question
- Mention you've been through it too (if true)

### DON'T
- Pitch products directly
- Use AI-sounding language ("I understand that...", "It's completely normal that...")
- Be condescending or overly clinical
- Copy/paste generic responses
- Engage in medical advice (deflect to "check with your OB/midwife")
- Comment inappropriately (read the room)
- Over-engage (max 1 response per user per 48h)

## Response Templates (NOT copy-paste, starting points)

### Breastfeeding struggle:
"Yeah, we went through this with our first. [Name]'s IBCLC had us try [specific technique] and it clicked after about 3 days. Also this video was clutch — saved my sanity. Hang in there, you're not alone in this."

### Sleep regression:
"Ugh, the 4-month sleep regression. We survived. What helped most: [1 specific tip]. Also don't compare yourself to the Instagram moms — literally every baby does this phase. It does end."

### Registry overwhelm:
"Don't even think about the ones with 47 items. We ended up barely using half of what people recommended. Here's what we ACTUALLY used every single day: [3-4 things]. Save your money for the stuff you'll actually need postpartum."

## Technical Implementation

### Data Storage
- `~/fullstack-aisquad/memory/signal-engagement/signals.db` — SQLite for deduplication, scoring, tracking
- `~/fullstack-aisquad/memory/signal-engagement/engagement_log.json` — Audit trail of what was posted, when, where
- `~/fullstack-aisquad/memory/signal-engagement/prospect_queue.json` — Pending engagements to schedule

### Polling Cadence
- Reddit: Every 5 minutes (API or browser-based)
- YouTube: Every 15 minutes (RSS feeds + comment section)
- LinkedIn: Every 30 minutes (rate-limited)
- Quora: Every 10 minutes (RSS or browser)
- Instagram: TBD (hardest, may need manual review queue)

### Cron Jobs
- `monitor-all` — Run all monitors (every 10m for Reddit, 30m for others)
- `process-signals` — Scorer + ICP matching (every 5m)
- `scheduled-engagement` — Send queued comments at optimal times (9pm–1am, staggered)

### Platform Limitations
- Reddit: API rate limits on free tier; browser scraping is fallback
- YouTube: Comment API requires OAuth; RSS feeds for video detection
- LinkedIn: Strict anti-bot measures; manual review queue preferred
- Quora: RSS feeds available; comment API limited
- Instagram: Hardest to automate; high risk of rate limiting/bans


### 8. Compliance Reviewer (`compliance-reviewer`)
- **Role**: Hard health/medical compliance gate for ALL external-facing content
- **Model**: Premium (claude-sonnet-4 or equivalent, needs strong reasoning)
- **Tools**: file, browser, web, terminal, session_search, skills
- **Skills**: compliance-reviewer-core, icp-prepared-paige
- **Wrapper**: `compliance:review`
- **Modes**: audit, block
- **Greenlight**: override-block, legal-review
- **Capabilities**: evidence-verification, claim-auditing, disclaimer-enforcement, legal-compliance
- **Buy Signal Impact**: Before Engagement Writer's output goes to any platform (Reddit, YouTube, Quora, Instagram), Compliance Reviewer audits for medical/nutritional/safety claims, banned absolutes ("will", "guarantee", "cure"), and disclaimer presence

### 9. Funnel Manager (`funnel-manager`)
- **Role**: Email funnel and nurture sequence architect (B2C replacement for Sales Closer)
- **Model**: Premium (claude-sonnet-4)
- **Tools**: file, web, browser, terminal, session_search, skills, todo
- **Skills**: funnel-manager-core, icp-prepared-paige, humanizer
- **Wrapper**: `funnel:nurture`
- **Modes**: nurture, flow
- **Greenlight**: email-send, list-upload, automation-change, public-claim
- **Capabilities**: email-flow-design, nurture-sequence, list-growth, conversion-optimization, revenue-tracking
- **Buy Signal Impact**: When Engagement Writer's response drives traffic back, Funnel Manager captures the lead, nurtures through welcome sequence, weekly broadcasts, abandoned-cart recovery, and post-purchase flows

### 10. Partnership Scout (`partnership-scout`)
- **Role**: Influencer/expert partner finder and outreach drafter
- **Model**: Premium (claude-sonnet-4)
- **Tools**: web, browser, file, session_search, skills, todo
- **Skills**: partnership-scout-core, icp-prepared-paige, humanizer
- **Wrapper**: `partner:scout`
- **Modes**: outreach, manage
- **Greenlight**: external-send, affiliate-link-create, payout-approve, public-announcement
- **Capabilities**: partner-research, outreach-drafting, affiliate-management, relationship-nurturing, payout-tracking
- **Buy Signal Impact**: Identifies IBCLCs, doulas, micro-influencers who can co-promote to Prepared Paige audience, creating organic reach beyond direct engagement

## Implementation Order

1. **Signal Orchestrator** base (skill, profile, wrapper, queues)
2. **Reddit Monitor** (most signal-rich platform, easiest to automate)
3. **Engagement Writer** (quality control, humanization)
4. **YouTube Monitor** (RSS-based, lower risk)
5. **Quora Monitor** (RSS-based)
6. **LinkedIn Monitor** (manual review queue)
7. **Instagram Monitor** (last, highest complexity)
