"""
LeetCode Crawl4AI Scraper

Uses Crawl4AI (headless browser) to scrape a LeetCode profile page
for Recent Submissions and Problem Solving Stats (Easy/Med/Hard counts).

Falls back to GraphQL if Crawl4AI extraction yields no data.
"""

import json
import re
import sys
from typing import Any

from crawl4ai import AsyncWebCrawler, BrowserConfig, CrawlerRunConfig, CacheMode

from leetcode_scraper import get_leetcode_stats, get_user_solved_problems


async def scrape_leetcode_profile(username: str) -> dict[str, Any]:
    """
    Scrape a LeetCode user profile using Crawl4AI for JS-rendered content.
    Falls back to GraphQL API if the browser-based extraction fails.

    Returns a dict with:
      - username
      - stats: { easy, medium, hard, total }
      - languages: [{ name, count }]
      - recent_solved: [{ title, slug }]
      - markdown_summary: a formatted Markdown string
    """

    stats: dict[str, int] = {"easy": 0, "medium": 0, "hard": 0, "total": 0}
    languages: list[dict[str, Any]] = []
    recent_solved: list[dict[str, str]] = []

    crawl4ai_success = False

    # ── Step 1: Try Crawl4AI browser-based scrape ──────────────────────
    try:
        profile_url = f"https://leetcode.com/u/{username}/"
        browser_cfg = BrowserConfig(headless=True, viewport_width=1280, viewport_height=900)
        run_cfg = CrawlerRunConfig(
            cache_mode=CacheMode.BYPASS,
            wait_until="networkidle",
            page_timeout=30000,
            delay_before_return_html=3.0,
        )

        async with AsyncWebCrawler(config=browser_cfg) as crawler:
            result = await crawler.arun(url=profile_url, config=run_cfg)

        if result.success and result.markdown:
            md = result.markdown
            print(f"[leetcode-crawl4ai] Got {len(md)} chars of markdown for {username}", file=sys.stderr)

            # ── Extract Easy / Medium / Hard counts ──
            # LeetCode profile shows stats like "Easy 123/456"
            easy_match = re.search(r'Easy\s*\n?\s*(\d+)', md, re.IGNORECASE)
            med_match = re.search(r'Medium\s*\n?\s*(\d+)', md, re.IGNORECASE)
            hard_match = re.search(r'Hard\s*\n?\s*(\d+)', md, re.IGNORECASE)

            if easy_match:
                stats["easy"] = int(easy_match.group(1))
            if med_match:
                stats["medium"] = int(med_match.group(1))
            if hard_match:
                stats["hard"] = int(hard_match.group(1))
            stats["total"] = stats["easy"] + stats["medium"] + stats["hard"]

            # ── Extract language breakdown ──
            # The languages section shows: "Python3 45 problems solved"
            lang_pattern = re.findall(
                r'([\w#+]+)\s+(\d+)\s*problems?\s*solved',
                md, re.IGNORECASE,
            )
            if lang_pattern:
                languages = [
                    {"name": name, "count": int(count)}
                    for name, count in lang_pattern
                ]

            # ── Extract recent submissions ──
            # Recent submissions section shows problem titles as links
            recent_pattern = re.findall(
                r'\[([^\]]+)\]\(/problems/([^/)]+)',
                md,
            )
            if recent_pattern:
                seen = set()
                for title, slug in recent_pattern:
                    if slug not in seen and len(recent_solved) < 5:
                        seen.add(slug)
                        recent_solved.append({"title": title.strip(), "slug": slug.strip("/")})

            if stats["total"] > 0 or languages or recent_solved:
                crawl4ai_success = True

    except Exception as e:
        print(f"[leetcode-crawl4ai] Browser scrape failed: {e}", file=sys.stderr)

    # ── Step 2: Fallback to GraphQL if Crawl4AI yielded nothing ────────
    if not crawl4ai_success:
        print(f"[leetcode-crawl4ai] Falling back to GraphQL for {username}", file=sys.stderr)

        gql_stats = get_leetcode_stats(username)
        if not gql_stats.get("error"):
            solved = gql_stats.get("solvedStats", {})
            stats = {
                "easy": solved.get("Easy", 0),
                "medium": solved.get("Medium", 0),
                "hard": solved.get("Hard", 0),
                "total": solved.get("All", 0),
            }
            lang_list = gql_stats.get("languageStats", [])
            languages = [
                {"name": item["languageName"], "count": item["problemsSolved"]}
                for item in lang_list
                if item.get("problemsSolved", 0) > 0
            ]

    # ── Step 2b: ALWAYS fetch recent solved via GraphQL ────────────────
    # (Crawl4AI rarely extracts these from the JS-heavy profile page)
    if True: # Always refresh history to ensure uniqueness
        print(f"[leetcode-crawl4ai] Fetching recent solved via GraphQL for {username}", file=sys.stderr)
        gql_recent = get_user_solved_problems(username, limit=50)
        if not gql_recent.get("error"):
            # Clear any partial list and use the full history
            recent_solved = [] 
            for prob in gql_recent.get("solvedProblems", []):
                recent_solved.append({
                    "title": prob.get("title", "Unknown"),
                    "slug": prob.get("titleSlug", ""),
                })

    # ── Step 3: Build Markdown summary ─────────────────────────────────
    md_lines = [
        f"# LeetCode Profile: {username}",
        "",
        "## Problem Solving Stats",
        f"| Difficulty | Solved |",
        f"|------------|--------|",
        f"| Easy       | {stats['easy']}    |",
        f"| Medium     | {stats['medium']}  |",
        f"| Hard       | {stats['hard']}    |",
        f"| **Total**  | **{stats['total']}** |",
        "",
    ]

    if languages:
        # Sort by count desc
        languages.sort(key=lambda x: x["count"], reverse=True)
        md_lines.append("## Most Used Languages")
        for lang in languages:
            md_lines.append(f"- **{lang['name']}**: {lang['count']} problems")
        md_lines.append("")

    if recent_solved:
        md_lines.append("## Last 5 Solved Problems")
        for i, prob in enumerate(recent_solved[:5], 1):
            md_lines.append(f"{i}. [{prob['title']}](https://leetcode.com/problems/{prob['slug']}/)")
        md_lines.append("")

    if not languages and not recent_solved and stats["total"] == 0:
        md_lines.append("> ⚠️ Could not retrieve any data. The profile may be private or the username may be incorrect.")
        md_lines.append("")

    markdown_summary = "\n".join(md_lines)

    return {
        "username": username,
        "source": "crawl4ai" if crawl4ai_success else "graphql_fallback",
        "stats": stats,
        "languages": languages,
        "recent_solved": recent_solved,
        "markdown_summary": markdown_summary,
    }
