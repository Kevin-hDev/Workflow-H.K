#!/usr/bin/env python3
"""Fetch financial data from Finnhub. Free API key required (60 req/min)."""
import json
import os
import sys
import urllib.request
import urllib.parse
import urllib.error
import argparse
from datetime import datetime, timedelta


BASE_URL = "https://finnhub.io/api/v1"


def get_api_key():
    """Get Finnhub API key from environment."""
    key = os.environ.get("FINNHUB_API_KEY", "")
    if not key:
        print("Error: FINNHUB_API_KEY not set", file=sys.stderr)
        print("Get free: finnhub.io/register", file=sys.stderr)
        sys.exit(1)
    return key


def finnhub_request(endpoint, params=None):
    """Make a request to Finnhub API."""
    if params is None:
        params = {}
    params["token"] = get_api_key()
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


def get_profile(symbol):
    """Get company profile."""
    data = finnhub_request("stock/profile2", {"symbol": symbol.upper()})
    if not data:
        return {"error": "Symbol not found"}
    return {
        "name": data.get("name", ""),
        "ticker": data.get("ticker", ""),
        "country": data.get("country", ""),
        "currency": data.get("currency", ""),
        "exchange": data.get("exchange", ""),
        "industry": data.get("finnhubIndustry", ""),
        "market_cap": data.get("marketCapitalization", 0),
        "ipo_date": data.get("ipo", ""),
        "url": data.get("weburl", ""),
    }


def get_company_news(symbol, from_date=None, to_date=None):
    """Get company news via /company-news (supports date range)."""
    today = datetime.now().strftime("%Y-%m-%d")
    week_ago = (datetime.now() - timedelta(days=7)).strftime("%Y-%m-%d")

    params = {
        "symbol": symbol.upper(),
        "from": from_date or week_ago,
        "to": to_date or today,
    }
    data = finnhub_request("company-news", params)
    if not isinstance(data, list):
        return {"count": 0, "articles": []}

    articles = []
    for art in data[:30]:
        articles.append({
            "headline": art.get("headline", ""),
            "source": art.get("source", ""),
            "url": art.get("url", ""),
            "datetime": art.get("datetime", 0),
            "summary": art.get("summary", "")[:200],
        })
    return {"count": len(articles), "articles": articles}


def get_market_news(keyword=None):
    """Get general market news, optionally filtered by keyword."""
    data = finnhub_request("news", {"category": "general"})
    if not isinstance(data, list):
        return {"count": 0, "articles": []}

    # Split keyword into words — all must be present (any order)
    words = keyword.lower().split() if keyword else []

    articles = []
    for art in data:
        if words:
            text = (
                art.get("headline", "") + " " + art.get("summary", "")
            ).lower()
            if not all(w in text for w in words):
                continue
        articles.append({
            "headline": art.get("headline", ""),
            "source": art.get("source", ""),
            "url": art.get("url", ""),
            "datetime": art.get("datetime", 0),
            "summary": art.get("summary", "")[:200],
        })
    return {"count": len(articles), "articles": articles}


def get_metrics(symbol):
    """Get basic financial metrics."""
    data = finnhub_request("stock/metric", {
        "symbol": symbol.upper(),
        "metric": "all",
    })
    metric = data.get("metric", {})
    if not metric:
        return {"error": "Metrics not available"}
    return {
        "symbol": symbol.upper(),
        "pe_ratio": metric.get("peBasicExclExtraTTM"),
        "pb_ratio": metric.get("pbQuarterly"),
        "revenue_growth": metric.get("revenueGrowthQuarterlyYoy"),
        "eps_growth": metric.get("epsGrowthQuarterlyYoy"),
        "dividend_yield": metric.get("dividendYieldIndicatedAnnual"),
        "market_cap": metric.get("marketCapitalization"),
        "52w_high": metric.get("52WeekHigh"),
        "52w_low": metric.get("52WeekLow"),
        "beta": metric.get("beta"),
    }


def main():
    parser = argparse.ArgumentParser(
        description="Fetch financial data from Finnhub"
    )
    parser.add_argument("--profile", help="Company symbol for profile")
    parser.add_argument(
        "--news", metavar="SYMBOL",
        help="Company news by stock symbol (MSFT, AAPL, TMV.DE)"
    )
    parser.add_argument(
        "--market-news", nargs="?", const=None, default=False,
        metavar="KEYWORD",
        help="General market news, optionally filtered by keyword"
    )
    parser.add_argument("--metrics", help="Company symbol for metrics")
    parser.add_argument(
        "--from", dest="from_date",
        help="Start date (YYYY-MM-DD), default: 7 days ago"
    )
    parser.add_argument(
        "--to", dest="to_date",
        help="End date (YYYY-MM-DD), default: today"
    )
    args = parser.parse_args()

    if args.profile:
        result = get_profile(args.profile)
    elif args.news:
        result = get_company_news(args.news, args.from_date, args.to_date)
    elif args.market_news is not False:
        result = get_market_news(args.market_news)
    elif args.metrics:
        result = get_metrics(args.metrics)
    else:
        print(
            "Error: --profile, --news SYMBOL, --market-news, "
            "or --metrics required",
            file=sys.stderr,
        )
        sys.exit(1)

    print(json.dumps(result, indent=2, ensure_ascii=False))


if __name__ == "__main__":
    main()
