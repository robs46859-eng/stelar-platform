#!/usr/bin/env python3
"""
Marketplace Monitor — Combined GoDaddy + Dynadot auction/marketplace scanner.

Scans both platforms for domains matching your keywords and scoring criteria.
Outputs JSON for pipeline consumption (compatible with domain-hunter-pipeline.py).

Usage:
  python marketplace-monitor.py [--keywords KEY1,KEY2] [--max-price 500] [--output FILE] [--dry-run]
  # Reads keywords from env MARKETPLACE_KEYWORDS or defaults to trending tech keywords
"""

import os
import sys
import json
import argparse
from datetime import date

# Add integration paths
sys.path.insert(0, os.path.expanduser("~/hermes-workspace/integrations/godaddy"))
sys.path.insert(0, os.path.expanduser("~/hermes-workspace/integrations/dynadot"))

MEMORY_DIR = os.path.expanduser("~/hermes-workspace/memory/domain-hunter")

DEFAULT_KEYWORDS = [
    "build", "ship", "flow", "stack", "metric", "agent", "cloud",
    "deploy", "automate", "sync", "data", "ops", "metric", "hub",
    "ai", "ml", "data", "dev", "bot", "gen",
]

def load_seen_domains():
    """Load previously seen domains from evaluated.tsv."""
    seen = set()
    evaluated = os.path.join(MEMORY_DIR, "evaluated.tsv")
    if os.path.exists(evaluated):
        with open(evaluated) as f:
            for line in f:
                parts = line.strip().split("\t")
                if parts:
                    seen.add(parts[0].lower())
    return seen

def load_dispatched_domains():
    """Load already dispatched domains."""
    dispatched = os.path.join(MEMORY_DIR, "dispatched.json")
    if os.path.exists(dispatched):
        try:
            with open(dispatched) as f:
                data = json.load(f)
            if isinstance(data, list):
                return set(data)
            return set(data.get("domains", []))
        except (json.JSONDecodeError, IOError):
            pass
    return set()

def scan_godaddy_auctions(client, keywords, max_price, seen):
    """Scan GoDaddy auctions for matching domains."""
    results = []
    if client.api_key:
        for kw in keywords:
            auctions = client.search_auctions(
                keyword=kw,
                max_price=max_price,
                sort_by="endingSoon",
                limit=25,
            )
            if auctions and isinstance(auctions, dict):
                items = auctions.get("items", [])
                for item in items:
                    domain = item.get("domain", "").lower()
                    if domain and domain not in seen:
                        bid = item.get("currentBid", item.get("startingPrice", 0))
                        buy_now = item.get("buyNowPrice")
                        end_time = item.get("endTime", item.get("closeDate", ""))
                        results.append({
                            "domain": item.get("domain", ""),
                            "source": "godaddy-auction",
                            "type": "auction",
                            "current_bid": bid,
                            "buy_now": buy_now,
                            "bid_count": item.get("bidCount", 0),
                            "end_time": end_time,
                        })
                        seen.add(domain)
    return results

def scan_dynadot_marketplace(client, keywords, max_price, seen):
    """Scan Dynadot marketplace for matching domains."""
    results = []
    if client.api_key:
        for kw in keywords:
            listings = client.search_marketplace(
                keyword=kw,
                max_price=max_price,
                limit=50,
            )
            if listings:
                for item in listings:
                    domain = item.get("domain", "").lower()
                    if domain and domain not in seen:
                        results.append({
                            "domain": item.get("domain", ""),
                            "source": "dynadot-marketplace",
                            "type": "marketplace",
                            "price": item.get("price", 0),
                            "is_premium": item.get("is_premium", False),
                            "tld": item.get("tld", ""),
                        })
                        seen.add(domain)
    return results

import importlib.util

def _load_module(name, path):
    spec = importlib.util.spec_from_file_location(name, path)
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod

def main():
    parser = argparse.ArgumentParser(description="Marketplace Monitor — GoDaddy + Dynadot scanner")
    parser.add_argument("--keywords", help="Comma-separated keywords (default: trending tech)")
    parser.add_argument("--max-price", type=float, default=500, help="Max price filter")
    parser.add_argument("--output", help="Output JSON file path")
    parser.add_argument("--dry-run", action="store_true", help="Don't write files, just print results")
    args = parser.parse_args()

    keywords = args.keywords.split(",") if args.keywords else DEFAULT_KEYWORDS
    max_price = args.max_price
    seen = load_seen_domains() | load_dispatched_domains()

    print(f"Marketplace Monitor — Scanning {len(keywords)} keywords")
    print(f"Max price: ${max_price}")
    print(f"Known seen domains: {len(seen)}")
    print("=" * 60)

    # Load integrations dynamically
    HOME = os.path.expanduser("~")
    godaddy_mod = _load_module("godaddy", os.path.join(HOME, "hermes-workspace/integrations/godaddy/api_client.py"))
    dynadot_mod = _load_module("dynadot", os.path.join(HOME, "hermes-workspace/integrations/dynadot/api_client.py"))

    GoDaddyAPIClient = godaddy_mod.GoDaddyAPIClient
    DynadotAPIClient = dynadot_mod.DynadotAPIClient

    # GoDaddy scan
    gd_client = GoDaddyAPIClient()
    print(f"GoDaddy client: {gd_client}")
    gd_results = scan_godaddy_auctions(gd_client, keywords, max_price, seen)
    print(f"GoDaddy results: {len(gd_results)} new listings")

    # Dynadot scan
    dd_client = DynadotAPIClient()
    print(f"Dynadot client: {dd_client}")
    dd_results = scan_dynadot_marketplace(dd_client, keywords, max_price, seen)
    print(f"Dynadot results: {len(dd_results)} new listings")

    all_results = gd_results + dd_results

    output = {
        "date": date.today().isoformat(),
        "source": "marketplace-monitor",
        "total_new": len(all_results),
        "godaddy_new": len(gd_results),
        "dynadot_new": len(dd_results),
        "results": all_results,
    }

    if all_results:
        print("\nNew discoveries:")
        for r in all_results:
            price = r.get("price") or r.get("current_bid") or r.get("buy_now") or "?"
            source = r.get("source", "")
            print(f"  [{source}] {r['domain']} — ${price}")
    else:
        print("\nNo new marketplace listings found.")

    if not args.dry_run:
        output_path = args.output or os.path.join(MEMORY_DIR, "marketplace-latest.json")
        os.makedirs(os.path.dirname(output_path), exist_ok=True)
        with open(output_path, "w") as f:
            json.dump(output, f, indent=2)
        print(f"\nResults saved to: {output_path}")

    return output

if __name__ == "__main__":
    main()
