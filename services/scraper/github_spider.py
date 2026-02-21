"""
GitHub Spider — Deep-crawl a GitHub repository and produce an Architectural Blueprint.

Strategy (in order of reliability):
  1. GitHub REST API  — instant full tree via /git/trees?recursive=1
  2. Direct raw.githubusercontent.com — fetch key file contents
  3. Crawl4AI web-crawl — fallback for when API is rate-limited

Usage:
    python github_spider.py <repo_url>

Example:
    python github_spider.py https://github.com/vercel/next.js
"""

import asyncio
import json
import os
import re
import sys
from typing import Any
from urllib.parse import urljoin

try:
    import aiohttp
    HAS_AIOHTTP = True
except ImportError:
    HAS_AIOHTTP = False

from crawl4ai import AsyncWebCrawler, BrowserConfig, CrawlerRunConfig, CacheMode
from crawl4ai.extraction_strategy import JsonCssExtractionStrategy

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

# Directories we want to deep-crawl for architectural insight
TARGET_DIRS = {"src", "app", "lib", "backend", "frontend"}

# Files always worth capturing regardless of directory
KEY_FILES = {"package.json", "readme.md", "tsconfig.json", "next.config.js",
             "next.config.ts", "next.config.mjs", ".env.example",
             "docker-compose.yml", "dockerfile", "requirements.txt",
             "pyproject.toml", "manage.py", "cargo.toml", "go.mod"}

# Filename keywords that signal architectural importance
KEY_KEYWORDS = {"auth", "middleware", "controller", "route", "service",
                "provider", "guard", "interceptor", "module", "config",
                "database", "schema", "model", "migration", "api"}

# Maximum concurrent tasks
CONCURRENCY_LIMIT = 8

# Maximum files to fetch content for
MAX_KEY_FILES = 60

# Branches to try in order
CANDIDATE_BRANCHES = ["main", "master", "develop", "dev"]

# GitHub API token (optional, avoids rate limiting)
GITHUB_TOKEN = os.environ.get("GITHUB_TOKEN", "")

# ---------------------------------------------------------------------------
# Path cleaning
# ---------------------------------------------------------------------------

_UI_NOISE_PREFIXES = [
    "Skip to content/", "Skip to content",
    "Navigation Menu/", "Navigation Menu",
    "Go to file/", "Go to file",
    "Search syntax tips/", "Search syntax tips",
    "Footer/", "Footer",
]

_UI_NOISE_PATTERNS = re.compile(
    r"^(Skip to content|Navigation Menu|Go to file|Footer|Search syntax tips)"
    r"[/\\\s]*",
    re.IGNORECASE,
)


def _clean_path(path: str) -> str:
    """Strip GitHub UI noise from extracted file paths."""
    cleaned = path.strip()
    for prefix in _UI_NOISE_PREFIXES:
        if cleaned.startswith(prefix):
            cleaned = cleaned[len(prefix):]
    cleaned = _UI_NOISE_PATTERNS.sub("", cleaned)
    cleaned = cleaned.strip().strip("/").strip()
    parts = cleaned.split("/")
    filtered = [p for p in parts if p and p.lower() not in {
        "skip to content", "navigation menu", "go to file", "footer",
        "actions", "autofix", "search syntax tips",
    }]
    return "/".join(filtered)


def _is_valid_path(path: str) -> bool:
    """Return True if *path* looks like a real file/directory path."""
    if not path:
        return False
    if ";" in path:
        return False
    for component in path.split("/"):
        if component.count(" ") > 3:
            return False
    if re.match(r"^[A-Z][a-z]+ .{20,}", path):
        return False
    return True


def _is_valid_content(content: str) -> bool:
    """Return True if content looks like actual file content, not a 404."""
    if not content or not content.strip():
        return False
    trimmed = content.strip()[:200].lower()
    if trimmed.startswith("404"):
        return False
    if "404: not found" in trimmed:
        return False
    if "<html" in trimmed and "not found" in trimmed:
        return False
    return True


def _normalise_repo_url(url: str) -> str:
    """Ensure the URL points to a GitHub repo root (no trailing slash)."""
    url = url.strip().rstrip("/")
    if url.endswith(".git"):
        url = url[:-4]
    url = re.sub(r"/tree/[^/]+.*$", "", url)
    return url


def _is_key_file(filename: str) -> bool:
    """Check whether *filename* is architecturally important."""
    lower = filename.lower()
    if lower in KEY_FILES:
        return True
    return any(kw in lower for kw in KEY_KEYWORDS)


def _is_in_target_dir(filepath: str) -> bool:
    """Check if a file is inside a target directory."""
    parts = filepath.lower().split("/")
    return any(p in TARGET_DIRS for p in parts)


def _parse_owner_repo(repo_url: str) -> tuple[str, str]:
    """Extract (owner, repo) from a GitHub URL."""
    parts = repo_url.rstrip("/").split("/")
    return parts[-2], parts[-1]


# ---------------------------------------------------------------------------
# GitHub API + raw.githubusercontent.com helpers
# ---------------------------------------------------------------------------

async def _detect_branch(owner: str, repo: str) -> str:
    """Detect the default branch by trying to fetch README.md via raw URLs."""
    if not HAS_AIOHTTP:
        return "main"

    async with aiohttp.ClientSession() as session:
        for branch in CANDIDATE_BRANCHES:
            url = f"https://raw.githubusercontent.com/{owner}/{repo}/{branch}/README.md"
            try:
                async with session.head(url, timeout=aiohttp.ClientTimeout(total=10)) as resp:
                    if resp.status == 200:
                        print(f"[spider] Detected branch: {branch}", file=sys.stderr)
                        return branch
            except Exception:
                continue

    print("[spider] Could not detect branch, defaulting to 'main'", file=sys.stderr)
    return "main"


async def _fetch_tree_via_api(owner: str, repo: str, branch: str) -> list[dict] | None:
    """Fetch the full file tree using the GitHub REST API.

    Returns a list of {path, type, size} dicts, or None on failure.
    """
    if not HAS_AIOHTTP:
        return None

    url = f"https://api.github.com/repos/{owner}/{repo}/git/trees/{branch}?recursive=1"
    headers = {"Accept": "application/vnd.github.v3+json"}
    if GITHUB_TOKEN:
        headers["Authorization"] = f"token {GITHUB_TOKEN}"

    async with aiohttp.ClientSession() as session:
        try:
            async with session.get(url, headers=headers, timeout=aiohttp.ClientTimeout(total=30)) as resp:
                if resp.status != 200:
                    print(f"[spider] GitHub API returned {resp.status} for tree", file=sys.stderr)
                    return None
                data = await resp.json()
                tree = data.get("tree", [])
                print(f"[spider] GitHub API returned {len(tree)} entries", file=sys.stderr)
                return tree
        except Exception as e:
            print(f"[spider] GitHub API error: {e}", file=sys.stderr)
            return None


async def _fetch_raw_content(
    owner: str, repo: str, branch: str, filepath: str,
    session: aiohttp.ClientSession | None = None,
) -> str:
    """Fetch a file's raw content from raw.githubusercontent.com."""
    clean_fp = _clean_path(filepath)
    if not clean_fp or not _is_valid_path(clean_fp):
        return ""

    url = f"https://raw.githubusercontent.com/{owner}/{repo}/{branch}/{clean_fp}"

    close_session = False
    if session is None:
        if not HAS_AIOHTTP:
            return ""
        session = aiohttp.ClientSession()
        close_session = True

    try:
        async with session.get(url, timeout=aiohttp.ClientTimeout(total=15)) as resp:
            if resp.status != 200:
                return ""
            content = await resp.text()
            if not _is_valid_content(content):
                return ""
            return content[:8192]
    except Exception:
        return ""
    finally:
        if close_session:
            await session.close()


# ---------------------------------------------------------------------------
# CSS Extraction schemas (for Crawl4AI fallback)
# ---------------------------------------------------------------------------

FILE_TREE_SCHEMA = {
    "name": "github_file_tree",
    "baseSelector": "table[aria-labelledby] tbody tr.react-directory-row",
    "fields": [
        {
            "name": "item_type",
            "selector": "svg.icon-directory, svg.octicon-file-directory-fill",
            "type": "attribute",
            "attribute": "aria-label",
            "default": "file",
        },
        {
            "name": "name",
            "selector": "td.react-directory-row-name-cell-large-screen a, "
                        "td.react-directory-row-name-cell-large-screen .Link--primary",
            "type": "text",
        },
        {
            "name": "link",
            "selector": "td.react-directory-row-name-cell-large-screen a, "
                        "td.react-directory-row-name-cell-large-screen .Link--primary",
            "type": "attribute",
            "attribute": "href",
            "default": "",
        },
    ],
}

FILE_TREE_SCHEMA_ALT = {
    "name": "github_file_tree_alt",
    "baseSelector": "div[role='grid'] div[role='row'].Box-row",
    "fields": [
        {
            "name": "item_type",
            "selector": "svg.octicon-file-directory-fill, svg.octicon-file-directory-open-fill",
            "type": "attribute",
            "attribute": "aria-label",
            "default": "file",
        },
        {
            "name": "name",
            "selector": "a.Link--primary, a.js-navigation-open",
            "type": "text",
        },
        {
            "name": "link",
            "selector": "a.Link--primary, a.js-navigation-open",
            "type": "attribute",
            "attribute": "href",
            "default": "",
        },
    ],
}


# ---------------------------------------------------------------------------
# Core spider class
# ---------------------------------------------------------------------------

class GitHubSpider:
    """Async spider that deep-crawls a GitHub repository."""

    def __init__(self, repo_url: str, branch: str | None = None):
        self.repo_url = _normalise_repo_url(repo_url)
        self.owner, self.repo = _parse_owner_repo(self.repo_url)
        self._explicit_branch = branch
        self.branch = branch or "main"  # will be auto-detected
        self._semaphore = asyncio.Semaphore(CONCURRENCY_LIMIT)

        # Result accumulators
        self.file_tree: list[str] = []
        self.key_files: dict[str, dict[str, str]] = {}
        self._visited: set[str] = set()
        self._debug_html: str = ""

    # ----- main orchestration -----

    async def crawl(self) -> dict:
        """Execute the full crawl and return the architectural blueprint."""
        print(f"[spider] Starting crawl of {self.repo_url}", file=sys.stderr)

        # Step 0 — detect the default branch
        if not self._explicit_branch:
            self.branch = await _detect_branch(self.owner, self.repo)

        # Step 1 — try GitHub API first (most reliable)
        api_tree = await _fetch_tree_via_api(self.owner, self.repo, self.branch)

        if api_tree and len(api_tree) > 0:
            print(f"[spider] Using GitHub API tree ({len(api_tree)} entries)", file=sys.stderr)
            await self._process_api_tree(api_tree)
        else:
            # Step 2 — fallback to Crawl4AI web crawling
            print("[spider] API unavailable, falling back to web crawl …", file=sys.stderr)
            await self._crawl_via_web()

        # Step 3 — fetch content for key files
        if self.key_files:
            print(f"[spider] Fetching content for {len(self.key_files)} key file(s) …", file=sys.stderr)
            await self._fetch_all_key_file_contents()

        # Step 4 — verify we got results
        blueprint = self._build_blueprint()
        files_found = blueprint["stats"]["total_key_files_found"]

        if files_found == 0:
            print("[spider] WARNING: 0 key files found!", file=sys.stderr)
            if self._debug_html:
                blueprint["debug"] = {
                    "message": "No files found. Raw HTML excerpt from crawl below.",
                    "html_excerpt": self._debug_html[:5000],
                }

        return blueprint

    # ----- API-based processing -----

    async def _process_api_tree(self, tree: list[dict]) -> None:
        """Process the file tree returned by the GitHub API."""
        for entry in tree:
            path = entry.get("path", "")
            entry_type = entry.get("type", "")  # "blob" or "tree"

            clean = _clean_path(path)
            if not clean or not _is_valid_path(clean):
                continue

            if entry_type == "blob":
                self.file_tree.append(clean)
                if _is_key_file(clean.split("/")[-1]) or _is_in_target_dir(clean):
                    if len(self.key_files) < MAX_KEY_FILES:
                        self.key_files[clean] = {"path": clean, "content": ""}

        # Also register well-known root files that might not match keywords
        for entry in tree:
            path = entry.get("path", "")
            if entry.get("type") == "blob" and "/" not in path:
                lower = path.lower()
                if lower in KEY_FILES and path not in self.key_files:
                    self.key_files[path] = {"path": path, "content": ""}

    # ----- content fetching -----

    async def _fetch_all_key_file_contents(self) -> None:
        """Fetch content for all registered key files in parallel."""
        if not HAS_AIOHTTP:
            print("[spider] aiohttp not installed, skipping content fetch", file=sys.stderr)
            return

        paths = list(self.key_files.keys())

        async with aiohttp.ClientSession() as session:
            tasks = [
                self._fetch_single_content(session, p)
                for p in paths
            ]
            results = await asyncio.gather(*tasks, return_exceptions=True)

            for path, result in zip(paths, results):
                if isinstance(result, str) and result:
                    self.key_files[path]["content"] = result

    async def _fetch_single_content(self, session: aiohttp.ClientSession, filepath: str) -> str:
        """Fetch content for a single file, trying multiple branches."""
        clean_fp = _clean_path(filepath)
        if not clean_fp or not _is_valid_path(clean_fp):
            return ""

        # Try primary branch first, then fallbacks
        branches = [self.branch]
        for b in CANDIDATE_BRANCHES:
            if b != self.branch:
                branches.append(b)

        async with self._semaphore:
            for branch in branches:
                content = await _fetch_raw_content(
                    self.owner, self.repo, branch, clean_fp, session
                )
                if content:
                    return content

        return ""

    # ----- Crawl4AI web-crawl fallback -----

    async def _crawl_via_web(self) -> None:
        """Fallback: use Crawl4AI to crawl the GitHub web UI."""
        browser_cfg = BrowserConfig(headless=True, viewport_width=1280, viewport_height=900)

        async with AsyncWebCrawler(config=browser_cfg) as crawler:
            url = f"{self.repo_url}/tree/{self.branch}"
            entries = await self._extract_listing(crawler, url)

            if not entries:
                # Try alternative branch
                for alt_branch in CANDIDATE_BRANCHES:
                    if alt_branch != self.branch:
                        alt_url = f"{self.repo_url}/tree/{alt_branch}"
                        entries = await self._extract_listing(crawler, alt_url)
                        if entries:
                            self.branch = alt_branch
                            break

            for entry in entries:
                raw_name = entry.get("name", "").strip()
                link = entry.get("link", "")
                item_type = entry.get("item_type", "file")

                name = _clean_path(raw_name)
                if not name or not _is_valid_path(name):
                    continue

                is_dir = "directory" in str(item_type).lower() or "/tree/" in link

                if is_dir:
                    self.file_tree.append(name + "/")
                    # Recurse into target dirs
                    if name.lower() in TARGET_DIRS:
                        abs_link = self._resolve_link(link)
                        sub_entries = await self._walk_web_directory(
                            crawler, abs_link, name, depth=1
                        )
                        self.file_tree.extend(sub_entries)
                else:
                    self.file_tree.append(name)
                    if _is_key_file(name) and len(self.key_files) < MAX_KEY_FILES:
                        self.key_files[name] = {"path": name, "content": ""}

    async def _walk_web_directory(
        self, crawler: AsyncWebCrawler, url: str, prefix: str, depth: int
    ) -> list[str]:
        """Recursively walk a directory via web crawl."""
        if depth > 4:
            return []

        entries = await self._extract_listing(crawler, url)
        paths: list[str] = []

        for entry in entries:
            raw_name = entry.get("name", "").strip()
            link = entry.get("link", "")
            item_type = entry.get("item_type", "file")

            name = _clean_path(raw_name)
            if not name or not _is_valid_path(name):
                continue

            full_path = f"{prefix}/{name}"
            is_dir = "directory" in str(item_type).lower() or "/tree/" in link

            if is_dir:
                paths.append(full_path + "/")
                abs_link = self._resolve_link(link)
                sub = await self._walk_web_directory(crawler, abs_link, full_path, depth + 1)
                paths.extend(sub)
            else:
                paths.append(full_path)
                if _is_key_file(name) and len(self.key_files) < MAX_KEY_FILES:
                    self.key_files[full_path] = {"path": full_path, "content": ""}

        return paths

    async def _extract_listing(self, crawler: AsyncWebCrawler, url: str) -> list[dict]:
        """Crawl a GitHub directory URL and return entries."""
        if url in self._visited:
            return []
        self._visited.add(url)

        run_cfg = CrawlerRunConfig(
            cache_mode=CacheMode.ENABLED,
            wait_until="networkidle",
            page_timeout=60000,
            exclude_external_links=True,
            excluded_tags=["script", "style", "footer", "nav"],
            extraction_strategy=JsonCssExtractionStrategy(FILE_TREE_SCHEMA),
        )

        async with self._semaphore:
            result = await crawler.arun(url=url, config=run_cfg)

        entries: list[dict] = []
        if result.success and result.extracted_content:
            try:
                data = json.loads(result.extracted_content)
                if isinstance(data, list) and len(data) > 0:
                    entries = data if isinstance(data[0], dict) else (
                        data[0] if isinstance(data[0], list) else []
                    )
            except (json.JSONDecodeError, IndexError, TypeError):
                pass

        # Fallback: alt schema
        if not entries:
            run_cfg_alt = CrawlerRunConfig(
                cache_mode=CacheMode.ENABLED,
                wait_until="networkidle",
                page_timeout=60000,
                exclude_external_links=True,
                excluded_tags=["script", "style", "footer", "nav"],
                extraction_strategy=JsonCssExtractionStrategy(FILE_TREE_SCHEMA_ALT),
            )
            async with self._semaphore:
                result_alt = await crawler.arun(url=url, config=run_cfg_alt)
            if result_alt.success and result_alt.extracted_content:
                try:
                    data = json.loads(result_alt.extracted_content)
                    if isinstance(data, list) and len(data) > 0:
                        entries = data if isinstance(data[0], dict) else (
                            data[0] if isinstance(data[0], list) else []
                        )
                except (json.JSONDecodeError, IndexError, TypeError):
                    pass

        # Fallback: parse markdown
        if not entries and result.success and result.markdown:
            entries = self._parse_markdown_listing(result.markdown)

        # Save debug HTML if still no entries
        if not entries and result.success:
            self._debug_html = (result.cleaned_html or result.html or "")[:5000]

        return entries

    def _parse_markdown_listing(self, md: str) -> list[dict]:
        """Best-effort extraction from markdown output."""
        entries = []
        for match in re.finditer(r'\[([^\]]+)\]\(([^)]+)\)', md):
            name, href = match.group(1).strip(), match.group(2).strip()
            if not name or name.startswith("#"):
                continue
            if not _is_valid_path(name):
                continue
            if "github.com" not in href and not href.startswith("/"):
                continue
            is_dir = "/tree/" in href
            entries.append({
                "name": name,
                "link": href,
                "item_type": "Directory" if is_dir else "file",
            })
        return entries

    def _resolve_link(self, href: str) -> str:
        """Resolve a possibly-relative GitHub href."""
        if href.startswith("http"):
            return href
        return urljoin("https://github.com/", href.lstrip("/"))

    # ----- output formatting -----

    def _build_blueprint(self) -> dict:
        """Assemble the final Architectural Blueprint JSON."""
        owner_repo = f"{self.owner}/{self.repo}"

        # Only keep files with valid, verified content
        valid_key_files = {
            _clean_path(path): {
                "path": _clean_path(info["path"]),
                "content": info["content"][:4096],
            }
            for path, info in self.key_files.items()
            if info.get("content") and _is_valid_content(info["content"])
        }

        errored_files = [
            _clean_path(path)
            for path, info in self.key_files.items()
            if not info.get("content") or not _is_valid_content(info.get("content", ""))
        ]

        # Clean all file tree paths
        clean_tree = sorted(set(
            _clean_path(p) for p in self.file_tree
            if _clean_path(p) and _is_valid_path(_clean_path(p))
        ))

        # Identify target directory files
        target_dir_files = [f for f in clean_tree if _is_in_target_dir(f)]

        blueprint: dict[str, Any] = {
            "repo": owner_repo,
            "url": self.repo_url,
            "branch": self.branch,
            "file_tree": clean_tree,
            "target_directory_files": target_dir_files,
            "key_files": valid_key_files,
            "errors": {
                "files_not_found": errored_files,
            } if errored_files else {},
            "stats": {
                "total_files_in_tree": len(clean_tree),
                "files_in_target_dirs": len(target_dir_files),
                "total_key_files_found": len(self.key_files),
                "total_key_files_with_content": len(valid_key_files),
                "files_failed": len(errored_files),
                "directories_crawled": len(self._visited),
            },
        }
        return blueprint


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

async def crawl_github_repo(repo_url: str, branch: str | None = None) -> dict:
    """
    Deep-crawl a GitHub repository and return an Architectural Blueprint.

    Args:
        repo_url: Full GitHub URL (e.g. "https://github.com/vercel/next.js").
        branch:   Branch to crawl (auto-detected if None).

    Returns:
        A dict containing repo metadata, file tree, and key file contents.
    """
    spider = GitHubSpider(repo_url, branch=branch)
    return await spider.crawl()


# ---------------------------------------------------------------------------
# CLI entry point
# ---------------------------------------------------------------------------

def main() -> None:
    if len(sys.argv) < 2:
        print("Usage: python github_spider.py <repo_url> [branch]", file=sys.stderr)
        sys.exit(1)

    repo_url = sys.argv[1]
    branch = sys.argv[2] if len(sys.argv) > 2 else None

    blueprint = asyncio.run(crawl_github_repo(repo_url, branch))

    # Output minified JSON to stdout (write as UTF-8 bytes for Windows compat)
    output = json.dumps(blueprint, separators=(",", ":"), ensure_ascii=False)
    sys.stdout.buffer.write(output.encode("utf-8"))
    sys.stdout.buffer.write(b"\n")


if __name__ == "__main__":
    main()
