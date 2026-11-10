async function testRealAdapters() {
  console.log('--- 1. Testing Y Combinator (direct https://www.ycombinator.com/jobs) ---');
  try {
    const res = await fetch('https://www.ycombinator.com/jobs', {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
    });
    const html = await res.text();
    const match = html.match(/data-page="([^"]+)"/);
    if (match) {
      const decoded = match[1].replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
      const data = JSON.parse(decoded);
      const jobs = data.props?.jobPostings || [];
      console.log('YC live jobs count:', jobs.length);
      console.log('Sample YC job:', {
        company: jobs[0]?.companyName,
        title: jobs[0]?.title,
        url: `https://www.ycombinator.com${jobs[0]?.url}`
      });
    }
  } catch (e) { console.error('YC error:', e.message); }

  console.log('--- 2. Testing Lever API ---');
  try {
    const res = await fetch('https://api.lever.co/v0/postings/spotify?mode=json');
    const jobs = await res.json();
    console.log('Lever Spotify jobs count:', jobs.length);
    console.log('Sample Lever job:', {
      company: 'Spotify',
      title: jobs[0]?.text,
      url: jobs[0]?.hostedUrl
    });
  } catch (e) { console.error('Lever error:', e.message); }

  console.log('--- 3. Testing Greenhouse API ---');
  try {
    const res = await fetch('https://boards-api.greenhouse.io/v1/boards/gitlab/jobs?content=true');
    const data = await res.json();
    console.log('Greenhouse GitLab jobs count:', data.jobs?.length);
    console.log('Sample Greenhouse job:', {
      company: 'GitLab',
      title: data.jobs?.[0]?.title,
      url: data.jobs?.[0]?.absolute_url
    });
  } catch (e) { console.error('Greenhouse error:', e.message); }

  console.log('--- 4. Testing Ashby API ---');
  try {
    const res = await fetch('https://api.ashbyhq.com/posting-api/job-board/linear');
    const data = await res.json();
    console.log('Ashby Linear jobs count:', data.jobs?.length);
    console.log('Sample Ashby job:', {
      company: 'Linear',
      title: data.jobs?.[0]?.title,
      url: data.jobs?.[0]?.jobUrl
    });
  } catch (e) { console.error('Ashby error:', e.message); }

  console.log('--- 5. Testing Jobicy API ---');
  try {
    const res = await fetch('https://jobicy.com/api/v2/remote-jobs?count=5&tag=react');
    const data = await res.json();
    console.log('Jobicy jobs count:', data.jobs?.length);
    console.log('Sample Jobicy job:', {
      company: data.jobs?.[0]?.companyName,
      title: data.jobs?.[0]?.jobTitle,
      url: data.jobs?.[0]?.url
    });
  } catch (e) { console.error('Jobicy error:', e.message); }

  console.log('--- 6. Testing RemoteOK API ---');
  try {
    const res = await fetch('https://remoteok.com/api', { headers: { 'User-Agent': 'JobPilot/1.0' } });
    const data = await res.json();
    const jobs = data.slice(1);
    console.log('RemoteOK jobs count:', jobs.length);
    console.log('Sample RemoteOK job:', {
      company: jobs[0]?.company,
      title: jobs[0]?.position,
      url: jobs[0]?.url || `https://remoteok.com/remote-jobs/${jobs[0]?.id}`
    });
  } catch (e) { console.error('RemoteOK error:', e.message); }
}

testRealAdapters();
