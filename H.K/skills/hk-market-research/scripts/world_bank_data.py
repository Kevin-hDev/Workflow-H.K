#!/usr/bin/env python3
"""Fetch development indicators from World Bank. Free, no API key."""
import json
import sys
import urllib.request
import urllib.parse
import urllib.error
import argparse


BASE_URL = "https://api.worldbank.org/v2"


def wb_request(endpoint, params=None):
    """Make a request to World Bank API."""
    if params is None:
        params = {}
    params["format"] = "json"
    if "per_page" not in params:
        params["per_page"] = "100"
    url = f"{BASE_URL}/{endpoint}?{urllib.parse.urlencode(params)}"

    try:
        req = urllib.request.Request(url, headers={
            "User-Agent": "MarketResearchCLI/1.0"
        })
        with urllib.request.urlopen(req, timeout=30) as resp:
            data = json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        print(f"HTTP error {e.code}: {e.reason}", file=sys.stderr)
        sys.exit(1)
    except urllib.error.URLError as e:
        print(f"Network error: {e.reason}", file=sys.stderr)
        sys.exit(1)

    if not isinstance(data, list) or len(data) < 2:
        return []
    return data[1]


def get_indicator(indicator_id, country="all", start_year=None):
    """Get indicator data for a country."""
    endpoint = f"country/{country}/indicator/{indicator_id}"
    params = {}
    if start_year:
        params["date"] = f"{start_year}:2026"

    raw = wb_request(endpoint, params)
    if not raw:
        return {"indicator": indicator_id, "count": 0, "data": []}

    results = []
    for entry in raw:
        if entry.get("value") is not None:
            results.append({
                "country": entry.get("country", {}).get("value", ""),
                "country_code": entry.get("countryiso3code", ""),
                "year": entry.get("date", ""),
                "value": entry.get("value"),
            })
    results.sort(key=lambda x: x["year"], reverse=True)
    return {
        "indicator": indicator_id,
        "count": len(results),
        "data": results,
    }


def search_indicators(query):
    """Search for indicators by keyword."""
    raw = wb_request("indicator", {"source": "2", "per_page": "1000"})
    if not raw:
        return {"count": 0, "indicators": []}

    q = query.lower()
    matches = []
    for ind in raw:
        name = ind.get("name", "").lower()
        desc = ind.get("sourceNote", "").lower()
        if q in name or q in desc:
            matches.append({
                "id": ind.get("id", ""),
                "name": ind.get("name", ""),
            })
    matches = matches[:20]
    return {"count": len(matches), "indicators": matches}


def main():
    parser = argparse.ArgumentParser(
        description="Fetch World Bank development indicators"
    )
    parser.add_argument(
        "--indicator", help="Indicator ID (e.g. NY.GDP.MKTP.CD)"
    )
    parser.add_argument(
        "--country", default="all",
        help="Country code(s) separated by ; (e.g. FR;US;CN)"
    )
    parser.add_argument("--start", help="Start year (e.g. 2020)")
    parser.add_argument("--search", help="Search indicators by keyword")
    args = parser.parse_args()

    if args.search:
        result = search_indicators(args.search)
    elif args.indicator:
        result = get_indicator(args.indicator, args.country, args.start)
    else:
        print("Error: --indicator or --search required", file=sys.stderr)
        sys.exit(1)

    print(json.dumps(result, indent=2, ensure_ascii=False))


if __name__ == "__main__":
    main()
