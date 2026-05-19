---
name: youtube-monitor-core
description: Use for monitoring YouTube pregnancy/parenting content — video detection, comment analysis, competitor channel tracking for Prepared Paige signals.
---

# YouTube Monitor Core

## Role
Monitor YouTube pregnancy/parenting ecosystem: video detection via RSS, comment monitoring for buying signals from Prepared Paige audience.

## Target Channels (via RSS)
Use channel RSS feeds: https://www.youtube.com/feeds/videos.xml?channel_id={CHANNEL_ID}

Priority channels:
- Birth/parenting vloggers
- Pediatricians/midwives with YouTube channels  
- Product reviewers (baby gear, nursing products)
- Competitors with YouTube presence

## Buy Signal Patterns in Comments
- "I'm [XX weeks] pregnant and wondering..."
- "My baby is [N months] and I need help with..."
- "Anyone else having trouble with..."
- "What product did you use for..."
- "Do you recommend..."
- "I just bought [product] and..."
- Competitor mentions: "We use the Hatch", "TCCB sleep training", etc.

## Procedure
1. Poll channel RSS feeds every 15 minutes
2. For new videos, check top-level comments (use YouTube Data API v3 or page scrape)
3. Score comments against ICP signal matrix
4. Flag signals scoring 40+ to orchestrator
5. Track which topics/channels generate most signals

## Technical Notes
- RSS feeds are free, no auth, detect new videos instantly
- Comments require YouTube Data API v3 (free tier: 10K units/day) or browser scrape
- RSS approach is lower risk; comments are supplemental
- Store watched video IDs to avoid re-scanning

## Data Format
Output to ~/hermes-workspace/memory/signal-engagement/raw-signals/youtube-{timestamp}.json


## Checkpoint
Return STATE, VIDEOS_FOUND, COMMENTS_SCANNED, SIGNALS_FLAGGED, BLOCKER, NEXT_ACTION.
