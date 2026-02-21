import { fetchRepoStructure } from '../lib/services/github-scraper';
import { analyzeCodebase } from '../lib/ai/tools';

async function main(): Promise<void> {
  const repoUrl = 'https://github.com/vercel/serve';

  console.log(`Fetching markdown from: ${repoUrl}`);
  const markdownContent = await fetchRepoStructure(repoUrl);

  if (!markdownContent || markdownContent.trim().length === 0) {
    throw new Error('github-service returned empty markdown.');
  }

  if (!analyzeCodebase.execute) {
    throw new Error('analyzeCodebase.execute is not available.');
  }

  const result = await analyzeCodebase.execute(
    {
      repoUrl,
      markdownContent,
      resumeClaims: ['React Expert', 'Security Expert'],
    },
    {
      toolCallId: 'test-scout',
      messages: [],
      experimental_context: undefined,
      abortSignal: undefined,
    },
  );

  if (!result || typeof result !== 'object') {
    throw new Error('Tool output is not an object.');
  }

  const typedResult = result as {
    techStack?: string[];
    complexityScore?: number;
    findings?: string[];
  };

  if (!Array.isArray(typedResult.techStack) || typedResult.techStack.length < 1) {
    throw new Error('Expected at least one techStack entry in analyzeCodebase output.');
  }

  if (typeof typedResult.complexityScore !== 'number') {
    throw new Error('Expected complexityScore in analyzeCodebase output.');
  }

  console.log('Assertions passed.');
  console.log('techStack:', typedResult.techStack);
  console.log('complexityScore:', typedResult.complexityScore);
  console.log('Findings (raw):');
  console.log((typedResult.findings ?? []).join('\n'));
}

main().catch((error) => {
  console.error('test-scout failed:', error);
  process.exit(1);
});

