---
name: web-integration-engineer
description: Build web service integrations (APIs, OAuth, scraping, SDKs, webhooks) into Hermes workspace. Saves reusable artifacts for future builds.
category: devops
---

# Web Integration Engineer

When a platform needs integration into the Hermes workspace (APIs, OAuth flows, web scraping, SDKs, webhooks), this worker handles it.

## Procedure

### 1. Platform Research
- Find official API docs, rate limits, auth methods (OAuth, API key, session)
- Check if Python SDK exists (pip install)
- Identify free tiers vs paid requirements
- Note anti-bot measures and scraping policies

### 2. Integration Types

**A. Official API Integration** (preferred)
- API key or OAuth setup
- Python wrapper or raw requests
- Rate limit handling with exponential backoff
- Store credentials in .env files

**B. RSS/Feed Integration** (lightweight)
- Many platforms expose RSS (YouTube channels, Quora topics, blogs)
- feedparser for parsing
- Cron-based polling

**C. Browser Scraping** (fallback)
- Playwright/undetected-chromedriver for JS-rendered content
- Cookie/session management
- User-Agent rotation
- Respectful scraping (delays, no overloading)

### 3. Artifact Structure

For each integration created:
```
~/hermes-workspace/integrations/<platform>/
├── api_client.py          # API client wrapper with rate limiting
├── config.example.env      # Required env vars
├── models.py              # Data models (Pydantic)
├── README.md              # Setup + usage docs
└── scripts/
    ├── setup_auth.py      # Auth setup script
    └── test_connection.py # Verify integration works
```

### 4. Quality Gates
- [ ] Auth works (API key or OAuth)
- [ ] Rate limit handling present
- [ ] Error handling for common HTTP errors (429, 401, 403, 500)
- [ ] Data validated with Pydantic models
- [ ] Test script passes (at minimum skips gracefully without creds)
- [ ] README with setup instructions
- [ ] Credentials documented in config.example.env
- [ ] No hardcoded secrets
- [ ] Integration reusable as import

## Existing Integrations

### GoDaddy (`~/hermes-workspace/integrations/godaddy/`)
- Domain availability, pricing, auctions, suggestions
- Rate limit: 150 req/min
- Auth: API key + secret (sso-key header)
- Test: `python3 scripts/test_connection.py`

### Dynadot (`~/hermes-workspace/integrations/dynadot/`)
- Domain availability, marketplace, pricing, suggestions
- Rate limit: 100 req/hour (free tier)
- Auth: API key (query param)
- Test: `python3 scripts/test_connection.py`

### Marketplace Monitor (`~/hermes-workspace/scripts/marketplace-monitor.py`)
- Combined scanner for both platforms
- Outputs JSON compatible with domain-hunter-pipeline.py
- Deduplicates against evaluated.tsv and dispatched.json
- Usage: `python3 marketplace-monitor.py --dry-run`

## Platform Pitfalls

- **LinkedIn**: Extremely strict anti-bot; prefer OAuth over scraping; account bans common
- **Instagram**: GraphQL API changes frequently; mobile-only endpoints; high ban risk
- **Reddit**: Free API has strict limits; use pushshift API for historical data
- **YouTube Data API v3**: 10,000 units/day free tier; use RSS feeds for monitoring
- **Twitter/X**: API access now requires paid tier; free tier severely limited
- **Quora**: No official API; RSS feeds for topic monitoring
- **GoDaddy**: 150 req/min; sandbox environment available for testing
