---
name: domain-hunter-pipeline
description: Domain Hunter v2 scoring, discovery, and pipeline dispatch — connects domain_hunter.py to product and revenue swarms via JSON triggers.
category: devops
---

# Domain Hunter Pipeline

Domain Hunter v2 at `/home/azureuser/domain-hunter/domain_hunter.py` generates brandable domain names, checks availability via RDAP, scores them, and dispatches to swarms.

## Architecture

```
domain_hunter.py --json → latest.json → domain-hunter-pipeline.py → swarm dispatch
```

## Components

### 1. Domain Hunter (`~/domain-hunter/domain_hunter.py`)
Generates 3000+ candidates, checks RDAP availability, scores domains.

**Scoring factors (resale 0-100):**
- TLD quality: 15 pts
- Length: 14 pts  
- Clean (no hyphens): 7 pts
- No digits: 4 pts
- Dictionary word: 7 pts
- Has history: 5 pts
- Commercial keywords: 15 pts
- B2B signals: 10 pts
- Trend alignment: 15 pts
- Service readiness: 10 pts

**Scoring factors (service_readiness 0-80):**
- Commercial keywords: 20 pts
- Trend alignment: 15 pts
- Brandability: 15 pts
- Service TLD fit: 10 pts
- B2B indicators: 15 pts
- SaaS sound: 5 pts

**Verdicts:** product + flip (55+), flip only (35+), potential (20+), skip (<20)

**CLI flags:**
```
--json                    # JSON output only, no email
--output FILE            # Custom output path
--fresh                  # Ignore duplicate tracking
--max-domains N          # Override MAX_REPORT
--no-email               # Skip email sending
```

### 2. Pipeline Dispatcher (`~/hermes-workspace/scripts/domain-hunter-pipeline.py`)
Routes available domains from `latest.json` to swarm triggers.

**Routing rules:**
- verdict contains "product" AND score >= 55 → product swarm `domain_acquisition` trigger
- verdict contains "flip" AND score >= 35 → revenue swarm `domain_flip` trigger

**Deduplication:** Tracks dispatched domains in `~/hermes-workspace/memory/domain-hunter/dispatched.json`

**CLI flags:**
```
--json PATH              # Path to domain hunter JSON
--stdin                  # Read JSON from stdin
--dry-run                # Print payloads without sending
--workspace-url URL      # Override default (http://127.0.0.1:3000)
```

### 3. Trigger Templates
- `~/hermes-workspace/triggers/product/templates/domain-hunter-pipeline.json` → domain_acquisition
- `~/hermes-workspace/triggers/revenue/templates/domain-hunter-pipeline.json` → domain_flip

### 4. Swarm Integration
- **Product swarm:** domain_acquisition triggers → product-manager, brand-visionary, product-experience-director, product-engineer, content-writer, product-orchestrator
- **Revenue swarm:** domain_flip triggers → offer-architect, listing-manager, market-intel, sales-closer, revenue-orchestrator

## Usage

```bash
# Run daily domain scan with JSON output
python3 ~/domain-hunter/domain_hunter.py --json --max-domains 100

# Dispatch to swarms (dry run first)
python3 ~/hermes-workspace/scripts/domain-hunter-pipeline.py --dry-run

# Dispatch to swarms (live)
python3 ~/hermes-workspace/scripts/domain-hunter-pipeline.py
```

## Pitfalls

- RDAP endpoints have rate limits; use 10 workers max
- Expired domain scrapers (expireddomains.net, NameJet, etc.) are dead; proactive generation is the only reliable approach
- Domain hunter generates many candidates; pre-score filter (>=30) prevents overwhelming RDAP checks
- Duplicate tracking uses evaluated.tsv (23K+ entries after first run)
- Portfolio tracker at ~/hermes-workspace/memory/domain-hunter/portfolio.tsv for registered domains