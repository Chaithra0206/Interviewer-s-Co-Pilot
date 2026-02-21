import { model } from '../lib/ai-orchestrator';
import { generateText } from 'ai';

async function run() {
  console.log('Testing Raw Output');
  try {
    const res = await generateText({
      model,
      system: [
        'You are a specialized Sub-Agent Code Auditor.',
        "Input markdown comes from Member 3's github-service crawl.",
        'Audit for contradictions between resume claims and actual implementation quality.',
        'CRITICAL: Extract the Engineering DNA of the codebase. Answer specifically: How do they handle state? What are the naming conventions? Is there an architecture like Clean Architecture or just flat files?',
        'Return ONLY the schema fields: contradictionScore (0-100), techStack (array), complexityScore (1-10), gaps, findings, and engineeringDNA.',
        'Higher contradictionScore means larger mismatch between claims and code.',
        'If no code or markdown is provided, return empty arrays and scores of 0, with "Unknown" for engineeringDNA.',
        'Example JSON output:',
        '{"contradictionScore": 10, "techStack": ["React"], "complexityScore": 5, "gaps": [], "findings": ["Good code."], "engineeringDNA": {"architecturePattern": "MVC", "stateManagement": "Redux", "namingConventions": "camelCase"}}'
      ].join(' '),
      prompt: 'Code Markdown: No data retrieved due to crawl failure.',
    });
    console.log('--- OUTPUT BEGIN ---');
    console.log(res.text);
    console.log('--- OUTPUT END ---');
  } catch(e) {
    console.error(e);
  }
}

run();
