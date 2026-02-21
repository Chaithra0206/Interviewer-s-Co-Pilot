🚀 Project Overview
Architectural Scout is an autonomous hiring panel built for the VexStorm 26 Hackathon. The system audits a candidate's engineering depth by cross-referencing their Resume against their actual public code (GitHub) and interview performance (InterviewSync).

🛠 Tech Stack
Framework: Next.js 14+ (App Router)

Language: TypeScript (Strict Mode)

AI Orchestration: Vercel AI SDK (Core, OpenAI provider)

Data Acquisition: Crawl4AI (Python-based scraper)

UI/UX: Tailwind CSS, Shadcn/UI, GSAP (for reasoning animations), Framer Motion

Interview Platform: InterviewSync (Integration via webhooks)

🤖 Agent Instructions
You are an autonomous agent working within a three-member team. Your goal is to build a system that "genuinely thinks." When performing tasks:

Context Awareness: Always check types/candidate.d.ts before modifying backend logic or frontend components.

Framework-First: Use Vercel AI SDK primitives (streamText, tool) for all AI logic. Do not use LangChain or Motia unless explicitly instructed.

Traceability: Every AI action must contribute to a "Reasoning Trace" that can be displayed on the frontend.

Scraping: Use the Crawl4AI service located in lib/services/github-service.ts for all GitHub data needs.

📂 Coding Standards & Architecture
Server Actions: All AI orchestration and heavy data fetching must happen in app/actions/.

Atomic Components: Keep UI components small and reusable in components/dashboard/.

Type Safety: No any types. Define interfaces for all API responses and agent states.

Git Hygiene: - Work on feature branches (e.g., feature/ai-logic).

Always rebase with main before submitting a PR.

Commit messages must be descriptive (e.g., feat: implement gap-detection logic in audit action).

⚙️ Development Setup
Install Dependencies: pnpm install

Environment Variables: Ensure .env.local contains OPENAI_API_KEY and GITHUB_TOKEN.

Run Dev Server: pnpm dev

Python Setup: Crawl4AI requires a Python environment. Agents should use the script in .agent/skills/github-scraper/scraper.py.

🎯 Current Objectives (Sprint 1)
[ ] Initialize Next.js project with the defined file structure.

[ ] Implement CandidateContext type definitions.

[ ] Setup Vercel AI SDK streamText basic loop in app/actions/audit.ts.

[ ] Connect Crawl4AI skeleton script to the github-analyzer tool.