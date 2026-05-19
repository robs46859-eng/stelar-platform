#!/usr/bin/env python3
"""
Domain Hunter Pipeline Dispatcher

Reads JSON output from domain_hunter.py's latest.json, routes scored domains
to the appropriate swarm triggers:
  - product swarm → domain_acquisition trigger (verdict contains "product", score >= 55)
  - revenue swarm → domain_flip trigger (verdict contains "flip", score >= 35)

Deduplicates against dispatched.json to avoid re-dispatching the same domain.

Usage:
  python domain-hunter-pipeline.py [--dry-run] [--json /path/to/latest.json]
  cat latest.json | python domain-hunter-pipeline.py --stdin [--dry-run]
"""

import os
import sys
import json
import argparse
import hashlib
from datetime import datetime, date

try:
    import requests
    HAS_REQUESTS = True
except ImportError:
    HAS_REQUESTS = False

# ── Paths ─────────────────────────────────────────────────────────────────────
WORKSPACE = os.path.join(os.path.expanduser("~"), "hermes-workspace")
MEMORY_DIR = os.path.join(WORKSPACE, "memory", "domain-hunter")
LATEST_JSON = os.path.join(MEMORY_DIR, "latest.json")
DISPATCHED_JSON = os.path.join(MEMORY_DIR, "dispatched.json")
PRODUCT_TEMPLATE = os.path.join(
    WORKSPACE, "triggers", "product", "templates", "domain-hunter-pipeline.json"
)
REVENUE_TEMPLATE = os.path.join(
    WORKSPACE, "triggers", "revenue", "templates", "domain-hunter-pipeline.json"
)

WORKSPACE_URL = os.getenv("WORKSPACE_URL", "http://127.0.0.1:3000")

# ── Verdict Routing Thresholds ────────────────────────────────────────────────
PRODUCT_SCORE_THRESHOLD = 55
REVENUE_SCORE_THRESHOLD = 35


def load_dispatched_history():
    """Load set of already-dispatched domain hashes."""
    if os.path.exists(DISPATCHED_JSON):
        try:
            with open(DISPATCHED_JSON, "r") as f:
                data = json.load(f)
            if isinstance(data, list):
                return set(data)
            if isinstance(data, dict) and "domains" in data:
                return set(data["domains"])
            return set()
        except (json.JSONDecodeError, IOError):
            return set()
    return set()


def save_dispatched_domain(dispatched_set, domain, verdicts, timestamp=None):
    """Append a successfully dispatched domain to the dedup log."""
    dispatched_set.add(domain)
    ts = timestamp or datetime.now().isoformat()
    record = {
        "domains": list(dispatched_set),
        "last_dispatched": {
            "domain": domain,
            "verdicts": verdicts,
            "at": ts,
        }
    }
    try:
        with open(DISPATCHED_JSON, "w") as f:
            json.dump(record, f, indent=2)
    except IOError as e:
        print(f"  [WARN] Could not update dispatched.json: {e}")


def domain_hash(domain):
    """Unique key for deduplication."""
    return hashlib.sha256(domain.lower().strip().encode()).hexdigest()[:16]


def load_json_source(json_path=None, read_stdin=False):
    """Load JSON from file or stdin."""
    if read_stdin:
        return json.loads(sys.stdin.read())
    if json_path and os.path.exists(json_path):
        with open(json_path, "r") as f:
            return json.load(f)
    if os.path.exists(LATEST_JSON):
        with open(LATEST_JSON, "r") as f:
            return json.load(f)
    return None


def parse_results(data):
    """Extract domain results from the domain_hunter.py JSON schema.
    
    Expected schema:
      { "date": "...", "total_domains": N, "available": N,
        "results": [ { "domain": "...", "availability": "...", "score": N,
                       "service_score": N, "verdict": "...", ... } ] }
    """
    if isinstance(data, list):
        return data
    if isinstance(data, dict):
        if "results" in data:
            return data["results"]
        if "domains" in data:
            return data["domains"]
    return []


def should_dispatch_product(domain, score, verdict):
    """Domain goes to product swarm if verdict contains 'product' and score >= threshold."""
    verdict_lower = verdict.lower()
    return "product" in verdict_lower and score >= PRODUCT_SCORE_THRESHOLD


def should_dispatch_revenue(domain, score, verdict):
    """Domain goes to revenue swarm if verdict contains 'flip' and score >= threshold."""
    verdict_lower = verdict.lower()
    return "flip" in verdict_lower and score >= REVENUE_SCORE_THRESHOLD


def build_product_payload(domain, score, service_score, verdict, extra):
    """Build domain_acquisition trigger payload for product swarm."""
    tld = domain.rsplit(".", 1)[-1] if "." in domain else ""
    return {
        "type": "domain_acquisition",
        "source": "domain-hunter-pipeline",
        "feature": {
            "domain": domain,
            "score": score,
            "service_score": service_score,
            "tld": tld,
            "length": len(domain.split(".")[0]),
            "is_dictionary": extra.get("is_dictionary", False),
            "has_history": extra.get("wayback_history", False),
            "estimated_value": extra.get("price", ""),
            "target_vertical": extra.get("factors", {}).get("trend_fit", ""),
            "prospective_clients": extra.get("factors", {}).get("buyer_targets", []),
            "business_ideas": extra.get("factors", {}).get("use_cases", []),
            "verdict": verdict,
            "registrar": extra.get("registrar", ""),
        },
        "stakeholders": {},
        "notes": f"Discovered by domain hunter ({date.today().isoformat()}). Verdict: {verdict}. Score: {score}/100.",
    }


def build_revenue_payload(domain, score, service_score, verdict, extra):
    """Build domain_flip trigger payload for revenue swarm."""
    tld = domain.rsplit(".", 1)[-1] if "." in domain else ""
    return {
        "type": "domain_flip",
        "source": "domain-hunter-pipeline",
        "offer": {
            "domain": domain,
            "tld": tld,
            "score": score,
            "service_score": service_score,
            "estimated_value": extra.get("price", ""),
            "acquisition_cost": extra.get("price", ""),
            "target_buyer_profile": extra.get("factors", {}).get("buyer_profile", "domain investor / startup"),
            "vertical": extra.get("factors", {}).get("trend_fit", ""),
            "listing_channels": [
                "Sedo",
                "Afternic",
                "Dan.com",
                "Namecheap Marketplace"
            ],
            "brand_materials_path": "",
            "verdict": verdict,
            "registrar": extra.get("registrar", ""),
        },
        "lead": {},
        "notes": f"Discovered by domain hunter ({date.today().isoformat()}). Verdict: {verdict}. Score: {score}/100.",
    }


def dispatch_to_swarm(url, swarm_name, trigger_type, payload, dry_run=False):
    """POST a dispatch payload to the swarm's /api/swarm-dispatch endpoint."""
    dispatch_payload = {
        "trigger": trigger_type,
        "payload": payload,
    }

    if dry_run:
        return {"dry_run": True, "swarm": swarm_name, "payload": dispatch_payload}

    if not HAS_REQUESTS:
        # Fallback: use urllib
        import urllib.request
        import urllib.error
        try:
            req = urllib.request.Request(
                f"{url}/api/swarm-dispatch",
                data=json.dumps(dispatch_payload).encode("utf-8"),
                headers={"Content-Type": "application/json"},
                method="POST",
            )
            with urllib.request.urlopen(req, timeout=30) as resp:
                return {"status": resp.status, "response": resp.read().decode()[:500]}
        except urllib.error.HTTPError as e:
            return {"error": f"HTTP {e.code}: {e.reason}", "body": e.read().decode()[:500]}
        except Exception as e:
            return {"error": str(e)}

    try:
        r = requests.post(
            f"{url}/api/swarm-dispatch",
            json=dispatch_payload,
            headers={"Content-Type": "application/json"},
            timeout=30,
        )
        return {"status": r.status_code, "response": r.text[:500]}
    except Exception as e:
        return {"error": str(e)}


def main():
    parser = argparse.ArgumentParser(
        description="Dispatch domain hunter results to product and revenue swarms"
    )
    parser.add_argument(
        "--json",
        help="Path to domain hunter JSON output (default: memory/domain-hunter/latest.json)",
    )
    parser.add_argument(
        "--stdin",
        action="store_true",
        help="Read JSON from stdin",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Print dispatch payloads without sending",
    )
    parser.add_argument(
        "--workspace-url",
        default=WORKSPACE_URL,
        help="Workspace API URL (default: http://127.0.0.1:3000)",
    )
    args = parser.parse_args()

    # Load domains
    data = load_json_source(args.json, args.stdin)
    if data is None:
        print("Error: No JSON source found. Provide --json <path> or --stdin, "
              "or ensure memory/domain-hunter/latest.json exists.", file=sys.stderr)
        sys.exit(1)

    results = parse_results(data)
    if not results:
        print("Warning: No domain results found in input.")
        sys.exit(0)

    # Load dedup history
    dispatched_set = load_dispatched_history()

    # Stats
    total = len(results)
    available_count = 0
    product_dispatched = 0
    revenue_dispatched = 0
    skipped_count = 0
    dedup_skipped = 0
    summary = []

    mode_label = "[DRY RUN] " if args.dry_run else ""
    print(f"{mode_label}Domain Hunter Pipeline Dispatcher")
    print(f"Processing {total} total domains from scan")
    print(f"Product score threshold: >= {PRODUCT_SCORE_THRESHOLD}")
    print(f"Revenue score threshold: >= {REVENUE_SCORE_THRESHOLD}")
    print(f"Known dispatched domains: {len(dispatched_set)}")
    print("=" * 60)

    for entry in results:
        domain = entry.get("domain", "")
        availability = entry.get("availability", "unknown")
        score = entry.get("score", 0)
        service_score = entry.get("service_score", 0)
        verdict = entry.get("verdict", "skip").lower()

        # Only process available domains
        if availability != "available":
            skipped_count += 1
            continue

        available_count += 1

        # Dedup check
        dhash = domain_hash(domain)
        if dhash in dispatched_set:
            dedup_skipped += 1
            print(f"  [DEDUP] {domain} — already dispatched")
            continue

        verdict_lower = verdict.lower()
        dispatched_to = []
        verdicts_applied = []

        # ── Route to Product Swarm ─────────────────────────────────────
        if should_dispatch_product(domain, score, verdict_lower):
            payload = build_product_payload(
                domain, score, service_score, verdict, entry
            )
            resp = dispatch_to_swarm(
                args.workspace_url, "product", "domain_acquisition",
                payload, args.dry_run,
            )
            status_str = (
                "dispatched" if resp.get("dry_run") or resp.get("status") in (200, 201, 202)
                else f"FAILED: {resp.get('error') or resp.get('status')}"
            )
            print(f"  [{mode_label}PRODUCT] {domain} (score={score}) → {status_str}")
            product_dispatched += 1
            dispatched_to.append("product")
            verdicts_applied.append("product")

        # ── Route to Revenue Swarm ─────────────────────────────────────
        if should_dispatch_revenue(domain, score, verdict_lower):
            payload = build_revenue_payload(
                domain, score, service_score, verdict, entry
            )
            resp = dispatch_to_swarm(
                args.workspace_url, "revenue", "domain_flip",
                payload, args.dry_run,
            )
            status_str = (
                "dispatched" if resp.get("dry_run") or resp.get("status") in (200, 201, 202)
                else f"FAILED: {resp.get('error') or resp.get('status')}"
            )
            print(f"  [{mode_label.rstrip()}REVENUE] {domain} (score={score}) → {status_str}")
            revenue_dispatched += 1
            dispatched_to.append("revenue")
            verdicts_applied.append("revenue")

        if dispatched_to:
            save_dispatched_domain(dispatched_set, domain, verdicts_applied)
            summary.append({
                "domain": domain,
                "score": score,
                "verdict": verdict,
                "dispatched_to": dispatched_to,
            })
        else:
            skipped_count += 1
            print(f"  [SKIP] {domain} (score={score}, verdict={verdict}) — below thresholds")

    # ── Summary Report ─────────────────────────────────────────────────
    print(f"\n{'=' * 60}")
    print(f"Dispatch Summary")
    print(f"  Total domains scanned:    {total}")
    print(f"  Available domains:         {available_count}")
    print(f"  Dedup skipped:             {dedup_skipped}")
    print(f"  Below threshold skipped:   {skipped_count - dedup_skipped}")
    print(f"  Product swarm dispatched:  {product_dispatched}")
    print(f"  Revenue swarm dispatched:  {revenue_dispatched}")
    print(f"  Dispatched.json updated:   {len(dispatched_set)} total known")

    # Save dispatch report
    report_path = os.path.join(
        MEMORY_DIR, f"dispatch-{datetime.utcnow().strftime('%Y%m%d-%H%M%S')}.json"
    )
    report = {
        "timestamp": datetime.utcnow().isoformat(),
        "total_domains": total,
        "available_domains": available_count,
        "dedup_skipped": dedup_skipped,
        "product_dispatched": product_dispatched,
        "revenue_dispatched": revenue_dispatched,
        "dispatched_domains": [d["domain"] for d in summary],
        "summary": summary,
    }
    try:
        os.makedirs(MEMORY_DIR, exist_ok=True)
        with open(report_path, "w") as f:
            json.dump(report, f, indent=2)
        print(f"  Report saved to:           {report_path}")
    except IOError as e:
        print(f"  [WARN] Could not save report: {e}")

    return report


if __name__ == "__main__":
    main()
