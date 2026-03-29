#!/usr/bin/env python3
"""Fetch economic data from FRED (Federal Reserve). Free API key required."""
import json
import os
import sys
import urllib.request
import urllib.parse
import argparse


BASE_URL = "https://api.stlouisfed.org/fred"


def get_api_key():
    """Get FRED API key from environment."""
    key = os.environ.get("FRED_API_KEY", "")
    if not key:
        print("Error: FRED_API_KEY not set", file=sys.stderr)
        print("Get free: fred.stlouisfed.org/docs/api/api_key.html",
              file=sys.stderr)
        sys.exit(1)
    return key


def fred_request(endpoint, params):
    """Make a request to FRED API."""
    params["api_key"] = get_api_key()
    params["file_type"] = "json"
    url = f"{BASE_URL}/{endpoint}?{urllib.parse.urlencode(params)}"

    try:
        req = urllib.request.Request(url, headers={
            "User-Agent": "MarketResearchCLI/1.0"
        })
        with urllib.request.urlopen(req, timeout=30) as resp:
            return json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        print(f"HTTP error {e.code}: {e.reason}", file=sys.stderr)
        sys.exit(1)
    except urllib.error.URLError as e:
        print(f"Network error: {e.reason}", file=sys.stderr)
        sys.exit(1)


def search_series(query, limit=10):
    """Search for FRED series by keyword."""
    data = fred_request("series/search", {
        "search_text": query,
        "limit": str(min(limit, 50)),
        "order_by": "popularity",
        "sort_order": "desc",
    })
    series = data.get("seriess", [])
    results = []
    for s in series:
        results.append({
            "id": s.get("id", ""),
            "title": s.get("title", ""),
            "frequency": s.get("frequency_short", ""),
            "units": s.get("units_short", ""),
            "last_updated": s.get("last_updated", ""),
        })
    return {"count": len(results), "series": results}


def get_observations(series_id, start_date=None):
    """Get observations for a specific series."""
    params = {"series_id": series_id}
    if start_date:
        params["observation_start"] = start_date

    data = fred_request("series/observations", params)
    obs = data.get("observations", [])
    results = []
    for o in obs:
        val = o.get("value", ".")
        results.append({
            "date": o.get("date", ""),
            "value": float(val) if val != "." else None,
        })
    return {
        "series_id": series_id,
        "count": len(results),
        "observations": results,
    }


def main():
    parser = argparse.ArgumentParser(
        description="Fetch economic data from FRED"
    )
    parser.add_argument(
        "query", nargs="?", default=None,
        help="Search query for series"
    )
    parser.add_argument(
        "--series", help="Specific series ID to fetch"
    )
    parser.add_argument(
        "--observations", action="store_true",
        help="Get observations (requires --series)"
    )
    parser.add_argument(
        "--start", help="Start date (YYYY-MM-DD)"
    )
    parser.add_argument(
        "--limit", type=int, default=10,
        help="Max results for search (default: 10)"
    )
    args = parser.parse_args()

    if args.series and args.observations:
        result = get_observations(args.series, args.start)
    elif args.series:
        result = get_observations(args.series, args.start)
    elif args.query:
        result = search_series(args.query, args.limit)
    else:
        print("Error: provide a query or --series", file=sys.stderr)
        sys.exit(1)

    print(json.dumps(result, indent=2, ensure_ascii=False))


if __name__ == "__main__":
    main()
