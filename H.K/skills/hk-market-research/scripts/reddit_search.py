#!/usr/bin/env python3
"""Search Reddit for opinions and discussions. Free, no API key (public JSON)."""
import json
import sys
import time
import urllib.request
import urllib.parse
import urllib.error
import argparse


def reddit_search(query, subreddit=None, sort="relevance", limit=20):
    """Search Reddit using the public JSON API."""
    if subreddit:
        base = f"https://www.reddit.com/r/{subreddit}/search.json"
        params = {
            "q": query,
            "sort": sort,
            "limit": str(min(limit, 100)),
            "restrict_sr": "on",
            "t": "year",
        }
    else:
        base = "https://www.reddit.com/search.json"
        params = {
            "q": query,
            "sort": sort,
            "limit": str(min(limit, 100)),
            "t": "year",
        }

    url = f"{base}?{urllib.parse.urlencode(params)}"

    try:
        req = urllib.request.Request(url, headers={
            "User-Agent": "MarketResearchCLI/1.0 (research bot)"
        })
        with urllib.request.urlopen(req, timeout=30) as resp:
            data = json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        if e.code == 429:
            print("Rate limited by Reddit. Waiting 10s...", file=sys.stderr)
            time.sleep(10)
            return reddit_search(query, subreddit, sort, limit)
        print(f"HTTP error {e.code}: {e.reason}", file=sys.stderr)
        sys.exit(1)
    except urllib.error.URLError as e:
        print(f"Network error: {e.reason}", file=sys.stderr)
        sys.exit(1)

    children = data.get("data", {}).get("children", [])
    results = []
    for child in children:
        post = child.get("data", {})
        text = post.get("selftext", "")
        results.append({
            "title": post.get("title", ""),
            "subreddit": post.get("subreddit", ""),
            "score": post.get("score", 0),
            "num_comments": post.get("num_comments", 0),
            "url": f"https://reddit.com{post.get('permalink', '')}",
            "created_utc": post.get("created_utc", 0),
            "excerpt": text[:300] if text else "",
        })

    return {"count": len(results), "posts": results}


def main():
    parser = argparse.ArgumentParser(
        description="Search Reddit for opinions and discussions"
    )
    parser.add_argument("query", help="Search query")
    parser.add_argument(
        "--subreddit", help="Limit to specific subreddit"
    )
    parser.add_argument(
        "--sort", choices=["relevance", "hot", "top", "new", "comments"],
        default="relevance", help="Sort order (default: relevance)"
    )
    parser.add_argument(
        "--limit", type=int, default=20,
        help="Max posts to return (default: 20, max: 100)"
    )
    args = parser.parse_args()

    result = reddit_search(args.query, args.subreddit, args.sort, args.limit)
    print(json.dumps(result, indent=2, ensure_ascii=False))


if __name__ == "__main__":
    main()
