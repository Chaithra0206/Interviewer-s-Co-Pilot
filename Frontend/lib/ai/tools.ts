import { generateObject, tool } from 'ai';
import { z } from 'zod';
import { model as cerebrasModel } from '../ai-orchestrator';

export const SCOUT_PROMPT = `You are a Senior Architect Reviewer.
Focus on evaluating the codebase for true modularity, security, and robust architectural design patterns rather than relying on simple keyword matching.
Validate the structural integrity and technical depth of the candidate's code.`;

const REQUIRED_REACT_GAP_MESSAGE =
  'Candidate uses anti-patterns in React despite "Expert" claim.';

const codeAuditSchema = z.object({
  contradictionScore: z.number().int().min(0).max(100),
  techStack: z.array(z.string().min(1)),
  complexityScore: z.number().int().min(1).max(10),
  gaps: z.array(
    z.union([
      z.string(),
      z.object({
        severity: z.string().optional(),
        codeLocation: z.string().optional(),
        description: z.string()
      })
    ])
  ).describe('List of gaps or contradictions found in the code.'),
  findings: z.union([
    z.array(z.string().min(1)),
    z.array(
      z.object({
        severity: z.string().optional(),
        description: z.string().min(1),
        codeLocation: z.string().optional(),
      }),
    ),
    z.record(
      z.string(),
      z.union([
        z.string().min(1),
        z.array(z.string().min(1)),
      ]),
    ),
  ]),
});

function normalizeFindings(
  findings: z.infer<typeof codeAuditSchema>['findings'],
): string[] {
  if (Array.isArray(findings)) {
    if (findings.length === 0) {
      return [];
    }

    if (typeof findings[0] === 'string') {
      return (findings as string[]).filter((item) => item.trim().length > 0);
    }

    return (findings as Array<{ severity?: string; description: string; codeLocation?: string }>)
      .map((item) => {
        const sev = item.severity ? item.severity.toUpperCase() : 'INFO';
        const location = item.codeLocation ? ` (${item.codeLocation})` : '';
        return `[${sev}] ${item.description}${location}`;
      })
      .filter((item) => item.trim().length > 0);
  }

  if (typeof findings !== 'object' || findings === null) {
    return [];
  }

  const findingsRecord = findings as Record<string, string | string[]>;
  const flattened: string[] = [];
  for (const [category, raw] of Object.entries(findingsRecord)) {
    if (Array.isArray(raw)) {
      for (const item of raw) {
        if (item.trim().length > 0) {
          flattened.push(`${category}: ${item}`);
        }
      }
      continue;
    }

    if (raw.trim().length > 0) {
      flattened.push(`${category}: ${raw}`);
    }
  }

  return flattened;
}

function clampInteger(value: unknown, min: number, max: number, fallback: number): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return fallback;
  }

  return Math.max(min, Math.min(max, Math.round(value)));
}

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
    markdownContent: z
      .unknown()
      .describe("Repository markdown/generated payload from Member 3's github-service."),
    resumeClaims: z
      .array(z.string())
      .default([])
      .describe('Normalized resume claims such as "React Expert", "Security Expert", etc.'),
  }),
  execute: async ({ repoUrl, markdownContent, resumeClaims }) => {
    const rawMarkdown =
      typeof markdownContent === 'string'
        ? markdownContent
        : JSON.stringify(markdownContent ?? {}, null, 2);
    const normalizedMarkdown = rawMarkdown.substring(0, 20000); // Truncate to ~5k-6k tokens for Cerebras safety
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

    let object: z.infer<typeof codeAuditSchema>;
    try {
      const response = await generateObject({
        model: cerebrasModel,
        schema: codeAuditSchema,
        system: [
          'You are a specialized Sub-Agent Code Auditor.',
          "Input markdown comes from Member 3's github-service crawl.",
          'Audit for contradictions between resume claims and actual implementation quality.',
          'Return ONLY the schema fields: contradictionScore (0-100), techStack (array), complexityScore (1-10), gaps, findings.',
          'Higher contradictionScore means larger mismatch between claims and code.',
          forcedReactGap
            ? `Mandatory rule: include this exact gap if React anti-pattern condition is met: ${REQUIRED_REACT_GAP_MESSAGE}`
            : 'React anti-pattern mandatory gap rule does not trigger unless conditions are met.',
        ].join(' '),
        prompt: [
          `Repository URL: ${repoUrl}`,
          `Resume Claims: ${JSON.stringify(claims, null, 2)}`,
          'Code Markdown:',
          normalizedMarkdown,
        ].join('\n\n'),
      });
      object = response.object;
    } catch (error) {
      const rawText =
        error && typeof error === 'object' && 'text' in error && typeof (error as { text?: unknown }).text === 'string'
          ? ((error as { text: string }).text ?? '')
          : '';

      let rawParsed: Record<string, unknown> = {};
      try {
        rawParsed = rawText ? (JSON.parse(rawText) as Record<string, unknown>) : {};
      } catch {
        rawParsed = {};
      }

      const rawTechStack = Array.isArray(rawParsed.techStack)
        ? rawParsed.techStack.filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
        : [];

      const rawGaps = Array.isArray(rawParsed.gaps)
        ? rawParsed.gaps
            .map((gap) => {
              if (typeof gap === 'string') {
                return gap;
              }
              if (typeof gap === 'object' && gap !== null && 'description' in gap) {
                const info = gap as { description?: unknown; severity?: unknown; codeLocation?: unknown };
                const desc = typeof info.description === 'string' ? info.description : 'Gap detected';
                const sev = typeof info.severity === 'string' ? info.severity.toUpperCase() : 'INFO';
                const loc = typeof info.codeLocation === 'string' ? info.codeLocation : 'unknown';
                return `[${sev}] ${desc} (${loc})`;
              }
              return '';
            })
            .filter((item) => item.trim().length > 0)
        : [];

      const rawFindingsInput = rawParsed.findings;
      let normalizedFallbackFindings: string[] = [];
      if (Array.isArray(rawFindingsInput)) {
        normalizedFallbackFindings = rawFindingsInput
          .map((entry) => {
            if (typeof entry === 'string') {
              return entry;
            }
            if (typeof entry === 'object' && entry !== null && 'description' in entry) {
              const info = entry as { description?: unknown; severity?: unknown; codeLocation?: unknown };
              const desc = typeof info.description === 'string' ? info.description : 'Finding detected';
              const sev = typeof info.severity === 'string' ? info.severity.toUpperCase() : 'INFO';
              const loc = typeof info.codeLocation === 'string' ? ` (${info.codeLocation})` : '';
              return `[${sev}] ${desc}${loc}`;
            }
            return '';
          })
          .filter((item) => item.trim().length > 0);
      } else if (typeof rawFindingsInput === 'object' && rawFindingsInput !== null) {
        for (const [category, value] of Object.entries(rawFindingsInput as Record<string, unknown>)) {
          if (Array.isArray(value)) {
            for (const line of value) {
              if (typeof line === 'string' && line.trim().length > 0) {
                normalizedFallbackFindings.push(`${category}: ${line}`);
              }
            }
          } else if (typeof value === 'string' && value.trim().length > 0) {
            normalizedFallbackFindings.push(`${category}: ${value}`);
          }
        }
      }

      object = {
        contradictionScore: clampInteger(rawParsed.contradictionScore, 0, 100, 35),
        techStack: rawTechStack,
        complexityScore: clampInteger(rawParsed.complexityScore, 1, 10, inferredComplexityScore),
        gaps: rawGaps,
        findings: normalizedFallbackFindings,
      };

      console.warn('[analyzeCodebase] generateObject schema mismatch recovered via fallback parser.');
    }
    // Flatten gaps if they are objects
    const flattenedGaps = object.gaps.map(gap => 
      typeof gap === 'string' ? gap : `[${gap.severity?.toUpperCase() || 'INFO'}] ${gap.description} (${gap.codeLocation || 'unknown'})`
    );

    const mergedGaps = forcedReactGap
      ? Array.from(new Set([forcedReactGap, ...flattenedGaps]))
      : flattenedGaps;

    const boostedScore = forcedReactGap
      ? Math.max(object.contradictionScore, 75)
      : object.contradictionScore;

    return {
      contradictionScore: boostedScore,
      techStack: object.techStack.length > 0 ? object.techStack : inferredTechStack,
      complexityScore: object.complexityScore || inferredComplexityScore,
      gaps: mergedGaps,
      findings: normalizeFindings(object.findings),
    };
  },
});
