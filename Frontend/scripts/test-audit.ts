import 'dotenv/config';
import { auditCandidate } from '../app/actions/audit-candidate';


async function run() {
  console.log('🚀 Starting Alex Dev Simulation...');

  const mockResume = {
    skills: ['React Expert', 'TypeScript', 'Node.js', 'System Design'],
    experience: [
      {
        company: 'Tech Corp',
        role: 'Senior React Developer',
        duration: '2019-Present',
      },
    ],
    education: [],
  };

  const mockGithubUrl = 'https://github.com/Kaushik4141/InnovateHubCEC';
  const mockMarkdownContext = `
# Repo: InnovateHubCEC
## File: package.json
{
  "name": "innovate-hub",
  "dependencies": {
    "react": "^18.2.0",
    "next": "13.4.4"
  }
}
## File: src/app/page.tsx
export default function Page() {
  return <div>Hello World</div>
}
  `;

  try {
    console.log('Sending audit request with mock markdown...');
    const result = await auditCandidate(mockResume, mockGithubUrl, undefined, mockMarkdownContext);
    
    console.log('Audit returned result!');
    console.log('\n✅ Audit Complete!\n');
    console.log('Resulting Context:');
    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    console.error('❌ Audit Failed:');
    console.error(error);
  }
}

run().catch(console.error);
