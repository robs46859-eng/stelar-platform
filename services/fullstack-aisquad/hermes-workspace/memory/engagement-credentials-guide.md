# Platform Credentials Guide

How to get each platform agent its credentials and what to set.

## Reddit Monitor (no credentials needed)
Reddit uses RSS feeds which are free and public.
- No setup required works out of the box.
- RSS endpoint: `https://www.reddit.com/r/{subreddit}/new/.rss`
- Monitors: `r/BabyBumps`, `r/beyondthebump`, `r/breastfeeding`, `r/sleeptrain`

If you want to use the Reddit API (optional):
1. Go to https://www.reddit.com/prefs/apps
2. Click "Create App" (type: script)
3. Note the Client ID and Client Secret
4. Set env vars:
   ```
   REDDIT_CLIENT_ID=your_client_id
   REDDIT_CLIENT_SECRET=your_client_secret
   REDDIT_USER_AGENT=hermes-engagement-swarm
   ```

## YouTube Monitor (free tier available)
1. Go to https://console.cloud.google.com/
2. Create a new project (or use existing)
3. Enable the YouTube Data API v3
4. Create an API key (credentials > create credentials > API key)
5. Set the env var:
   ```
   YOUTUBE_API_KEY=your_key_here
   ```
- **Free tier** 10,000 units/day (enough for monitoring ~500 video lookups/day)
- RSS feeds work without the key for basic video detection

## LinkedIn Monitor (browser-based, no API)
LinkedIn does not officially support API-based monitoring of posts/comments.
- Uses browser tool to navigate
- Requires a LinkedIn account login
- **Recommended**: Create a burner LinkedIn account for this purpose
- Set env vars for browser session persistence:
   ```
   LINKEDIN_EMAIL=your_email@example.com
   LINKEDIN_PASSWORD=your_password
   ```
- **WARNING**: LinkedIn has strict anti-bot measures. The monitor uses slow, human-like browsing with delays. Do not exceed 5 page views per cycle.

## Quora Monitor (no credentials needed)
Quora provides RSS feeds for topics.
- No setup required; works out of the box.
- RSS endpoint: `https://www.quora.com/topic/{Topic}/rss`
- Monitors: Pregnancy, Breastfeeding, Baby Sleep, New Parents, Birth Planning

## Instagram Monitor (browser-based, highest risk)
Instagram does not provide a public API for comment monitoring.
- Uses browser tool to navigate Instagram
- Requires an Instagram account login
- **CRITICAL**: Instagram has VERY strict anti-bot measures
- **Strongly recommended**: Use a burner account you don't care about
- Set env vars:
   ```
   INSTAGRAM_USERNAME=your_instagram_username
   INSTAGRAM_PASSWORD=your_instagram_password
   ```
- Monitor only uses read operations (no posting, no liking, no following)
- If account gets flagged/rate-limited, pause for 24h minimum

## How to Set Credentials

Create a `.env` file in your workspace or add to your shell profile:

```bash
# ~/.bashrc or ~/.profile
export YOUTUBE_API_KEY="your_key_here"
export LINKEDIN_EMAIL="your_email@example.com"
export LINKEDIN_PASSWORD="your_password"
export REDDIT_CLIENT_ID="your_client_id"
export REDDIT_CLIENT_SECRET="your_client_secret"
export REDDIT_USER_AGENT="hermes-engagement-swarm"
export INSTAGRAM_USERNAME="your_instagram_username"
export INSTAGRAM_PASSWORD="your_instagram_password"
```

Then run:
```bash
source ~/.bashrc
# or
source ~/.profile
```

## Priority Order for Setup

1. **Reddit Monitor** - Start here first. FREE, no credentials, highest signal density for Prepared Paige ICP.
2. **Quora Monitor** - FREE, no credentials, high-intent questions.
3. **YouTube Monitor** - Low effort, 5-minute setup for API key. RSS feeds work without a key.
4. **LinkedIn Monitor** - Moderate effort, requires burner account setup.
5. **Instagram Monitor** - Most complex and risky, setup last. Use burner account only.

## Safety Notes

- NEVER share credentials in chat logs
- Use burner accounts for LinkedIn and Instagram monitoring
- Never use your personal social accounts for automated activities
- Rotate burner accounts every 3-6 months
- Monitor for rate-limiting signals and back off immediately
