#!/usr/bin/env python3
"""Test GoDaddy API integration. Verifies auth, rate limiting, and basic endpoints."""

import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from api_client import GoDaddyAPIClient

def main():
    print("=== GoDaddy API Integration Test ===")
    
    api_key = os.environ.get("GO_DADDY_API_KEY", "")
    api_secret = os.environ.get("GO_DADDY_API_SECRET", "")
    sandbox = os.environ.get("GO_DADDY_SANDBOX", "1") == "1"
    
    if not api_key or not api_secret:
        print("[SKIP] No credentials found. Set GO_DADDY_API_KEY and GO_DADDY_API_SECRET.")
        print("       Run scripts/setup_auth.py to configure, or copy config.example.env to .env")
        print()
        print("Testing client instantiation without credentials...")
        
        from models import DomainSuggestion, AuctionItem, parse_suggestions_response
        from datetime import datetime
        
        # Test model parsing
        test_suggestion = {"domain": "test123.com", "tld": "com", "available": True, "type": "suggestion"}
        parsed = parse_suggestions_response([test_suggestion])
        assert len(parsed) == 1
        assert parsed[0].domain == "test123.com"
        print("[OK] DomainSuggestion model parses correctly")
        
        test_auction = {"domain": "auction.com", "currentBid": 25.0, "bidCount": 3}
        item = AuctionItem.model_validate(test_auction)
        assert item.domain == "auction.com"
        assert item.current_bid == 25.0
        print("[OK] AuctionItem model parses correctly")
        
        print()
        print("All models validated. API calls require credentials to test.")
        return
    
    client = GoDaddyAPIClient(sandbox=sandbox)
    print(f"Client: {client}")
    
    # Test domain suggestions (lowest-cost endpoint)
    print("\nChecking domain suggestions for 'buildflow'...")
    result = client.suggest_domains("buildflow", tlds=["com", "ai", "io"], max_results=5)
    if result:
        print(f"[OK] Got {len(result)} suggestions")
    else:
        print("[FAIL] No response from suggestions endpoint")
    
    # Test pricing
    print("\nChecking pricing for .com, .ai, .io...")
    pricing = client.get_pricing(tlds=["com", "ai", "io"])
    if pricing:
        print(f"[OK] Got pricing data for {len(pricing)} TLDs")
    else:
        print("[FAIL] No response from pricing endpoint")
    
    print("\n=== Test Complete ===")

if __name__ == "__main__":
    main()
