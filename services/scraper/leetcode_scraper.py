"""
LeetCode Scraper Service

Fetches the candidate's actual stats and consistency data from the LeetCode GraphQL API.
"""

import json
import requests
from typing import Dict, Any
from bs4 import BeautifulSoup

LEETCODE_GRAPHQL_URL = "https://leetcode.com/graphql"

# This unified GraphQL query grabs the profile, solved counts (by difficulty),
# language breakdown, skills/tags, and the raw submission calendar map
GRAPHQL_QUERY = """
query getLeetCodeProfile($username: String!) {
  matchedUser(username: $username) {
    username
    githubUrl
    twitterUrl
    linkedinUrl
    profile {
      realName
      userAvatar
      ranking
      websites
    }
    submitStatsGlobal {
      acSubmissionNum {
        difficulty
        count
      }
    }
    tagProblemCounts {
      advanced {
        tagName
        problemsSolved
      }
      intermediate {
        tagName
        problemsSolved
      }
      fundamental {
        tagName
        problemsSolved
      }
    }
    languageProblemCount {
      languageName
      problemsSolved
    }
  }
}
"""

GRAPHQL_PROBLEM_QUERY = """
query getQuestionDetail($titleSlug: String!) {
  question(titleSlug: $titleSlug) {
    questionId
    title
    titleSlug
    content
    difficulty
    stats
    hints
    exampleTestcases
    topicTags {
      name
    }
  }
}
"""

GRAPHQL_SOLVED_PROBLEMS_QUERY = """
query recentAcSubmissions($username: String!, $limit: Int!) {
  recentAcSubmissionList(username: $username, limit: $limit) {
    title
    titleSlug
    timestamp
  }
}
"""

GRAPHQL_CLONE_QUERY = """
query getQuestionCloneData($titleSlug: String!) {
  question(titleSlug: $titleSlug) {
    content
    exampleTestcases
    hints
    topicTags {
      name
    }
    codeSnippets {
      lang
      langSlug
      code
    }
  }
}
"""

def get_leetcode_stats(username: str) -> Dict[str, Any]:
    """
    Fetches the candidate's LeetCode stats via GraphQL and returns a clean JSON object.
    """
    headers = {
        "Content-Type": "application/json",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        "Referer": f"https://leetcode.com/{username}/"
    }

    payload = {
        "query": GRAPHQL_QUERY,
        "variables": {"username": username}
    }

    try:
        response = requests.post(
            LEETCODE_GRAPHQL_URL,
            headers=headers,
            json=payload,
            timeout=15
        )
        response.raise_for_status()
        data = response.json()
        
        # Handle GraphQL-level errors (e.g. invalid query or internal server error)
        if "errors" in data:
            return {"error": True, "message": "GraphQL error", "details": data["errors"]}

        user_data = data.get("data", {}).get("matchedUser")
        
        # User not found usually means `matchedUser` is null
        if user_data is None:
            return {"error": True, "message": f"User '{username}' not found on LeetCode"}

        # Extract profile 
        profile = user_data.get("profile") or {}
        
        # Extract solved stats specifically mapping Easy, Medium, Hard, All
        ac_num = user_data.get("submitStatsGlobal", {}).get("acSubmissionNum", [])
        solved_stats = {item.get("difficulty"): item.get("count", 0) for item in ac_num if "difficulty" in item}

        # Construct our clean output payload
        return {
            "username": user_data.get("username"),
            "profile": {
                "realName": profile.get("realName"),
                "ranking": profile.get("ranking"),
                "websites": profile.get("websites", []),
                "githubUrl": user_data.get("githubUrl"),
                "twitterUrl": user_data.get("twitterUrl"),
                "linkedinUrl": user_data.get("linkedinUrl"),
            },
            "solvedStats": {
                "All": solved_stats.get("All", 0),
                "Easy": solved_stats.get("Easy", 0),
                "Medium": solved_stats.get("Medium", 0),
                "Hard": solved_stats.get("Hard", 0),
            },
            "languageStats": user_data.get("languageProblemCount", []),
            "skillStats": user_data.get("tagProblemCounts", {})
        }

    except requests.exceptions.RequestException as e:
        return {"error": True, "message": "Failed to connect to LeetCode API", "details": str(e)}

def get_problem_dna(title_slug: str) -> Dict[str, Any]:
    """
    Fetches the DNA (content, hints, tags, stats) for a specific LeetCode problem
    and cleans the HTML content using BeautifulSoup. 
    Saves the structured data to problem_dna.json.
    """
    headers = {
        "Content-Type": "application/json",
        "User-Agent": "Mozilla/5.0",
        "Referer": f"https://leetcode.com/problems/{title_slug}/"
    }

    payload = {
        "query": GRAPHQL_PROBLEM_QUERY,
        "variables": {"titleSlug": title_slug}
    }

    try:
        response = requests.post(LEETCODE_GRAPHQL_URL, headers=headers, json=payload, timeout=15)
        response.raise_for_status()
        data = response.json()

        if "errors" in data:
            return {"error": True, "message": "GraphQL error", "details": data["errors"]}

        question = data.get("data", {}).get("question")
        if not question:
            return {"error": True, "message": f"Problem '{title_slug}' not found"}

        # Clean HTML content replacing common block tags with newlines
        raw_content = question.get("content", "")
        if raw_content:
            soup = BeautifulSoup(raw_content, "html.parser")
            # Get text with newlines for visual separation
            clean_content = soup.get_text(separator="\n\n").strip()
            # Slight cleanup of multi-newlines
            import re
            clean_content = re.sub(r'\n{3,}', '\n\n', clean_content)
        else:
            clean_content = ""

        # Parse stats JSON string if present
        stats_str = question.get("stats", "{}")
        try:
            stats = json.loads(stats_str)
        except json.JSONDecodeError:
            stats = {}

        result = {
            "questionId": question.get("questionId"),
            "title": question.get("title"),
            "content": clean_content,
            "difficulty": question.get("difficulty"),
            "topicTags": [tag.get("name") for tag in question.get("topicTags", [])],
            "stats": {
                "totalAccepted": stats.get("totalAccepted"),
                "totalSubmission": stats.get("totalSubmission")
            },
            "hints": question.get("hints", []),
            "sampleTestCase": question.get("exampleTestcases", "")
        }

        # Save to template file
        with open("problem_dna.json", "w", encoding="utf-8") as f:
            json.dump(result, f, indent=2, ensure_ascii=False)

        return result

    except requests.exceptions.RequestException as e:
        return {"error": True, "message": "Failed to connect to LeetCode API", "details": str(e)}

def get_user_solved_problems(username: str, limit: int = 50) -> Dict[str, Any]:
    """
    Fetches the 'Recent AC (Accepted) Submissions' for a user.
    Returns a clean list of unique problems the candidate has successfully passed.
    """
    headers = {
        "Content-Type": "application/json",
        "User-Agent": "Mozilla/5.0",
        "Referer": f"https://leetcode.com/{username}/"
    }

    payload = {
        "query": GRAPHQL_SOLVED_PROBLEMS_QUERY,
        "variables": {"username": username, "limit": limit}
    }

    try:
        response = requests.post(LEETCODE_GRAPHQL_URL, headers=headers, json=payload, timeout=15)
        response.raise_for_status()
        data = response.json()

        if "errors" in data:
            return {"error": True, "message": "GraphQL error", "details": data["errors"]}

        submissions = data.get("data", {}).get("recentAcSubmissionList", [])
        if submissions is None:
            submissions = []

        # Deduplicate by titleSlug
        seen_slugs = set()
        unique_problems = []
        
        for sub in submissions:
            slug = sub.get("titleSlug")
            if slug and slug not in seen_slugs:
                seen_slugs.add(slug)
                unique_problems.append({
                    "title": sub.get("title"),
                    "titleSlug": slug,
                    "timestamp": sub.get("timestamp")
                })

        return {
            "username": username,
            "solvedProblemsCount": len(unique_problems),
            "solvedProblems": unique_problems
        }

    except requests.exceptions.RequestException as e:
        return {"error": True, "message": "Failed to connect to LeetCode API", "details": str(e)}

def get_clone_data(title_slug: str) -> Dict[str, Any]:
    """
    Fetches the clone data (content, tags, test cases, code snippets) for a specific problem
    and cleans the HTML content while carefully preserving constraints formatting (`10^5`). 
    Saves the structured data to logic_skeleton.json.
    """
    headers = {
        "Content-Type": "application/json",
        "User-Agent": "Mozilla/5.0",
        "Referer": f"https://leetcode.com/problems/{title_slug}/"
    }

    payload = {
        "query": GRAPHQL_CLONE_QUERY,
        "variables": {"titleSlug": title_slug}
    }

    try:
        response = requests.post(LEETCODE_GRAPHQL_URL, headers=headers, json=payload, timeout=15)
        response.raise_for_status()
        data = response.json()

        if "errors" in data:
            return {"error": True, "message": "GraphQL error", "details": data["errors"]}

        question = data.get("data", {}).get("question")
        if not question:
            return {"error": True, "message": f"Problem '{title_slug}' not found"}

        # Clean HTML content replacing common block tags with newlines
        raw_content = question.get("content", "")
        if raw_content:
            soup = BeautifulSoup(raw_content, "html.parser")
            # Preserve constraints mathematically (e.g. turning <sup>5</sup> into ^5)
            for sup in soup.find_all("sup"):
                if sup.string: sup.string.replace_with(f"^{sup.string}")
            for sub in soup.find_all("sub"):
                if sub.string: sub.string.replace_with(f"_{sub.string}")
            
            # Get text with newlines for visual separation
            clean_content = soup.get_text(separator="\n\n").strip()
            # Slight cleanup of multi-newlines
            import re
            clean_content = re.sub(r'\n{3,}', '\n\n', clean_content)
        else:
            clean_content = ""

        result = {
            "titleSlug": title_slug,
            "content": clean_content,
            "topicTags": [tag.get("name") for tag in question.get("topicTags", [])],
            "hints": question.get("hints", []),
            "sampleTestCase": question.get("exampleTestcases", ""),
            "codeSnippets": question.get("codeSnippets", [])
        }

        # Save to template file
        with open("logic_skeleton.json", "w", encoding="utf-8") as f:
            json.dump(result, f, indent=2, ensure_ascii=False)

        return result

    except requests.exceptions.RequestException as e:
        return {"error": True, "message": "Failed to connect to LeetCode API", "details": str(e)}

if __name__ == "__main__":
    import sys
    import argparse
    
    parser = argparse.ArgumentParser(description="LeetCode Scraper")
    parser.add_argument("--user", help="Fetch stats for a LeetCode username")
    parser.add_argument("--problem", help="Fetch DNA for a LeetCode problem slug")
    parser.add_argument("--solved", help="Fetch recently solved problems for a username")
    parser.add_argument("--clone", help="Fetch clone-ready pack for a problem slug")
    
    # Backwards compatibility for implicit user arg
    if len(sys.argv) == 2 and not sys.argv[1].startswith("--"):
        stats = get_leetcode_stats(sys.argv[1])
        print(json.dumps(stats, indent=2))
        sys.exit(0)
        
    args = parser.parse_args()
    
    if args.problem:
        details = get_problem_dna(args.problem)
        print(json.dumps(details, indent=2))
        print(f"\n[+] Saved to problem_dna.json", file=sys.stderr)
    elif args.clone:
        clone_data = get_clone_data(args.clone)
        print(json.dumps(clone_data, indent=2))
        print(f"\n[+] Saved to logic_skeleton.json", file=sys.stderr)
    elif args.solved:
        solved = get_user_solved_problems(args.solved)
        print(json.dumps(solved, indent=2))
    elif args.user:
        stats = get_leetcode_stats(args.user)
        print(json.dumps(stats, indent=2))
    else:
        parser.print_help()
