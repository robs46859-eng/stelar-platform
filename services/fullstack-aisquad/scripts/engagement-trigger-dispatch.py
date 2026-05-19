#!/usr/bin/env python3
"""
Engagement Swarm Dispatch Script

Routes platform signals to the appropriate engagement swarm workers.

Usage:
  python engagement-trigger-dispatch.py --dry-run
  cat signal.json | python engagement-trigger-dispatch.py --stdin

"""
import os
import sys
import json
import argparse

WORKSPACE = os.path.expanduser("~/hermes-workspace")
WORKSPACE_URL = os.getenv("WORKSPACE_URL", "http://127.0.0.1:3000")

ICP_THRESHOLD = 70

ROUTING = {
    "signal_detected": ["signal-orchestrator"],
    "reddit_signal": ["reddit-monitor", "signal-orchestrator"],
    "youtube_signal": ["youtube-monitor", "signal-orchestrator"],
    "linkedin_signal": ["linkedin-monitor", "signal-orchestrator"],
    "quora_signal": ["quora-monitor", "signal-orchestrator"],
    "instagram_signal": ["instagram-monitor", "signal-orchestrator"],
    "engagement_queue_ready": ["engagement-writer", "signal-orchestrator"],
    "competitor_update": ["linkedin-monitor", "signal-orchestrator"],
    "campaign_review": ["engagement-writer", "signal-orchestrator"],
}

def build_assignments(payload):
    trigger_type = payload.get("type", "")
    signal = payload.get("signal", {})
    score = signal.get("score", 0)
    
    targets = ROUTING.get(trigger_type, [])
    
    assignments = []
    for worker_id in targets:
        rationale = payload.get("notes", "")
        if score >= ICP_THRESHOLD:
            rationale += f" | ICP score: {score} (HIGH PRIORITY)"
        elif score >= 40:
            rationale += f" | ICP score: {score} (watch-list)"
        
        task = f"Process {trigger_type} from {signal.get('platform', 'unknown')}"
        if signal.get("author"):
            task += f" by {signal['author']}"
        
        assignments.append({
            "workerId": worker_id,
            "task": task,
            "rationale": rationale,
        })
    
    return {
        "missionTitle": f"Engagement: {trigger_type}",
        "assignments": assignments,
        "notifySessionKey": "engagement-swarm",
    }


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--json", help="Path to signal JSON")
    parser.add_argument("--stdin", action="store_true", help="Read from stdin")
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()
    
    if args.stdin:
        data = json.loads(sys.stdin.read())
    elif args.json:
        with open(args.json) as f:
            data = json.load(f)
    else:
        print("Error: provide --json or --stdin", file=sys.stderr)
        sys.exit(1)
    
    result = build_assignments(data)
    
    mode = "[DRY RUN]" if args.dry_run else "LIVE"
    print(f"{mode} Engagement Dispatch")
    print(f"  Trigger: {data.get('type', 'unknown')}")
    print(f"  Platform: {data.get('signal', {}).get('platform', 'unknown')}")
    print(f"  Score: {data.get('signal', {}).get('score', 0)}")
    for a in result["assignments"]:
        print(f"  -> {a['workerId']}: {a['task']}")
        print(f"     Rationale: {a['rationale']}")
    
    if not args.dry_run:
        import urllib.request
        dispatch_url = f"{WORKSPACE_URL}/api/swarm-dispatch"
        req = urllib.request.Request(
            dispatch_url,
            data=json.dumps(result).encode(),
            headers={"Content-Type": "application/json"},
            method="POST",
        )
        try:
            with urllib.request.urlopen(req, timeout=30) as resp:
                print(f"  Dispatched: {resp.status}")
        except Exception as e:
            print(f"  Dispatch failed: {e}")
    
    return result

if __name__ == "__main__":
    main()
