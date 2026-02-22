import { generateObject, tool } from 'ai';
import { z } from 'zod';
import { model } from '../ai-orchestrator';
import { fetchLiveRepoData } from '../services/github-service';

export const SCOUT_PROMPT = `You are a Senior Architect Reviewer.
Focus on evaluating the codebase for true modularity, security, and robust architectural design patterns rather than relying on simple keyword matching.
Validate the structural integrity and technical depth of the candidate's code.`;

const REQUIRED_REACT_GAP_MESSAGE =
  'Candidate uses anti-patterns in React despite "Expert" claim.';

const codeAuditSchema = z.object({
  contradictionScore: z.number().int().min(0).max(100).default(0),
  techStack: z.array(z.string()).default([]),
  complexityScore: z.number().int().min(1).max(10).default(5),
  gaps: z.array(z.string()).default([]),
  findings: z.array(z.string()).default([]),
  engineeringDNA: z.object({
    architecturePattern: z.string().default('Unknown'),
    stateManagement: z.string().default('Unknown'),
    namingConventions: z.string().default('Unknown'),
  }).default({ architecturePattern: 'Unknown', stateManagement: 'Unknown', namingConventions: 'Unknown' }).describe('Deep architectural analysis of the codebase structure and patterns.'),
});

function hasReactExpertClaim(resumeClaims: string[]): boolean {
  return resumeClaims.some((claim) => {
    const normalized = claim.toLowerCase();
    return (
      normalized.includes('react expert') ||
      normalized.includes('expert in react') ||
      (normalized.includes('react') && normalized.includes('expert'))
    );
  });
}

function hasLegacyReactClassPatterns(markdown: string): boolean {
  return /extends\s+react\.(component|purecomponent)|componentwillmount|componentwillreceiveprops|componentwillupdate/i.test(
    markdown,
  );
}

function hasMessyUseEffectPatterns(markdown: string): boolean {
  const lower = markdown.toLowerCase();
  const useEffectCount = (lower.match(/useeffect\s*\(/g) ?? []).length;
  const noDepsCount = (lower.match(/useeffect\s*\(\s*\(\s*=>[\s\S]*?\)\s*\)/g) ?? []).length;
  const disableLintCount = (lower.match(/eslint-disable-next-line\s+react-hooks\/exhaustive-deps/g) ?? []).length;

  return useEffectCount > 0 && (noDepsCount >= 2 || disableLintCount >= 1);
}

export const analyzeCodebase = tool({
  description:
    "Sub-Agent Code Auditor: analyze GitHub markdown from Member 3's github-service and return contradiction scoring against resume claims.",
  inputSchema: z.object({
    repoUrl: z.string().describe('GitHub repository URL.'),
    resumeClaims: z
      .array(z.string())
      .default([])
      .describe('Normalized resume claims such as "React Expert", "Security Expert", etc.'),
  }),
  execute: async ({ repoUrl, resumeClaims }) => {
    let normalizedMarkdown = '';
    try {
      const rawMarkdown = await fetchLiveRepoData(repoUrl);
      // Cerebras has an 8192 token limit. 
      // 1 token ~ 4 characters, so 8192 tokens ~ 32,000 chars.
      // We truncate to 20,000 chars to leave plenty of room for system prompts, history, and output.
      normalizedMarkdown = rawMarkdown.length > 20000 
        ? rawMarkdown.substring(0, 20000) + '\\n...[Codebase truncated due to length limits]...'
        : rawMarkdown;
    } catch (e) {
      console.error('Failed to fetch live repo data, returning empty analysis', e);
      normalizedMarkdown = 'No data retrieved due to crawl failure.';
    }

    const claims = resumeClaims ?? [];

    const reactExpertClaim = hasReactExpertClaim(claims);
    const legacyReactPatterns = hasLegacyReactClassPatterns(normalizedMarkdown);
    const messyUseEffectPatterns = hasMessyUseEffectPatterns(normalizedMarkdown);

    const forcedReactGap =
      reactExpertClaim && (legacyReactPatterns || messyUseEffectPatterns)
        ? REQUIRED_REACT_GAP_MESSAGE
        : null;

    const lower = normalizedMarkdown.toLowerCase();
    const inferredTechStack = Array.from(
      new Set(
        [
          lower.includes('react') ? 'React' : null,
          lower.includes('next') ? 'Next.js' : null,
          lower.includes('typescript') ? 'TypeScript' : null,
          lower.includes('javascript') ? 'JavaScript' : null,
          lower.includes('node') ? 'Node.js' : null,
          lower.includes('express') ? 'Express' : null,
          lower.includes('prisma') ? 'Prisma' : null,
          lower.includes('postgres') || lower.includes('postgresql') ? 'PostgreSQL' : null,
          lower.includes('mongodb') || lower.includes('mongoose') ? 'MongoDB' : null,
          lower.includes('tailwind') ? 'Tailwind CSS' : null,
        ].filter((value): value is string => value !== null),
      ),
    );

    const inferredComplexityScore = Math.max(
      1,
      Math.min(10, Math.floor(normalizedMarkdown.length / 5000) + 1),
    );

    const { object } = await generateObject({
      model: model,
      schema: codeAuditSchema,
      system: [
        'You are a specialized Sub-Agent Code Auditor.',
        "Input markdown comes from Member 3's github-service crawl.",
        'Audit for contradictions between resume claims and actual implementation quality.',
        'CRITICAL: Extract the Engineering DNA of the codebase. Answer specifically: How do they handle state? What are the naming conventions? Is there an architecture like Clean Architecture or just flat files?',
        'Return ONLY the schema fields: contradictionScore (0-100), techStack (array), complexityScore (1-10), gaps, findings, and engineeringDNA.',
        'Higher contradictionScore means larger mismatch between claims and code.',
        forcedReactGap
          ? `Mandatory rule: include this exact gap if React anti-pattern condition is met: ${REQUIRED_REACT_GAP_MESSAGE}`
          : 'React anti-pattern mandatory gap rule does not trigger unless conditions are met.',
        'If no code or markdown is provided, return exactly this JSON: {"contradictionScore": 0, "techStack": [], "complexityScore": 1, "gaps": ["No code extracted"], "findings": ["Codebase empty"], "engineeringDNA": {"architecturePattern": "Unknown", "stateManagement": "Unknown", "namingConventions": "Unknown"}}',
        'Example JSON output:',
        '{"contradictionScore": 10, "techStack": ["React"], "complexityScore": 5, "gaps": [], "findings": ["Good code."], "engineeringDNA": {"architecturePattern": "MVC", "stateManagement": "Redux", "namingConventions": "camelCase"}}'
      ].join(' '),
      prompt: [
        `Repository URL: ${repoUrl}`,
        `Resume Claims: ${JSON.stringify(claims, null, 2)}`,
        'Code Markdown:',
        normalizedMarkdown,
      ].join('\n\n'),
    });

    const mergedGaps = forcedReactGap
      ? Array.from(new Set([forcedReactGap, ...object.gaps]))
      : object.gaps;

    const boostedScore = forcedReactGap
      ? Math.max(object.contradictionScore, 75)
      : object.contradictionScore;

    return {
      contradictionScore: boostedScore,
      techStack: object.techStack.length > 0 ? object.techStack : inferredTechStack,
      complexityScore: object.complexityScore || inferredComplexityScore,
      gaps: mergedGaps,
      findings: object.findings,
      engineeringDNA: object.engineeringDNA,
    };
  },
});
