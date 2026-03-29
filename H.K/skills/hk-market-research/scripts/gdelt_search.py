#!/usr/bin/env python3
"""Search GDELT for global news articles. Free, unlimited, no API key needed."""
import json
import sys
import time
import urllib.request
import urllib.parse
import urllib.error
import argparse


BASE_URL = "https://api.gdeltproject.org/api/v2/doc/doc"


def search(query, mode="artlist", max_records=25, is_theme=False):
    """Search GDELT articles by keyword or theme."""
    if is_theme:
        gdelt_query = f'theme:{query}'
    else:
        gdelt_query = query

    params = {
        "query": gdelt_query,
        "mode": mode,
        "maxrecords": str(min(max_records, 250)),
        "format": "json",
        "sort": "DateDesc",
    }
    url = f"{BASE_URL}?{urllib.parse.urlencode(params)}"

    for attempt in range(3):
        if attempt > 0:
            wait = (attempt + 1) * 15
            print(f"GDELT retry {attempt+1}/3, waiting {wait}s...",
                  file=sys.stderr)
            time.sleep(wait)
        try:
            req = urllib.request.Request(url, headers={
                "User-Agent": "MarketResearchCLI/1.0 (research@example.com)"
            })
            with urllib.request.urlopen(req, timeout=30) as resp:
                data = json.loads(resp.read().decode("utf-8"))
            return data
        except urllib.error.HTTPError as e:
            if e.code in (429, 500, 502, 503) and attempt < 2:
                wait = (attempt + 1) * 15
                print(f"HTTP {e.code}, retrying in {wait}s...",
                      file=sys.stderr)
                time.sleep(wait)
                continue
            print(f"HTTP error {e.code}: {e.reason}", file=sys.stderr)
            sys.exit(1)
        except urllib.error.URLError as e:
            if attempt < 2:
                wait = (attempt + 1) * 10
                print(f"Network error, retrying in {wait}s...",
                      file=sys.stderr)
                time.sleep(wait)
                continue
            print(f"Network error: {e.reason}", file=sys.stderr)
            sys.exit(1)
        except json.JSONDecodeError:
            if attempt < 2:
                wait = (attempt + 1) * 10
                print(f"Non-JSON response, retrying in {wait}s...",
                      file=sys.stderr)
                time.sleep(wait)
                continue
            print("Error: non-JSON GDELT response after 3 attempts",
                  file=sys.stderr)
            sys.exit(1)

    print("Error: GDELT failed after 3 attempts", file=sys.stderr)
    sys.exit(1)


def format_artlist(data):
    """Format article list results."""
    articles = data.get("articles", [])
    if not articles:
        return {"count": 0, "articles": []}

    results = []
    for art in articles:
        results.append({
            "title": art.get("title", ""),
            "url": art.get("url", ""),
            "date": art.get("seendate", ""),
            "source": art.get("domain", ""),
            "language": art.get("language", ""),
            "tone": art.get("tone", 0),
        })
    return {"count": len(results), "articles": results}


def format_timeline(data):
    """Format timeline results."""
    timeline = data.get("timeline", [])
    if not timeline:
        return {"count": 0, "data": []}

    series = timeline[0] if timeline else {}
    points = series.get("data", [])
    results = []
    for point in points:
        results.append({
            "date": point.get("date", ""),
            "value": point.get("value", 0),
        })
    return {"count": len(results), "data": results}


def main():
    parser = argparse.ArgumentParser(
        description="Search GDELT for global news articles"
    )
    parser.add_argument("query", help="Search query or GDELT theme")
    parser.add_argument(
        "--mode", choices=["artlist", "timeline"],
        default="artlist", help="Search mode (default: artlist)"
    )
    parser.add_argument(
        "--max", type=int, default=25,
        help="Max records to return (default: 25, max: 250)"
    )
    parser.add_argument(
        "--theme", action="store_true",
        help="Treat query as a GDELT theme code"
    )
    args = parser.parse_args()

    data = search(args.query, args.mode, args.max, args.theme)

    if args.mode == "artlist":
        result = format_artlist(data)
    else:
        result = format_timeline(data)

    print(json.dumps(result, indent=2, ensure_ascii=False))


if __name__ == "__main__":
    main()
