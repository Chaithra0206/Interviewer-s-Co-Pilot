"""
AI Problem Generator

Takes scraped LeetCode data (recent problems, topic tags, languages)
and uses an LLM to generate a NEW similar coding problem.
"""

import os
import json
import sys
from pathlib import Path
from typing import Any

import requests

from leetcode_scraper import get_clone_data

# ── Load OPENAI_API_KEY from Frontend/.env.local if not already set ────
if not os.environ.get("OPENAI_API_KEY"):
    env_paths = [
        Path(__file__).parent.parent.parent / "Frontend" / ".env.local",
        Path(__file__).parent.parent.parent / "Frontend" / ".env",
        Path(__file__).parent / ".env",
    ]
    for env_path in env_paths:
        if env_path.exists():
            for line in env_path.read_text(encoding="utf-8").splitlines():
                line = line.strip()
                if line.startswith("OPENAI_API_KEY="):
                    val = line.split("=", 1)[1].strip().strip('"').strip("'")
                    os.environ["OPENAI_API_KEY"] = val
                    print(f"[problem-gen] Loaded OPENAI_API_KEY from {env_path}", file=sys.stderr)
                    break
            if os.environ.get("OPENAI_API_KEY"):
                break


def generate_similar_problem(
    recent_solved: list[dict[str, str]],
    languages: list[dict[str, Any]],
    stats: dict[str, int],
) -> dict[str, Any]:
    """
    Given a candidate's scraped LeetCode data, use an LLM to generate
    a new similar problem based on their recent solved problems' topics.

    Steps:
    1. Fetch topic tags from the candidate's recent problems
    2. Build a prompt with those topics + their skill level
    3. Call OpenAI API to generate a custom problem
    4. Return the generated problem with description, examples, and starter code
    """

    # ── Step 1: Collect topic tags and similar problems from history ──
    all_tags: list[str] = []
    problem_names: list[str] = []
    solved_slugs: set[str] = {prob.get("slug") for prob in recent_solved if prob.get("slug")}
    collected_similar: list[dict[str, str]] = []

    # Look at the last 5 solved problems to find similar ones
    for prob in recent_solved[:5]:
        slug = prob.get("slug", "")
        title = prob.get("title", "")
        if title:
            problem_names.append(title)

        if slug:
            clone = get_clone_data(slug)
            if not clone.get("error"):
                # Collect tags
                tags = clone.get("topicTags", [])
                all_tags.extend(tags)
                
                # Collect real similar problems from LeetCode
                sims = clone.get("similarQuestions") or []
                for s in sims:
                    sim_slug = s.get("titleSlug")
                    if isinstance(s, dict) and sim_slug:
                        # ONLY collect it if the user HAS NOT solved it
                        if sim_slug not in solved_slugs:
                            collected_similar.append({
                                "title": s.get("title", ""),
                                "slug": sim_slug,
                                "based_on": title
                            })

    # Deduplicate tags while preserving order
    seen_tags = set()
    unique_tags = []
    for tag in all_tags:
        if tag not in seen_tags:
            seen_tags.add(tag)
            unique_tags.append(tag)

    # Determine candidate's primary language
    primary_lang = "Python"
    if languages:
        primary_lang = languages[0].get("name", "Python")
        # Normalize
        lang_map = {
            "Python3": "Python",
            "C++": "C++",
            "Java": "Java",
            "JavaScript": "JavaScript",
            "TypeScript": "TypeScript",
            "Go": "Go",
            "Rust": "Rust",
            "C": "C",
        }
        primary_lang = lang_map.get(primary_lang, primary_lang)

    # Determine difficulty level from their stats
    total = stats.get("total", 0)
    hard = stats.get("hard", 0)
    medium = stats.get("medium", 0)
    if hard > 30:
        target_difficulty = "Hard"
    elif medium > 50 or total > 100:
        target_difficulty = "Medium"
    else:
        target_difficulty = "Easy"

    # ── Step 2: Build the LLM prompt ───────────────────────────────────
    prompt = f"""You are a coding interview problem designer. Based on the candidate's LeetCode profile, generate a NEW original coding problem that tests similar concepts.

**Candidate Profile:**
- Recently solved (PROHIBITED LIST - DO NOT REPEAT): {', '.join(problem_names) if problem_names else 'Unknown'}
- Topic areas: {', '.join(unique_tags) if unique_tags else 'Arrays, Strings, Hash Tables'}
- Total solved: {total} (Easy: {stats.get('easy', 0)}, Medium: {stats.get('medium', 0)}, Hard: {stats.get('hard', 0)})
- Primary language: {primary_lang}
- Target difficulty: {target_difficulty}

**Requirements:**
1. Create a COMPLETELY NEW problem (not an existing LeetCode problem)
2. DO NOT use the same titles or identical logic as the 'Recently solved' list
3. It should test concepts from their topic areas but from a fresh perspective
4. The difficulty should match their skill level ({target_difficulty})
5. Include 2-3 examples with input/output
6. Include constraints
7. Provide starter code in {primary_lang}

**Respond in this EXACT JSON format (no markdown, pure JSON):**
{{
  "title": "Problem Title",
  "difficulty": "{target_difficulty}",
  "description": "Full problem description with clear requirements",
  "examples": [
    {{
      "input": "example input",
      "output": "expected output",
      "explanation": "brief explanation"
    }}
  ],
  "constraints": ["constraint 1", "constraint 2"],
  "topicTags": ["Tag1", "Tag2"],
  "starterCode": {{
    "language": "{primary_lang}",
    "code": "starter code template"
  }},
  "hints": ["hint 1", "hint 2"]
}}"""

    # ── Step 3: Call OpenAI API ────────────────────────────────────────
    api_key = os.environ.get("OPENAI_API_KEY", "")
    if not api_key:
        print("[problem-gen] No OPENAI_API_KEY found, using fallback", file=sys.stderr)
        return _fallback_problem(unique_tags, target_difficulty, primary_lang, problem_names, collected_similar)

    try:
        response = requests.post(
            "https://api.openai.com/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
            },
            json={
                "model": "gpt-4o",
                "messages": [
                    {"role": "system", "content": "You are a coding problem designer. Return ONLY valid JSON, no markdown fences."},
                    {"role": "user", "content": prompt},
                ],
                "temperature": 0.7,
                "max_tokens": 2000,
            },
            timeout=30,
        )
        response.raise_for_status()
        data = response.json()

        content = data["choices"][0]["message"]["content"].strip()
        # Strip markdown fences if present
        if content.startswith("```"):
            content = content.split("\n", 1)[1]
            content = content.rsplit("```", 1)[0]

        generated = json.loads(content)
        generated["_source"] = "ai_generated"
        generated["_based_on"] = problem_names[:3]
        generated["_topics_used"] = unique_tags[:5]
        return generated

    except Exception as e:
        print(f"[problem-gen] LLM call failed: {e}", file=sys.stderr)
        return _fallback_problem(unique_tags, target_difficulty, primary_lang, problem_names, collected_similar)


def _fallback_problem(
    tags: list[str],
    difficulty: str,
    lang: str,
    problem_names: list[str],
    similar_questions: list[dict[str, str]] = None,
    solved_slugs: set[str] = None,
) -> dict[str, Any]:
    """
    Fallback problem if the LLM is unavailable.
    
    Priority:
    1. Try to fetch one of the 'Similar Questions' collected from the candidate's history
    2. Fall back to the curated problem bank matched by topic tags
    """
    
    # ── Option 1: Try real 'Similar Questions' from LeetCode ───────────
    if similar_questions:
        print(f"[problem-gen] Attempting to fetch a real similar question ({len(similar_questions)} candidates)", file=sys.stderr)
        # Try up to 5 similar questions until we find one that has content (not premium)
        for sim in similar_questions[:5]:
            slug = sim.get("slug")
            if not slug: continue
            
            clone = get_clone_data(slug)
            if not clone.get("error") and clone.get("content"):
                print(f"[problem-gen] Success! Using real similar question: {sim.get('title')}", file=sys.stderr)
                
                # Filter code snippets
                raw_snippets = clone.get("codeSnippets") or []
                lang_slug_map = {
                    "Python": "python3", "JavaScript": "javascript", "TypeScript": "typescript",
                    "Java": "java", "C++": "cpp", "Go": "go", "Rust": "rust"
                }
                target_lang_slug = lang_slug_map.get(lang, "python3")
                
                starter = None
                for s in raw_snippets:
                    if s.get("langSlug") == target_lang_slug:
                        starter = s.get("code")
                        break
                
                # Fallback starter if target lang not found
                if not starter and raw_snippets:
                    starter = raw_snippets[0].get("code")
                
                # Format examples if they are in the sampleTestCase string
                examples = []
                raw_testcases = clone.get("sampleTestCase", "")
                if raw_testcases:
                    examples.append({
                        "input": raw_testcases,
                        "output": "See problem description for expected output",
                        "explanation": "Extracted from LeetCode sample test cases"
                    })

                return {
                    "title": sim.get("title", ""),
                    "difficulty": difficulty,  # Keep target difficulty or could fetch real
                    "description": clone.get("content", ""),
                    "examples": examples,
                    "constraints": [], # Included in content
                    "topicTags": clone.get("topicTags", []),
                    "starterCode": {
                        "language": lang,
                        "code": starter or ""
                    },
                    "hints": clone.get("hints", []),
                    "_source": "leetcode_similar_extraction",
                    "_based_on": [sim.get("based_on", "")],
                    "_topics_used": tags[:5]
                }
    
    # ── Option 2: Curated Problem Bank (Original Fallback) ────────────
    print("[problem-gen] Using curated bank fallback", file=sys.stderr)
    tag_set = {t.lower() for t in tags}


    # ── Problem Bank ──────────────────────────────────────────────────
    PROBLEMS = [
        {
            "match_tags": {"hash table", "string", "design"},
            "title": "Frequency Tracker",
            "difficulty": "Medium",
            "description": (
                "Design a data structure that tracks the frequency of values in a collection.\n\n"
                "Implement the `FrequencyTracker` class:\n"
                "- `FrequencyTracker()` — initializes an empty tracker.\n"
                "- `add(number)` — adds `number` to the tracker.\n"
                "- `deleteOne(number)` — removes one occurrence of `number`. Does nothing if `number` doesn't exist.\n"
                "- `hasFrequency(freq)` — returns `True` if there is a number in the tracker that occurs exactly `freq` times.\n\n"
                "All operations should run in O(1) average time."
            ),
            "examples": [
                {"input": 'tracker.add(3); tracker.add(3); tracker.hasFrequency(2)', "output": "True", "explanation": "3 appears exactly 2 times"},
                {"input": 'tracker.add(1); tracker.deleteOne(1); tracker.hasFrequency(1)', "output": "False", "explanation": "1 was deleted, no element appears 1 time"},
                {"input": 'tracker.add(5); tracker.add(5); tracker.add(5); tracker.hasFrequency(3)', "output": "True", "explanation": "5 appears exactly 3 times"},
            ],
            "constraints": ["1 <= number <= 10^5", "1 <= freq <= 10^5", "At most 2 * 10^5 calls total"],
            "topicTags": ["Hash Table", "Design", "Data Structure"],
            "hints": [
                "Use two hash maps: one mapping number -> count, and another mapping count -> how many numbers have that count.",
                "When you add or delete, update both maps together.",
            ],
            "starterCode": {
                "Python": 'class FrequencyTracker:\n    def __init__(self):\n        pass\n\n    def add(self, number: int) -> None:\n        pass\n\n    def deleteOne(self, number: int) -> None:\n        pass\n\n    def hasFrequency(self, frequency: int) -> bool:\n        pass',
                "JavaScript": 'class FrequencyTracker {\n    constructor() {}\n\n    add(number) {}\n\n    deleteOne(number) {}\n\n    hasFrequency(frequency) {}\n}',
                "Java": 'class FrequencyTracker {\n    public FrequencyTracker() {}\n\n    public void add(int number) {}\n\n    public void deleteOne(int number) {}\n\n    public boolean hasFrequency(int frequency) { return false; }\n}',
                "C++": 'class FrequencyTracker {\npublic:\n    FrequencyTracker() {}\n\n    void add(int number) {}\n\n    void deleteOne(int number) {}\n\n    bool hasFrequency(int frequency) { return false; }\n};',
            },
        },
        {
            "match_tags": {"array", "hash table"},
            "title": "Longest Consecutive Run",
            "difficulty": "Medium",
            "description": (
                "Given an unsorted array of integers `nums`, find the length of the longest sequence of consecutive integers.\n\n"
                "The sequence does NOT need to be contiguous in the original array — elements can appear anywhere.\n\n"
                "You must write an algorithm that runs in O(n) time."
            ),
            "examples": [
                {"input": "nums = [100, 4, 200, 1, 3, 2]", "output": "4", "explanation": "The longest consecutive sequence is [1, 2, 3, 4], length = 4"},
                {"input": "nums = [0, 3, 7, 2, 5, 8, 4, 6, 0, 1]", "output": "9", "explanation": "Sequence [0,1,2,3,4,5,6,7,8], length = 9"},
                {"input": "nums = [1, 1, 1]", "output": "1", "explanation": "Only distinct value is 1, so the longest run is 1"},
            ],
            "constraints": ["0 <= nums.length <= 10^5", "-10^9 <= nums[i] <= 10^9"],
            "topicTags": ["Array", "Hash Table", "Union Find"],
            "hints": [
                "Insert all numbers into a hash set for O(1) lookup.",
                "For each number, check if (number - 1) exists. If not, this number is the start of a sequence — count forward.",
            ],
            "starterCode": {
                "Python": 'class Solution:\n    def longestConsecutive(self, nums: list[int]) -> int:\n        pass',
                "JavaScript": 'function longestConsecutive(nums) {\n    // Your code here\n}',
                "Java": 'class Solution {\n    public int longestConsecutive(int[] nums) {\n        return 0;\n    }\n}',
                "C++": 'class Solution {\npublic:\n    int longestConsecutive(vector<int>& nums) {\n        return 0;\n    }\n};',
            },
        },
        {
            "match_tags": {"binary search", "array", "sorting"},
            "title": "Peak Element Finder",
            "difficulty": "Medium",
            "description": (
                "A peak element is an element that is strictly greater than its neighbors.\n\n"
                "Given a 0-indexed integer array `nums`, find a peak element and return its index. "
                "If the array contains multiple peaks, return the index of any one of them.\n\n"
                "You may imagine that `nums[-1] = nums[n] = -∞`. In other words, an element is always "
                "considered to be strictly greater than a neighbor that is outside the array.\n\n"
                "You must write an algorithm that runs in O(log n) time."
            ),
            "examples": [
                {"input": "nums = [1, 2, 3, 1]", "output": "2", "explanation": "nums[2] = 3 is a peak since 3 > 2 and 3 > 1"},
                {"input": "nums = [1, 2, 1, 3, 5, 6, 4]", "output": "5", "explanation": "nums[5] = 6 is a peak. Index 1 is also valid."},
            ],
            "constraints": ["1 <= nums.length <= 1000", "-2^31 <= nums[i] <= 2^31 - 1", "nums[i] != nums[i + 1] for all valid i"],
            "topicTags": ["Array", "Binary Search"],
            "hints": [
                "Binary search works because if mid < mid+1, a peak must exist to the right.",
                "The key insight: you don't need a sorted array for binary search — just a guarantee a peak exists in one half.",
            ],
            "starterCode": {
                "Python": 'class Solution:\n    def findPeakElement(self, nums: list[int]) -> int:\n        pass',
                "JavaScript": 'function findPeakElement(nums) {\n    // Your code here\n}',
                "Java": 'class Solution {\n    public int findPeakElement(int[] nums) {\n        return 0;\n    }\n}',
                "C++": 'class Solution {\npublic:\n    int findPeakElement(vector<int>& nums) {\n        return 0;\n    }\n};',
            },
        },
        {
            "match_tags": {"dynamic programming", "string"},
            "title": "Decode Variations",
            "difficulty": "Medium",
            "description": (
                "A message containing letters A-Z can be encoded as numbers using the mapping:\n"
                "'A' -> \"1\", 'B' -> \"2\", ..., 'Z' -> \"26\".\n\n"
                "Given a string `s` containing only digits, return the number of ways to decode it.\n\n"
                "Note that groupings like '06' are invalid (leading zeros). '6' is valid but '06' is not."
            ),
            "examples": [
                {"input": 's = "12"', "output": "2", "explanation": '"12" could be decoded as "AB" (1 2) or "L" (12)'},
                {"input": 's = "226"', "output": "3", "explanation": '"226" could be "BZ" (2 26), "VF" (22 6), or "BBF" (2 2 6)'},
                {"input": 's = "06"', "output": "0", "explanation": '"06" cannot be decoded — leading zero is invalid'},
            ],
            "constraints": ["1 <= s.length <= 100", "s contains only digits", "s does not contain leading zeros except '0' itself"],
            "topicTags": ["String", "Dynamic Programming"],
            "hints": [
                "Use dp[i] = number of ways to decode s[0..i-1]. Build from left to right.",
                "At each position, check if s[i] alone is valid (1-9) and if s[i-1..i] together is valid (10-26).",
            ],
            "starterCode": {
                "Python": 'class Solution:\n    def numDecodings(self, s: str) -> int:\n        pass',
                "JavaScript": 'function numDecodings(s) {\n    // Your code here\n}',
                "Java": 'class Solution {\n    public int numDecodings(String s) {\n        return 0;\n    }\n}',
                "C++": 'class Solution {\npublic:\n    int numDecodings(string s) {\n        return 0;\n    }\n};',
            },
        },
        {
            "match_tags": {"tree", "binary tree", "dfs", "bfs"},
            "title": "Maximum Path Sum in Binary Tree",
            "difficulty": "Hard",
            "description": (
                "A path in a binary tree is a sequence of nodes where each pair of adjacent nodes "
                "has an edge connecting them. A node can only appear in the sequence at most once.\n\n"
                "The path sum is the sum of the node values in the path.\n\n"
                "Given the root of a binary tree, return the maximum path sum of any non-empty path.\n\n"
                "The path does NOT need to pass through the root."
            ),
            "examples": [
                {"input": "root = [1, 2, 3]", "output": "6", "explanation": "The optimal path is 2 -> 1 -> 3, sum = 6"},
                {"input": "root = [-10, 9, 20, null, null, 15, 7]", "output": "42", "explanation": "The optimal path is 15 -> 20 -> 7, sum = 42"},
            ],
            "constraints": ["Number of nodes: [1, 3 * 10^4]", "-1000 <= Node.val <= 1000"],
            "topicTags": ["Tree", "DFS", "Dynamic Programming"],
            "hints": [
                "For each node, compute the max sum of the path that starts from that node going downward.",
                "The answer at each node is: node.val + max(left_gain, 0) + max(right_gain, 0). Track the global max.",
            ],
            "starterCode": {
                "Python": 'class Solution:\n    def maxPathSum(self, root) -> int:\n        pass',
                "JavaScript": 'function maxPathSum(root) {\n    // Your code here\n}',
                "Java": 'class Solution {\n    public int maxPathSum(TreeNode root) {\n        return 0;\n    }\n}',
                "C++": 'class Solution {\npublic:\n    int maxPathSum(TreeNode* root) {\n        return 0;\n    }\n};',
            },
        },
        {
            "match_tags": {"linked list"},
            "title": "Merge K Sorted Linked Lists",
            "difficulty": "Hard",
            "description": (
                "You are given an array of `k` linked lists, each sorted in ascending order.\n\n"
                "Merge all the linked lists into one sorted linked list and return it."
            ),
            "examples": [
                {"input": "lists = [[1,4,5],[1,3,4],[2,6]]", "output": "[1,1,2,3,4,4,5,6]", "explanation": "All three sorted lists merged into one"},
                {"input": "lists = []", "output": "[]", "explanation": "Empty input returns empty list"},
                {"input": "lists = [[]]", "output": "[]", "explanation": "Single empty list returns empty"},
            ],
            "constraints": ["k == lists.length", "0 <= k <= 10^4", "0 <= lists[i].length <= 500", "-10^4 <= lists[i][j] <= 10^4"],
            "topicTags": ["Linked List", "Heap", "Divide and Conquer"],
            "hints": [
                "Use a min-heap to efficiently find the smallest element across all k lists.",
                "Alternatively, use divide and conquer: merge lists in pairs, reducing k by half each round.",
            ],
            "starterCode": {
                "Python": 'class Solution:\n    def mergeKLists(self, lists: list) -> object:\n        pass',
                "JavaScript": 'function mergeKLists(lists) {\n    // Your code here\n}',
                "Java": 'class Solution {\n    public ListNode mergeKLists(ListNode[] lists) {\n        return null;\n    }\n}',
                "C++": 'class Solution {\npublic:\n    ListNode* mergeKLists(vector<ListNode*>& lists) {\n        return nullptr;\n    }\n};',
            },
        },
        {
            "match_tags": {"bit manipulation", "enumeration"},
            "title": "Single Number III",
            "difficulty": "Medium",
            "description": (
                "Given an integer array `nums`, exactly two elements appear only once and all the "
                "other elements appear exactly twice.\n\n"
                "Find the two elements that appear only once. You can return the answer in any order.\n\n"
                "You must write an algorithm that runs in O(n) time and uses only O(1) extra space."
            ),
            "examples": [
                {"input": "nums = [1, 2, 1, 3, 2, 5]", "output": "[3, 5]", "explanation": "3 and 5 each appear once, all others appear twice"},
                {"input": "nums = [-1, 0]", "output": "[-1, 0]", "explanation": "Both elements appear once"},
                {"input": "nums = [0, 1]", "output": "[0, 1]", "explanation": "Both elements appear once"},
            ],
            "constraints": ["2 <= nums.length <= 3 * 10^4", "-2^31 <= nums[i] <= 2^31 - 1", "Exactly two elements appear once"],
            "topicTags": ["Bit Manipulation", "Array"],
            "hints": [
                "XOR all elements — the result is XOR of the two unique numbers.",
                "Find any set bit in the XOR result and use it to partition the array into two groups.",
            ],
            "starterCode": {
                "Python": 'class Solution:\n    def singleNumber(self, nums: list[int]) -> list[int]:\n        pass',
                "JavaScript": 'function singleNumber(nums) {\n    // Your code here\n}',
                "Java": 'class Solution {\n    public int[] singleNumber(int[] nums) {\n        return new int[0];\n    }\n}',
                "C++": 'class Solution {\npublic:\n    vector<int> singleNumber(vector<int>& nums) {\n        return {};\n    }\n};',
            },
        },
        {
            "match_tags": {"graph", "bfs", "matrix"},
            "title": "Rotting Oranges",
            "difficulty": "Medium",
            "description": (
                "You are given an m x n grid where each cell has one of three values:\n"
                "- `0` — empty cell\n"
                "- `1` — fresh orange\n"
                "- `2` — rotten orange\n\n"
                "Every minute, any fresh orange that is 4-directionally adjacent to a rotten orange becomes rotten.\n\n"
                "Return the minimum number of minutes that must elapse until no cell has a fresh orange. "
                "If this is impossible, return `-1`."
            ),
            "examples": [
                {"input": "grid = [[2,1,1],[1,1,0],[0,1,1]]", "output": "4", "explanation": "It takes 4 minutes for all oranges to rot"},
                {"input": "grid = [[2,1,1],[0,1,1],[1,0,1]]", "output": "-1", "explanation": "The orange in the bottom-left can never be reached"},
                {"input": "grid = [[0,2]]", "output": "0", "explanation": "No fresh oranges at the start"},
            ],
            "constraints": ["m == grid.length", "n == grid[i].length", "1 <= m, n <= 10", "grid[i][j] is 0, 1, or 2"],
            "topicTags": ["BFS", "Matrix", "Graph"],
            "hints": [
                "Start BFS from ALL rotten oranges simultaneously (multi-source BFS).",
                "Track the number of fresh oranges. If any remain after BFS, return -1.",
            ],
            "starterCode": {
                "Python": 'class Solution:\n    def orangesRotting(self, grid: list[list[int]]) -> int:\n        pass',
                "JavaScript": 'function orangesRotting(grid) {\n    // Your code here\n}',
                "Java": 'class Solution {\n    public int orangesRotting(int[][] grid) {\n        return 0;\n    }\n}',
                "C++": 'class Solution {\npublic:\n    int orangesRotting(vector<vector<int>>& grid) {\n        return 0;\n    }\n};',
            },
        },
    ]

    # ── Pick the best matching problem ────────────────────────────────
    best_problem = None
    best_score = -1

    for prob in PROBLEMS:
        score = len(tag_set & prob["match_tags"])
        # Bonus for matching difficulty
        if prob["difficulty"] == difficulty:
            score += 0.5
        if score > best_score:
            best_score = score
            best_problem = prob

    if not best_problem:
        best_problem = PROBLEMS[0]  # Default to Frequency Tracker

    # Build the result with the right language starter code
    starter = best_problem["starterCode"].get(lang, best_problem["starterCode"].get("Python", ""))

    return {
        "title": best_problem["title"],
        "difficulty": best_problem.get("difficulty", difficulty),
        "description": best_problem["description"],
        "examples": best_problem["examples"],
        "constraints": best_problem["constraints"],
        "topicTags": best_problem["topicTags"],
        "starterCode": {
            "language": lang,
            "code": starter,
        },
        "hints": best_problem["hints"],
        "_source": "curated_problem_bank",
        "_based_on": problem_names[:3],
        "_topics_used": tags[:5],
    }
