# Dynadot API Integration

Python wrapper for the Dynadot API v2 — domain availability, pricing, marketplace listings, and suggestions.

## Setup

1. Create a free account at https://www.dynadot.com/
2. Generate API key at https://www.dynadot.com/account/settings.html
3. Copy config: `cp config.example.env .env`
4. Fill in your credentials in `.env`
5. Test: `python3 scripts/test_connection.py`

## Usage

```python
from api_client import DynadotAPIClient
from models import parse_availability_response, parse_marketplace_response

client = DynadotAPIClient()  # reads from env

# Domain availability (max 20 per request)
availability = client.check_available(["buildflow.com", "shipai.io"])

# Domain suggestions
suggestions = client.suggest_domains("buildflow", tlds=["com", "ai", "io"])

# Marketplace search
marketplace = client.search_marketplace(keyword="ai", max_price=500)

# TLD pricing
pricing = client.get_pricing(tlds=["com", "ai", "io"])
```

## Rate Limits
- Free tier: 100 requests/hour
- Client has built-in rate limiting with token bucket algorithm
- Batch domain checks (up to 20 per request) to minimize calls

## Integration with Domain Hunter
Use alongside domain_hunter.py for:
- Cross-reference RDAP availability with Dynadot marketplace pricing
- Find premium aftermarket domains matching your scoring criteria
- Use Dynadot suggestions as additional candidate generator
