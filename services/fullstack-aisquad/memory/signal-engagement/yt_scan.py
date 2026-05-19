#!/usr/bin/env python3
"""YouTube Monitor scan for Prepared Paige buying signals."""

import json
import urllib.request
import urllib.parse
import time
from datetime import datetime, timezone

API_KEY = "AIzaSyAWvtb-VCUC433SgxTNF93SZZIla_mLrC0"
BASE_URL = "https://www.googleapis.com/youtube/v3"
OUTPUT_DIR = "/home/azureuser/fullstack-aisquad/memory/signal-engagement/raw-signals"

SEARCH_QUERIES = [
    "first time mom",
    "postpartum",
    "breastfeeding",
    "newborn sleep",
    "hospital bag",
]

def api_get(url_parts):
    """Make a GET request to YouTube Data API."""
    url = f"{BASE_URL}/{url_parts}"
    req = urllib.request.Request(url)
    with urllib.request.urlopen(req, timeout=20) as resp:
        return json.loads(resp.read().decode())

def search_videos(query, max_results=5):
    """Search for videos matching query."""
    params = urllib.parse.urlencode({
        "part": "snippet",
        "type": "video",
        "q": query,
        "maxResults": max_results,
        "order": "relevance",
        "key": API_KEY,
    })
    return api_get(f"search?{params}")

def get_video_details(video_ids):
    """Get detailed stats (viewCount, commentCount) for videos."""
    params = urllib.parse.urlencode({
        "part": "snippet,statistics",
        "id": ",".join(video_ids),
        "key": API_KEY,
    })
    return api_get(f"videos?{params}")

def get_comments(video_id, max_results=10):
    """Get top-level comments for a video."""
    params = urllib.parse.urlencode({
        "part": "snippet",
        "videoId": video_id,
        "maxResults": max_results,
        "key": API_KEY,
    })
    return api_get(f"commentThreads?{params}")

def score_comment(text):
    """Score a comment against the Prepared Paige ICP."""
    score = 0
    triggers = []

    text_lower = text.lower()

    # First-time mom
    ftm_phrases = ["first time mom", "first time mum", "first-time mom", "first baby", 
                    "first time pregnant", "ftm", "expecting my first", "new mom",
                    "first child", "first pregnancy"]
    for phrase in ftm_phrases:
        if phrase in text_lower:
            score += 20
            triggers.append(f"FTM mention (+20): '{phrase}'")
            break

    # Frustration/overwhelm
    frustration_words = ["overwhelmed", "overwhelm", "stressed", "anxious", "scared",
                         "confused", "so much", "don't know", "no idea", "help",
                         "nervous", "terrified", "hard", "struggling", "tired",
                         "exhausting", "exhausted", "crying", "losing my mind",
                         "at my wits", "desperate"]
    found_frustration = [w for w in frustration_words if w in text_lower]
    if found_frustration:
        score += 15
        triggers.append(f"Frustration (+15): {found_frustration}")

    # Looking for recommendations
    rec_phrases = ["recommend", "what did you use", "what should i", "looking for",
                   "need advice", "any tips", "what worked", "what helped",
                   "buy", "purchase", "best", "should i get", "where do i start",
                   "how do i", "what do i"]
    found_rec = [p for p in rec_phrases if p in text_lower]
    if found_rec:
        score += 25
        triggers.append(f"Seeking recs (+25): {found_rec}")

    # Competitor mentions
    competitors = ["hatch", "taking cara babies", "cara babies", "snoo", "love to dream",
                   "mamaroo", "frida mom", "boppy", "earthly angel", "nested bean",
                   "halo", "aden anais"]
    found_comp = [c for c in competitors if c in text_lower]
    if found_comp:
        score += 10
        triggers.append(f"Competitor (+10): {found_comp}")

    # Time-sensitive topics
    ts_topics = ["sleep", "breastfeeding", "breast", "feeding", "pain", "labor",
                 "delivery", "contraction", "nursing", "pumping", "latch",
                 "crib", "swaddle", "sore", "engorged", "mastitis", "clog"]
    found_ts = [t for t in ts_topics if t in text_lower]
    if found_ts:
        score += 15
        triggers.append(f"Time-sensitive (+15): {found_ts}")

    return score, triggers

def main():
    timestamp = datetime.now(timezone.utc).strftime("%Y%m%d-%H%M%S")
    results = {
        "scan_timestamp": timestamp,
        "mode": "LISTEN-ONLY",
        "icp": "Prepared Paige - First-time pregnant/postpartum women 29-36, $90-200K",
        "videos_scanned": [],
        "signals": [],
        "total_comments_scored": 0,
        "high_signals": 0,
        "watchlist_signals": 0,
    }

    scanned_video_ids = set()

    for query in SEARCH_QUERIES:
        print(f"\n{'='*60}")
        print(f"Searching: {query}")
        print(f"{'='*60}")

        try:
            search_data = search_videos(query)
        except Exception as e:
            print(f"  ERROR searching '{query}': {e}")
            continue

        items = search_data.get("items", [])
        if not items:
            print(f"  No results for '{query}'")
            continue

        # Collect video IDs and metadata
        video_ids = []
        for item in items:
            vid = item["id"]["videoId"]
            snippet = item["snippet"]
            video_ids.append(vid)
            results["videos_scanned"].append({
                "video_id": vid,
                "title": snippet.get("title", ""),
                "channel": snippet.get("channelTitle", ""),
                "published_at": snippet.get("publishedAt", ""),
            })

        # Get detailed stats
        try:
            details = get_video_details(video_ids)
            for vid_detail in details.get("items", []):
                vid = vid_detail["id"]
                stats = vid_detail.get("statistics", {})
                scanned_video_ids.add(vid)
                # Update with stats
                for v in results["videos_scanned"]:
                    if v["video_id"] == vid:
                        v["view_count"] = int(stats.get("viewCount", 0))
                        v["comment_count"] = int(stats.get("commentCount", 0))
                        v["snippet_full"] = vid_detail["snippet"]
                        break
                views = stats.get("viewCount", "?")
                comments = stats.get("commentCount", "?")
                print(f"  [{vid}] views={views}, comments={comments}")
        except Exception as e:
            print(f"  ERROR getting details: {e}")

        # Fetch and score comments for each video
        for vid in video_ids:
            print(f"\n  Fetching comments for {vid}...")
            try:
                comments_data = get_comments(vid)
            except Exception as e:
                print(f"    ERROR: {e}")
                continue

            items = comments_data.get("items", [])
            if not items:
                print(f"    No comments found")
                continue

            for i, thread in enumerate(items):
                snippet = thread["snippet"]
                comment = snippet["topLevelComment"]["snippet"]
                author = comment.get("authorDisplayName", "unknown")
                text = comment.get("textDisplay", "")
                # Strip HTML tags
                import re
                text_clean = re.sub(r'<[^>]+>', '', text)
                published = comment.get("publishedAt", "")
                like_count = comment.get("likeCount", 0)

                score, triggers = score_comment(text_clean)
                results["total_comments_scored"] += 1

                print(f"    @{author} | score={score} | {text_clean[:120]}...")
                for t in triggers:
                    print(f"       {t}")

                if score >= 40:
                    signal = {
                        "video_id": vid,
                        "video_title": "",
                        "channel": "",
                        "author": author,
                        "comment_text": text_clean,
                        "score": score,
                        "triggers": triggers,
                        "published_at": published,
                        "likes": like_count,
                        "tier": "ENGAGE_70+" if score >= 70 else "WATCHLIST_40-69",
                    }
                    # Fill in video info
                    for vd in results["videos_scanned"]:
                        if vd["video_id"] == vid:
                            signal["video_title"] = vd["title"]
                            signal["channel"] = vd["channel"]
                            break
                    
                    results["signals"].append(signal)
                    if score >= 70:
                        results["high_signals"] += 1
                    else:
                        results["watchlist_signals"] += 1

            time.sleep(0.3)

        time.sleep(0.5)

    # Save results
    output_path = f"{OUTPUT_DIR}/youtube-scan-{timestamp}.json"
    with open(output_path, "w") as f:
        json.dump(results, f, indent=2)

    # Summary
    print(f"\n{'='*60}")
    print(f"SCAN COMPLETE")
    print(f"{'='*60}")
    print(f"Videos scanned: {len(results['videos_scanned'])}")
    print(f"Comments scored: {results['total_comments_scored']}")
    print(f"Total signals (40+): {len(results['signals'])}")
    print(f"  ENGAGE 70+: {results['high_signals']}")
    print(f"  WATCHLIST 40-69: {results['watchlist_signals']}")
    print(f"Saved to: {output_path}")

if __name__ == "__main__":
    main()
