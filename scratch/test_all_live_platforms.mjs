async function testLiveYC() {
  const res = await fetch('https://www.ycombinator.com/jobs', {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    }
  });
  const html = await res.text();
  const match = html.match(/data-page="([^"]+)"/);
  if (!match) throw new Error('No data-page on YC');
  const decoded = match[1]
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
  const data = JSON.parse(decoded);
  const postings = data.props?.jobPostings || [];
  return postings.slice(0, 5).map(p => ({
    source: 'ycombinator',
    company: p.companyName,
    title: p.title,
    location: p.location,
    url: `https://www.ycombinator.com${p.url}`,
    applyUrl: p.applyUrl || `https://www.ycombinator.com${p.url}`
  }));
}

async function testAll() {
  console.log('Testing Y Combinator direct fetch...');
  const ycJobs = await testLiveYC();
  console.log('YC jobs sample:');
  console.log(ycJobs);

  // Check if the first YC job link is accessible (HTTP 200)
  const testUrl = ycJobs[0]?.url;
  if (testUrl) {
    const checkRes = await fetch(testUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });
    console.log(`Checking YC job URL (${testUrl}): Status ${checkRes.status}`);
  }
}

testAll().catch(console.error);
