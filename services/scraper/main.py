"""
FastAPI wrapper for the GitHub Spider service.

POST /crawl  →  accepts { "repo_url": "...", "branch": "..." }
             ←  returns the full Architectural Blueprint JSON
"""

import traceback
from typing import Optional

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, HttpUrl

from github_spider import crawl_github_repo
from leetcode_scraper import get_leetcode_stats, get_user_solved_problems, get_clone_data

MOCK_PUBLIC_DEMO_DNA = {
    "titleSlug": "two-sum",
    "content": "Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.\n\nConstraints:\n2 <= nums.length <= 10^4\n-10^9 <= nums[i] <= 10^9\n-10^9 <= target <= 10^9\nOnly one valid answer exists.",
    "topicTags": ["Array", "Hash Table"],
    "hints": [
        "A really simple way would be to check every pair of numbers...",
        "The second train of thought is, without changing the array, can we use additional space somehow? Like maybe a hash map to speed up the search?"
    ],
    "sampleTestCase": "[2,7,11,15]\n9",
    "codeSnippets": [
        {"langSlug": "python3", "code": "class Solution:\n    def twoSum(self, nums: List[int], target: int) -> List[int]:\n        "},
        {"langSlug": "java", "code": "class Solution {\n    public int[] twoSum(int[] nums, int target) {\n        \n    }\n}"}
    ]
}

# ---------------------------------------------------------------------------
# App
# ---------------------------------------------------------------------------

app = FastAPI(
    title="GitHub Spider Service",
    description="Deep-crawl a GitHub repo and return an Architectural Blueprint.",
    version="1.0.0",
)


# ---------------------------------------------------------------------------
# Request / Response models
# ---------------------------------------------------------------------------

class CrawlRequest(BaseModel):
    repo_url: HttpUrl
    branch: Optional[str] = None


class CrawlResponse(BaseModel):
    """Mirrors the blueprint dict — kept loose so the spider can evolve."""
    repo: str
    url: str
    branch: str
    file_tree: list[str]
    target_directory_files: list[str]
    key_files: dict
    errors: dict = {}
    stats: dict
    debug: dict | None = None


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@app.get("/health")
async def health():
    return {"status": "ok"}


@app.post("/crawl", response_model=CrawlResponse)
async def crawl(req: CrawlRequest):
    """Run the GitHub Spider and return the Architectural Blueprint."""
    try:
        blueprint = await crawl_github_repo(
            repo_url=str(req.repo_url),
            branch=req.branch,
        )
        return blueprint

    except Exception as exc:
        traceback.print_exc()
        raise HTTPException(
            status_code=500,
            detail={
                "error": "Crawl failed",
                "message": str(exc),
            },
        )

@app.get("/user-audit/{username}")
async def user_audit(username: str):
    """
    Master Integration Pipeline:
    1. Fetches User overall stats (ranking, languages, skill counts).
    2. Fetches the 'Solved List' (last 5 accepted problems).
    3. Fetches the deep 'Problem DNA/Clone Pack' for the most recent problem.
    4. Combines them into a single Technical Audit Report JSON.
    """
    try:
        # 1. Fetch User Stats
        user_stats = get_leetcode_stats(username)
        if user_stats.get("error"):
            raise HTTPException(status_code=404, detail=user_stats)

        # 2. Fetch Solved List (limit 5)
        solved_data = get_user_solved_problems(username, limit=5)
        if solved_data.get("error"):
            # Don't fail the whole request if solved list is just private
            solved_list = []
        else:
            solved_list = solved_data.get("solvedProblems", [])

        # 3. Extract Problem DNA for the latest problem
        latest_dna = None
        if solved_list:
            latest_slug = solved_list[0].get("titleSlug")
            if latest_slug:
                dna_data = get_clone_data(latest_slug)
                if not dna_data.get("error"):
                    # Only keep Python3 and Java snippets as requested
                    raw_snippets = dna_data.get("codeSnippets") or []
                    filtered_snippets = [
                        snip for snip in raw_snippets
                        if snip.get("langSlug") in ("python3", "java")
                    ]
                    dna_data["codeSnippets"] = filtered_snippets
                    latest_dna = dna_data

        # Fallback to Mock DNA for zero/private solved list instances
        if not latest_dna:
            latest_dna = MOCK_PUBLIC_DEMO_DNA
            latest_dna["_is_mock"] = True

        # 4. Construct the Developer-Friendly Report
        return {
            "audit_type": "LeetCode Technical Audit",
            "candidate": username,
            "overall_stats": {
                "profile": user_stats.get("profile"),
                "solvedStats": user_stats.get("solvedStats"),
                "languageStats": user_stats.get("languageStats"),
                "skillStats": user_stats.get("skillStats"),
            },
            "recent_activity": {
                "recent_solved": solved_list
            },
            "GENERATION_SEED": latest_dna
        }

    except HTTPException:
        raise
    except Exception as exc:
        traceback.print_exc()
        raise HTTPException(
            status_code=500,
            detail={
                "error": "Master Integration failed",
                "message": str(exc)
            }
        )

