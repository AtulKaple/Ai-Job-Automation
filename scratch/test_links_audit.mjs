async function testEndpoints() {
  console.log('--- 1. Testing Himalayas ---');
  try {
    const res = await fetch('https://himalayas.app/jobs/api?limit=5', { signal: AbortSignal.timeout(5000) });
    const data = await res.json();
    const jobs = data.jobs || [];
    console.log('Himalayas sample URL:', jobs[0]?.applicationLink, 'GUID:', jobs[0]?.guid);
  } catch (e) { console.log('Himalayas error:', e.message); }

  console.log('--- 2. Testing RemoteOK ---');
  try {
    const res = await fetch('https://remoteok.com/api', {
      headers: { 'User-Agent': 'JobPilot/1.0' },
      signal: AbortSignal.timeout(5000)
    });
    const data = await res.json();
    const jobs = data.slice(1, 5);
    console.log('RemoteOK sample URL:', jobs[0]?.url, jobs[0]?.apply_url);
  } catch (e) { console.log('RemoteOK error:', e.message); }

  console.log('--- 3. Testing WeWorkRemotely RSS ---');
  try {
    const res = await fetch('https://weworkremotely.com/categories/remote-programming-jobs.rss', { signal: AbortSignal.timeout(5000) });
    const text = await res.text();
    const linkMatch = text.match(/<link>([^<]+)<\/link>/g);
    console.log('WWR sample link:', linkMatch?.slice(1, 3));
  } catch (e) { console.log('WWR error:', e.message); }

  console.log('--- 4. Testing Remotive ---');
  try {
    const res = await fetch('https://remotive.com/api/remote-jobs?category=software-dev&limit=5', { signal: AbortSignal.timeout(5000) });
    const data = await res.json();
    console.log('Remotive sample URL:', data.jobs?.[0]?.url);
  } catch (e) { console.log('Remotive error:', e.message); }

  console.log('--- 5. Testing Jobicy ---');
  try {
    const res = await fetch('https://jobicy.com/api/v2/remote-jobs?count=5&tag=react', { signal: AbortSignal.timeout(5000) });
    const data = await res.json();
    console.log('Jobicy sample URL:', data.jobs?.[0]?.url);
  } catch (e) { console.log('Jobicy error:', e.message); }

  console.log('--- 6. Testing Greenhouse ---');
  try {
    const res = await fetch('https://boards-api.greenhouse.io/v1/boards/gitlab/jobs?content=true', { signal: AbortSignal.timeout(5000) });
    const data = await res.json();
    console.log('Greenhouse sample URL:', data.jobs?.[0]?.absolute_url);
  } catch (e) { console.log('Greenhouse error:', e.message); }

  console.log('--- 7. Testing Ashby ---');
  try {
    const res = await fetch('https://api.ashbyhq.com/posting-api/job-board/linear', { signal: AbortSignal.timeout(5000) });
    const data = await res.json();
    console.log('Ashby sample URL:', data.jobs?.[0]?.jobUrl);
  } catch (e) { console.log('Ashby error:', e.message); }
}

testEndpoints();
