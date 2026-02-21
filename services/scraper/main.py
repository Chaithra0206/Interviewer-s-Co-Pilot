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
