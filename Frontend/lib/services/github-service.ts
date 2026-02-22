export async function fetchLiveRepoData(repoUrl: string): Promise<string> {
  const crawlApiUrl = process.env.SCRAPER_API_URL || 'http://localhost:8000/crawl';

  console.log(`Sending crawl request to ${crawlApiUrl} for ${repoUrl}...`);

  const response = await fetch(crawlApiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'ngrok-skip-browser-warning': '1',
    },
    body: JSON.stringify({
      repo_url: repoUrl,
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to crawl: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  console.log(data);
  
  // Return the fetched data as a formatted JSON string for the LLM to inspect
  return JSON.stringify(data, null, 2);
}
