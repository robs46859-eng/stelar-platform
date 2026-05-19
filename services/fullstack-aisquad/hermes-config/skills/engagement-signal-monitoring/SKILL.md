---
name: engagement-signal-monitoring
description: Monitor social platforms for buying signals from a target ICP, score signals, queue authentic engagement, and manage the compliance gate. Covers Reddit, YouTube, Quora, Instagram, LinkedIn.
category: social-media
---

# Engagement Signal Monitoring

Monitor social platforms for buying signals matching a target Ideal Customer Profile (ICP), score against a standardized matrix, and queue authentic, human-quality engagement responses.

## When to Use
- User wants to detect buying signals from a specific audience across social platforms
- Building a social listening then engagement then funnel pipeline
- Launching a B2C product where organic community engagement drives acquisition

## Core Architecture

```
[Platform Monitors] --- [Signal Orchestrator] --- [ICP Scorer] --- [Engagement Writer] --- [Compliance Gate] --- [Human Approval]
     Reddit              (dedup + routing)        (70+ threshold)   (platform-specific)   (hard block)          (publish)
     YouTube
     Quora
     Instagram
     LinkedIn
```

## Platform Technical Patterns

### Reddit (easiest, highest signal density)
RSS feeds work free with no credentials. Format: `https://www.reddit.com/r/{subreddit}/new/.rss`
Fetch 25 posts per subreddit per cycle. Parse XML entries for title, URL, author, selftext, timestamp.

### YouTube (requires API key)
YouTube Data API v3 with free tier of 10K units/day. Each video lookup costs ~100 units, comment thread costs ~1 unit.
Search: `https://www.googleapis.com/youtube/v3/search?part=snippet&q=QUERY&maxResults=25&key=API_KEY`
Comments: `https://www.googleapis.com/youtube/v3/commentThreads?part=snippet&videoId=ID&maxResults=50&key=API_KEY`

**Pitfall**: Scanning depth matters. Top 10 comments per YouTube video misses high-signal engagement in deeper threads. Expand to 50+ comments for videos with 1000+ comments.

### Quora (free via RSS)
Topic RSS: `https://www.quora.com/topic/{topic}/rss`. Questions are inherently high-intent and score higher as buying intent proxies.

### Instagram (high risk, view-only)
Use browser tools with burner account. Max 10 pages per cycle, 30+ min between cycles. Never automate actions from monitor account.

## Compliance Gate — HARD BLOCK
- Every health/nutritional/safety claim must have cited source
- Ban absolutes: will, guarantee, cure, proven
- Required disclaimer on any content touching health
- No medical advice — deflect to professional consultation
- Nothing goes live without PASS from compliance reviewer

## Scoring Reference
Full ICP scoring matrix saved at `references/icp-scoring-matrix.md`.

## Pitfalls
- Keyword matching competitor products requires context-aware checks — Hatch as verb vs product name
- Instagram scraping has extremely high ban risk, use detection-only mode
- YouTube API 10K unit/day limit requires smart fetching strategy — get comments before video details
- LinkedIn strict anti-bot, manual review queue preferred over automation
- Store platform credentials as `.credentials-*.json` with chmod 600, add to .gitignore
