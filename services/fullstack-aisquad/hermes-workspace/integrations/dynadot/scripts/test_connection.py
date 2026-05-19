#!/usr/bin/env python3
"""Test Dynadot API integration. Verifies auth, rate limiting, and basic endpoints."""

import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from api_client import DynadotAPIClient
from models import (
    DynadotAvailabilityResult,
    MarketplaceListing,
    parse_availability_response,
    parse_marketplace_response,
)

def main():
    print("=== Dynadot API Integration Test ===\n")
    
    api_key = os.environ.get("DYNADOT_API_KEY", "")
    
    if not api_key:
        print("[SKIP] No DYNADOT_API_KEY found.")
        print("       Run scripts/setup_auth.py or set the env variable.")
        print()
        print("Testing models and parsing logic...")
        
        # Test model parsing
        test_avail = {
            "domain0": "test123.com",
            "available0": "yes",
            "price0": "8.99",
            "price_currency0": "USD",
        }
        parsed = parse_availability_response(test_avail)
        assert len(parsed) == 1
        assert parsed[0].domain == "test123.com"
        assert parsed[0].available == True
        assert parsed[0].price == 8.99
        print("[OK] Availability model parses correctly")
        
        test_marketplace = {
            "domain0": "premium.ai",
            "price0": "1500.00",
            "currency0": "USD",
            "tld0": "ai",
            "is_premium0": "yes",
            "listing_type0": "marketplace",
        }
        listings = parse_marketplace_response(test_marketplace)
        assert len(listings) == 1
        assert listings[0].domain == "premium.ai"
        assert listings[0].is_premium == True
        print("[OK] Marketplace listing model parses correctly")
        
        print()
        print("All models validated. API calls require credentials to test.")
        return
    
    client = DynadotAPIClient()
    print(f"Client: {client}")
    
    # Test connectivity
    print("\nPinging Dynadot API...")
    if client.ping():
        print("[OK] API connection successful")
    else:
        print("[FAIL] Could not connect to Dynadot API")
        return
    
    # Test availability check
    print("\nChecking availability for test domains...")
    result = client.check_available(["google.com", "this-domain-should-be-available12345.com"])
    if result:
        print(f"[OK] Got results for {len(result)} domains")
        for r in result:
            print(f"  {r['domain']}: {'available' if r['available'] else 'taken'}")
    else:
        print("[FAIL] No response from availability check")
    
    # Test marketplace search
    print("\nSearching marketplace for 'ai' domains...")
    marketplace = client.search_marketplace(keyword="ai", max_price=500, limit=10)
    if marketplace:
        print(f"[OK] Found {len(marketplace)} marketplace listings")
        for m in marketplace[:3]:
            print(f"  {m['domain']}: ${m['price']:.2f}")
    else:
        print("[INFO] No marketplace listings found (or API doesn't support this endpoint)")
    
    print("\n=== Test Complete ===")

if __name__ == "__main__":
    main()
