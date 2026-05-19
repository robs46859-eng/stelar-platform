#!/usr/bin/env python3
"""Prepared Paige Reddit Buy Signal Scanner — Listen-Only Mode"""

import xml.etree.ElementTree as ET
import json
import re
import os
from datetime import datetime, timezone

SUBREDDITS = ["BabyBumps", "beyondthebump", "breastfeeding", "sleeptrain"]
FEED_FILES = {
    "BabyBumps": "/tmp/babybumps.xml",
    "beyondthebump": "/tmp/beyondthebump.xml",
    "breastfeeding": "/tmp/breastfeeding.xml",
    "sleeptrain": "/tmp/sleeptrain.xml",
}

OUTPUT_DIR = "/home/azureuser/fullstack-aisquad/memory/signal-engagement/raw-signals"

# --- Signal pattern keyword groups ---
BUY_INTENT_PATTERNS = [
    r"(?:wh|sh|c)ould\s+(?:you\s+)?(?:recommend|suggest)",
    r"(?:what|which|where)\s+.*(?:buy|get|purchase|regist|order|need)",
    r"should\s+(?:i\s+)?(?:buy|get|purchase|try|use|order)",
    r"is\s+(?:it\s+)?worth",
    r"any\s+(?:recommendations?|advice|suggestions?|tips?)",
    r"anyone\s+(?:else\s+)?(?:struggling|dealing|having trouble|having issues)",
    r"(?:any|what)\s+.*(?:use|used|used\s+for|do\s+you\s+use)",
    r"looking\s+(?:for|to\s+buy|into)",
    r"what\s+did\s+you\s+(?:pack|buy|get|put|use|include)",
    r"registry\s+(?:help|must|haves)",
    r"what\s+.*need",
    r"need\s+.*(?:recommendations?|help|advice|suggestions?)",
    r"best\s+(?:option|choice|product|for|to)",
]

BUY_INTENT_LITE = [
    r"(?:recommend|suggestion|advice)\b",
    r"(?:help|ideas|thoughts)\b",
]

FRUSTRATION_PATTERNS = [
    r"(?:my\s+baby|baby)\s+(?:won|can|doesn'?t|isn'?t|refuses|can't)",
    r"(?:can|couldn?)'?t\s+(?:get|figure)\s+(?:my\s+)?baby",
    r"(?:overwhelm|exhausted|can'?t\s+sleep|insomnia)",
    r"struggling\s+(?:with|to)",
    r"(?:so|really|very|too)\s+(?:anxious|stressed|worried|scared|confused|frustrated)",
    r"having\s+(?:a\s+)?hard\s+time",
    r"don'?t\s+know\s+(?:what|how|if)",
    r"is\s+this\s+normal",
    r"anyone\s+else",
]

COMPETITOR_PATTERNS = [
    r"(?:taking\s+cara\s+babies|takingcara|tcbb)",
    r"(?:hatch\s+rest|hatch\b)",
    r"(?:love\s+to\s+dream\b|lovetodream|ltw\s+swaddle)",
    r"(?:dock.?a.?tot|dockatot)",
    r"(?:snoo|snoo\b)",
    r"(?:eric\s+sonnenburg|ericsonnenburg)",
    r"(?:magic\s+of\s+sleeping|themagicofsleeping)",
    r"(?:babywise|babywise\b)",
    r"(?:huckleberry\b|app)",
]

DEMOGRAPHIC_PATTERNS = [
    r"(?:first\s+(?:time\s+)?mom|ftm|first\s+pregnancy|first\s+baby|first\s+child)",
    r"(?:pregnan|expecting|3[0-9]\s*week[s]?\s+pren?ant)",
    r"(?:postpartum|pp|after\s+birth|after\s+delivery|newborn|new\s+mom)",
    r"(\d+)\s*(?:weeks?|week\s+)(?:pregnan|along)",
    r"(?:postpartum|after\s+baby|after\s+birth)",
    r"\b3\d\b",  # 30-36 age range — rough proxy
]

BREASTFEEDING_PATTERNS = [
    r"(?:breastfeed|nurs(ing|e)|latch|supply|clogged|mastitis|pump(ing)?)",
    r"(?:nipple\s+pain|cracked|bleeding|thrush|force\s+let)",
]

SLEEP_PATTERNS = [
    r"(?:sleep\s*train|night\s+waking|sleep\s+regression|won'?t\s+sleep)",
    r"(?:nap|napping|sleep\s+schedule|wake\s+window)",
    r"(?:co.?sleep|contact\s+nap|rock.?to\s+sleep)",
    r"(?:bedtime\s+routine|sleep\s+association)",
    r"(?:4\s*month|8\s*month|12\s*month|9\s*month)\s+(?:regression|month)",
]

POSTPARTUM_PATTERNS = [
    r"(?:ppd|postpartum\s+depression|postpartum\s+anxiet|baby\s+blues)",
    r"(?:not\s+bonding|feel\s+guilty|mom\s+guilt|feel\s+like\s+i'?m\s+failing)",
    r"(?:overwhelm|can'?t\s+cope|feel\s+alone|no\s+support)",
]


def clean_html(text):
    """Strip HTML entities and tags from text."""
    text = re.sub(r"&amp;#32;", " ", text)
    text = re.sub(r"&lt;/?", "", text)
    text = re.sub(r"</?\w[^>]*>", " ", text)
    text = re.sub(r"&amp;", "&", text)
    text = re.sub(r"&#[^;]+;", " ", text)
    text = re.sub(r"\s+", " ", text).strip()
    return text


def matches_any(text, patterns):
    """Check if text matches any pattern in list."""
    return any(bool(re.search(p, text, re.IGNORECASE)) for p in patterns)


def extract_email_domain(author_uri):
    """Return username from /u/username."""
    m = re.search(r"/u/([^/?]+)", author_uri)
    return m.group(1) if m else "unknown"


def score_post(title, body, author, subreddit, pub_time_str):
    """Score a post against the Prepared Paige ICP matrix."""
    text = f"{title}. {body}".lower()
    title_lower = title.lower()
    
    score = 0
    signals_hit = []
    
    # 1. Demographics match (max 20 pts)
    demo_score = 0
    if matches_any(text, DEMOGRAPHIC_PATTERNS):
        demo_score += 12
        signals_hit.append("demographic_match")
    if matches_any(text, BREASTFEEDING_PATTERNS) or matches_any(text, SLEEP_PATTERNS):
        demo_score += 8
        signals_hit.append("breastfeeding_or_sleep_topic")
    score += min(demo_score, 20)
    
    # 2. Explicit buying intent (max 25 pts)
    intent_score = 0
    if matches_any(text, BUY_INTENT_PATTERNS):
        intent_score += 20
        signals_hit.append("explicit_buying_intent")
    elif matches_any(text, BUY_INTENT_LITE):
        intent_score += 10
        signals_hit.append("mild_intent")
    if "best" in title_lower or "recommend" in title_lower:
        intent_score += 5
    score += min(intent_score, 25)
    
    # 3. Frustration (max 15 pts)
    frust_score = 0
    if matches_any(text, FRUSTRATION_PATTERNS):
        frust_score += 10
        signals_hit.append("frustrated_overwhelmed")
    frust_count = len([p for p in FRUSTRATION_PATTERNS if re.search(p, text, re.IGNORECASE)])
    if frust_count >= 2:
        frust_score += 5
    score += min(frust_score, 15)
    
    # 4. Competitor mention (max 10 pts)
    if matches_any(text, COMPETITOR_PATTERNS):
        score += 10
        signals_hit.append("competitor_mention")
    
    # 5. Community trust (max 15 pts) — we can't fully check without API,
    # but posts with substantial body text suggest investment
    body_words = len(body.split())
    if body_words > 50:
        score += 8
        signals_hit.append("substantive_post")
    if body_words > 200:
        score += 7
        signals_hit.append("deep_post")
    
    # 6. Timing (max 15 pts) — check if posted 9pm-1am EST/EDT
    if pub_time_str:
        try:
            pub_time = datetime.fromisoformat(pub_time_str.replace('Z', '+00:00'))
            est = timezone(-__import__('datetime').timedelta(hours=5))
            est_time = pub_time.astimezone(est)
            hour = est_time.hour
            if 21 <= hour or hour < 1:
                score += 15
                signals_hit.append("late_night_posting_9pm_1am")
            elif 21 <= hour or hour <= 3:
                score += 10
                signals_hit.append("evening_posting")
        except:
            pass
    
    # 7. Mobile indicators (max 5 pts) — short posts or iPhone-style formatting
    if len(body) < 300 and body:
        score += 3
        signals_hit.append("short_post_mobile")
    if matches_any(title, [r"^(?!https?).*[!?]{2,}$"]):  # emoji/punctuation heavy
        score += 2
    
    # Bonus: subreddit affinity
    if subreddit in ["breastfeeding", "sleeptrain"]:
        score += 3
        signals_hit.append("high_affinity_sub")
    
    cap_score = min(score, 100)
    
    # Determine category
    if cap_score >= 70:
        category = "ENGAGE"
    elif cap_score >= 40:
        category = "WATCH"
    else:
        category = "IGNORE"
    
    return cap_score, category, signals_hit


def parse_feed(xml_path, subreddit):
    """Parse an RSS feed and return list of post dicts."""
    posts = []
    try:
        tree = ET.parse(xml_path)
        root = tree.getroot()
        ns = {"atom": "http://www.w3.org/2005/Atom"}
        
        entries = root.findall("atom:entry", ns)
        if not entries:
            entries = root.findall("entry")
        
        for entry in entries:
            # Get fields, handling namespaced and non-namespaced
            title = entry.find("atom:title", ns)
            if title is None:
                title = entry.find("title")
            title_text = title.text if title is not None else ""
            
            content_el = entry.find("atom:content", ns)
            if content_el is None:
                content_el = entry.find("content")
            content_raw = content_el.text if content_el is not None else ""
            content_clean = clean_html(content_raw) if content_raw else ""
            
            author_el = entry.find("atom:author/atom:name", ns)
            if author_el is None:
                author_el = entry.find("author/name")
            author = author_el.text if author_el is not None else "unknown"
            
            link_el = entry.find("atom:link", ns)
            if link_el is None:
                link_el = entry.find("link")
            link = link_el.get("href", "") if link_el is not None else ""
            
            pub_el = entry.find("atom:published", ns)
            if pub_el is None:
                pub_el = entry.find("published")
            pub_time = pub_el.text if pub_el is not None else ""
            
            post_id_el = entry.find("atom:id", ns)
            if post_id_el is None:
                post_id_el = entry.find("id")
            post_id = post_id_el.text if post_id_el is not None else ""
            
            posts.append({
                "title": title_text,
                "body": content_clean,
                "author": author,
                "link": link,
                "pub_time": pub_time,
                "post_id": post_id,
                "subreddit": subreddit,
            })
    except Exception as e:
        print(f"  ERROR parsing {xml_path}: {e}")
    
    return posts


def main():
    all_posts = []
    all_signals = []
    
    for subreddit in SUBREDDITS:
        xml_path = FEED_FILES.get(subreddit)
        if not xml_path or not os.path.exists(xml_path):
            print(f"  SKIP: {subreddit} (no feed file)")
            continue
        
        posts = parse_feed(xml_path, subreddit)
        print(f"  r/{subreddit}: {len(posts)} posts fetched")
        all_posts.extend(posts)
        
        for post in posts:
            score, category, signals_hit = score_post(
                post["title"],
                post["body"],
                post["author"],
                post["subreddit"],
                post["pub_time"],
            )
            
            scored_signal = {
                "score": score,
                "category": category,
                "signals_hit": signals_hit,
                "subreddit": post["subreddit"],
                "title": post["title"],
                "body_preview": post["body"][:500] if len(post["body"]) > 500 else post["body"],
                "author": post["author"],
                "url": post["link"],
                "post_id": post["post_id"],
                "pub_time": post["pub_time"],
                "scanned_at": datetime.now(timezone.utc).isoformat(),
            }
            all_signals.append(scored_signal)
    
    # Sort by score descending
    all_signals.sort(key=lambda x: x["score"], reverse=True)
    
    # Filter to 40+
    significant_signals = [s for s in all_signals if s["score"] >= 40]
    
    # Write full scan
    timestamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    
    scan_report = {
        "scan_metadata": {
            "scan_time_utc": datetime.now(timezone.utc).isoformat(),
            "mode": "LISTEN_ONLY",
            "subreddits_scanned": SUBREDDITS,
            "total_posts_scanned": len(all_posts),
            "signals_40_plus": len(significant_signals),
            "signals_70_plus": len([s for s in all_signals if s["score"] >= 70]),
            "watch_list_40_69": len([s for s in all_signals if 40 <= s["score"] < 70]),
        },
        "significant_signals": significant_signals,
        "all_scored_posts": all_signals,
    }
    
    output_path = os.path.join(OUTPUT_DIR, f"reddit-scan-{timestamp}.json")
    
    with open(output_path, "w") as f:
        json.dump(scan_report, f, indent=2)
    
    print(f"\n--- SCAN COMPLETE ---")
    print(f"Total posts scanned: {len(all_posts)}")
    print(f"Signals 40+: {len(significant_signals)}")
    print(f"Signals 70+ (ENGAGE): {len([s for s in all_signals if s['score'] >= 70])}")
    print(f"Signals 40-69 (WATCH): {len([s for s in all_signals if 40 <= s['score'] < 70])}")
    print(f"Saved to: {output_path}")
    print()
    
    # Print top signals
    if significant_signals:
        print("=== TOP SIGNALS (40+) ===")
        for sig in significant_signals:
            print(f"  [{sig['category']:>7}] Score {sig['score']:>3} | r/{sig['subreddit']} | {sig['title'][:80]}")
            print(f"           URL: {sig['url']}")
            print(f"           Signals: {', '.join(sig['signals_hit'])}")
            print()
    else:
        print("No signals 40+ found in this scan.")


if __name__ == "__main__":
    main()
