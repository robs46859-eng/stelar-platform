---
name: reddit-monitor-core
description: Use for monitoring Reddit parenting communities — r/BabyBumps, r/beyondthebump, r/breastfeeding, r/sleeptrain for Prepared Paige buying signals.
---

# Reddit Monitor Core

## Role
Monitor Reddit subreddits for signals matching Prepared Paige ICP (pregnant/new mothers showing buying intent).

## Target Subreddits
- r/BabyBumps — pregnancy discussions (1st-timer goldmine)
- r/beyondthebump — postpartum (0-12mo, high signal density)
- r/breastfeeding — nursing concerns (immediate buying triggers)
- r/sleeptrain — sleep issues (high commercial intent)

## Buy Signal Patterns
- "First time mom..." / "FTM..." / "first pregnancy..."
- "Anyone else struggling with..." / "is this normal..."
- "My baby won't..." / "can't get my baby to..."
- "What did you pack..." / "registry help..." / "what to buy..."
- Competitor mentions: "Taking Cara Babies", "Hatch Rest", "Love to Dream", "DockATot", "SNOO"
- Breastfeeding: "pain", "latch", "supply", "clogged", "mastitis"
- Sleep: "sleep regression", "won't sleep", "night wakings", "naps"
- Postpartum: "ppd", "anxious", "overwhelmed", "not bonding"

## Procedure
1. Poll target subreddits via Reddit RSS: https://www.reddit.com/r/{subreddit}/new/.rss
2. Parse feed entries (title, URL, author, timestamp, selftext)
3. For each post/comment, run keyword matching against buy signal patterns
4. Score against ICP (see signal-orchestrator-core for scoring matrix)
5. Send signal to orchestrator: {platform: "reddit", url, content, author, score, matched_patterns}
6. Only flag signals scoring 40+ (watch-list threshold) to orchestrator

## Technical Notes
- Reddit RSS is free, no auth needed, updates every ~5 min
- Rate limit: be respectful, max 1 RSS fetch per subreddit per 5 minutes
- Comments require checking the post page or using Reddit's comment JSON endpoint
- Do NOT scrape aggressively; respect Reddit's ToS

## Data Format
Output to ~/hermes-workspace/memory/signal-engagement/raw-signals/reddit-{timestamp}.json
{
  "platform": "reddit",
  "subreddit": "BabyBumps",
  "type": "post | comment",
  "url": "...",
  "author": "...",
  "title": "...",
  "content": "...",
  "timestamp": "ISO",
  "matched_patterns": ["breastfeeding", "first_time"],
  "score": 72
}

## Checkpoint
Return STATE, SIGNALS_FOUND, SIGNALS_FLAGGED, SUBREDDITS_POLLED, BLOCKER, NEXT_ACTION.
