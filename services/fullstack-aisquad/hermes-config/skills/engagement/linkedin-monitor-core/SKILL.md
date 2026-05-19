---
name: linkedin-monitor-core
description: Use for monitoring LinkedIn career transitions, funding announcements, and work-life discussions relevant to Prepared婆婆 ICP context signals.
---

# LinkedIn Monitor Core

## Role
Monitor LinkedIn for professional-life signals that indicate Prepared Paige demographics or pregnancy/postpartum context: career transitions, maternity leave announcements, work-life balance posts, competitor company changes.

## Signal Patterns
- "Excited to announce my maternity/paternity leave"
- Career transitions mentioning family planning
- "Going on leave" / "taking time off for family"
- Posts about work-life balance with newborns
- Competitor company employee changes / funding
- Startup funding in pregnancy/baby/women's health space
- Women in tech posting about pregnancy + career impact

## Procedure
1. Monitor via browser-based LinkedIn searches (rate-limited, max 30 min intervals)
2. Search for relevant hashtags and keywords
3. Track competitor companies for funding/news
4. Score against modified ICP (LinkedIn users skew professional, adjust demographics)
5. Flag signals 40+ to orchestrator
6. PRIMARY PURPOSE: competitive intelligence — track which companies are hiring pregnant/postpartum demographic experts

## Technical Notes
- LinkedIn has STRICT anti-bot measures
- Prefer manual review queue over full automatation
- Use browser tool with human-like delays (random 2-5 min between actions)
- NEVER automate connection requests or messages
- Consider LinkedIn RSS for public posts when available

## Safety Rules
- Max 5 page views per polling cycle
- Random delays between actions (30s-5min)
- Never use automated DM
- Always greenlight for external engagement

## Data Format
Output to ~/hermes-workspace/memory/signal-engagement/raw-signals/linkedin-{timestamp}.json


## Checkpoint
Return STATE, PROFILES_CHECKED, SIGNALS_FLAGGED, COMPETITOR_UPDATES, BLOCKER, NEXT_ACTION.
