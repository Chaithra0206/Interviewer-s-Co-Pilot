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

  const mockGithubUrl = 'https://github.com/alexdev/react-legacy-portfolio';
  
  // A simulated chunk of markdown that would typically come from Crawl4AI
  const mockMarkdownContent = `
# Legacy React App

## src/App.tsx
\`\`\`tsx
import React, { Component } from 'react';

class App extends Component {
  componentWillMount() {
    console.log("Fetching legacy data...");
  }
  
  render() {
    return <div>Hello World</div>;
  }
}

export default App;
\`\`\`

## src/components/Header.tsx
\`\`\`tsx
import { useEffect, useState } from 'react';

export function Header() {
  const [data, setData] = useState(null);
  
  useEffect(() => {
    fetch('/api/data').then(res => res.json()).then(setData);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  return <header>Header {data}</header>;
}
\`\`\`
  `.trim();

  try {
    const result = await auditCandidate(mockResume, mockGithubUrl, mockMarkdownContent);
    
    console.log('\n✅ Audit Complete!\n');
    console.log('Resulting Context:');
    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    console.error('❌ Audit Failed:');
    console.error(error);
  }
}

run().catch(console.error);
