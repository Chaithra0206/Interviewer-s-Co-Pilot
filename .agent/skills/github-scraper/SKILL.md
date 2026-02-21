---
name: GitHubScraper
description: >
  This skill uses Crawl4AI to perform a deep-dive extraction of a GitHub
  repository's structure and core logic. It crawls the repo tree, targets
  key directories (src, app, lib), and extracts file names, folder
  structures, and the content of architectural files (package.json,
  README.md, auth/middleware/controller files). The output is a clean JSON
  "Architectural Blueprint" optimised for LLM consumption.
working_directory: /services/scraper
trigger_phrases:
  - Scrape GitHub
  - Analyze repo structure
  - Fetch codebase architecture
---

# GitHubScraper Skill

## Overview

Deep-crawl a public GitHub repository and produce a structured
**Architectural Blueprint** — a JSON object containing the folder tree,
key file contents, and metadata — ready to be consumed by downstream
LLM agents (e.g. the Gap Detection or Candidate Audit agents).

## Prerequisites

1. Python 3.10+ available on `PATH`.
2. Dependencies installed:

```bash
cd services/scraper
pip install -r requirements.txt
```

3. Crawl4AI browser backend initialised (first run only):

```bash
crawl4ai-setup
```

## Usage

### From the command line

```bash
python services/scraper/github_spider.py https://github.com/<owner>/<repo>
```

This prints a minified JSON blueprint to `stdout` and writes the full
output to `services/scraper/output/<repo>_blueprint.json`.

### From Python code

```python
import asyncio
from services.scraper.github_spider import crawl_github_repo

blueprint = asyncio.run(crawl_github_repo("https://github.com/owner/repo"))
print(blueprint)
```

### From the TypeScript frontend

The `lib/services/github-scraper.ts` service wraps Crawl4AI's REST API.
Call `fetchRepoStructure(url)` and pipe the markdown output through the
`data-mapper.ts` utility to get a clean `{ fileTree, coreLogicSnippets,
dependencies }` context object.

## Output Schema

```jsonc
{
  "repo": "owner/repo",
  "default_branch": "main",
  "tree": [
    {
      "path": "src/auth/middleware.ts",
      "type": "file",
      "content": "// summarised content …"
    }
    // …
  ],
  "key_files": {
    "package.json": { /* parsed JSON */ },
    "README.md": "# Project Title …"
  },
  "crawled_at": "2026-02-21T16:30:00Z"
}
```

## Configuration

| Environment Variable | Default | Description |
|---|---|---|
| `CRAWL4AI_CACHE_DIR` | `.crawl4ai_cache` | Local cache directory for repeat runs |
| `GITHUB_TOKEN` | *(none)* | Optional PAT for private repos / rate-limit avoidance |

## File Inventory

| File | Role |
|---|---|
| `github_spider.py` | Core crawling logic — three-phase async crawl |
| `requirements.txt` | Python dependencies (`crawl4ai>=0.4.0`) |
| `__init__.py` | Package marker |
