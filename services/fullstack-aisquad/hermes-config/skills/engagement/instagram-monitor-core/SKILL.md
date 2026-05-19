---
name: instagram-monitor-core
description: Use for monitoring Instagram Reels, carousels, and Stories in pregnancy/parenting niche — Prepared Paige's PRIMARY platform for buying signals.
---

# Instagram Monitor Core

## Role
Monitor Instagram for Prepared Paige signals — this is her PRIMARY platform with highest signal density and commercial intent.

## Why Instagram Matters Most
- Saves > likes (saving = intent to act later)
- Reels and carousels are primary content format
- Hashtag-based discovery enables targeted monitoring
- High concentration of pregnancy/parenting creator community

## Target Hashtags
- #firsttimemom #firstpregnancy #pregnant2025 #postpartumjourney
- #breastfeedingjourney #nursingmom #sleepdeprivedmom
- #birthplan #hospitalbag #pregnancyprep
- #momlife #newmomstruggles
- Competitor adjacent: #takingcarababies #hatchrest #snoobaby

## Signal Patterns
- Comments on pregnancy/baby Reels expressing need/confusion
- Stories mentioning struggles (hardest to capture)
- Carousel saves (proxy: comment "saving this" or "needed this")
- Questions in comments: "What did you use?", "How did you..."
- Competitor product comments: "Does the Hatch actually work?"

## Procedure
1. Monitor via browser-based hashtag page checks (rate-limited)
2. Focus on RECENT posts (last 24h) on target hashtags
3. Read top comments for signal patterns
4. Score against ICP
5. Flag 40+ to orchestrator
6. This is the trickiest monitor — high value but highest ban risk

## Critical Safety Rules
- Max 10 page views per cycle, then wait 30+ min
- Login session cookies required — use browser tool with saved session
- NEVER automate likes, follows, or comments from this monitor
- This monitor is DETECTION-ONLY — Engagement Writer handles responses
- If account gets flagged/rate-limited, pause for 24h minimum
- Consider using a burner account for monitoring

## Alternative: Manual Review Queue
Because of Instagram's anti-bot measures, this worker may primarily generate a REVIEW QUEUE:
- Collect top posts/comments by hashtag
- Save to ~/hermes-workspace/memory/signal-engagement/review-queue/instagram-{timestamp}.json
- Human reviewer approves signals before Engagement Writer processes

## Data Format
Output to ~/hermes-workspace/memory/signal-engagement/raw-signals/instagram-{timestamp}.json


## Checkpoint
Return STATE, POSTS_CHECKED, SIGNALS_FLAGGED, REVIEW_QUEUE_SIZE, RATE_LIMITED, BLOCKER, NEXT_ACTION.
