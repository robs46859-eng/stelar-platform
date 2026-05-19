# GoDaddy API Integration

Python wrapper for the GoDaddy Developer API — domain availability, pricing, auctions, and suggestions.

## Setup

1. Create a developer account at https://developer.godaddy.com/
2. Generate API key + secret (sandbox for testing, production for live)
3. Copy config: `cp config.example.env .env`
4. Fill in your credentials in `.env`
5. Test: `python3 scripts/test_connection.py`

## Usage

```python
from api_client import GoDaddyAPIClient
from models import parse_auctions_response, parse_suggestions_response

client = GoDaddyAPIClient()  # reads from env

# Domain suggestions
suggestions = client.suggest_domains("buildflow", tlds=["com", "ai", "io"])

# Availability check
availability = client.check_available(["buildflow.com", "shipai.io"])

# Pricing
pricing = client.get_pricing(tlds=["com", "ai", "io"])

# Auctions
auctions = client.search_auctions(keyword="ai", max_price=500)
closing = client.list_closing_auctions(hours_left=24)
```

## Rate Limits
- Production: 150 requests/minute
- Sandbox: unlimited (test environment)
- Client has built-in rate limiting with exponential backoff

## Integration with Domain Hunter
The GoDaddy client can be used alongside domain_hunter.py for:
- Cross-reference RDAP availability with GoDaddy pricing
- Monitor auctions for brandable names matching your scoring criteria
- Use GoDaddy suggestions as additional candidate generator
