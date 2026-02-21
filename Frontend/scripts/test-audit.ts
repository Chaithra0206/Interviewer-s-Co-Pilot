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

  try {
    const result = await auditCandidate(mockResume, mockGithubUrl);
    
    console.log('\n✅ Audit Complete!\n');
    console.log('Resulting Context:');
    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    console.error('❌ Audit Failed:');
    console.error(error);
  }
}

run().catch(console.error);
