async function checkUrls() {
  const tests = [
    { name: 'YC', url: 'https://www.ycombinator.com/companies/middleware/jobs/8l5TKYq-founding-ai-engineer' },
    { name: 'Greenhouse', url: 'https://job-boards.greenhouse.io/gitlab/jobs/8860302002' },
    { name: 'Ashby', url: 'https://jobs.ashbyhq.com/linear/d3bc1ced-3ce4-4086-a050-555055dbb1ff' },
    { name: 'Lever', url: 'https://jobs.lever.co/spotify/223f9722-3579-4ff2-b123-e4cc7b0c1a64' },
    { name: 'RemoteOK', url: 'https://remoteok.com/remote-jobs/1137510' },
    { name: 'WeWorkRemotely', url: 'https://weworkremotely.com/remote-jobs/hr-plus-web-developer-fresh-graduate-welcome-wfh-policy-on-job-training' },
    { name: 'Himalayas', url: 'https://himalayas.app/companies/gainwell-technologies/jobs/associate-manager-clinical-quality-prior-authorization-remote-any-city-fl' },
    { name: 'Jobicy', url: 'https://jobicy.com/jobs/155262-software-developer-mobile-platform' },
    { name: 'Remotive', url: 'https://remotive.com/remote-jobs/marketing/remote-office-assistant-1680495' }
  ];

  for (const t of tests) {
    try {
      const res = await fetch(t.url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
        signal: AbortSignal.timeout(6000)
      });
      console.log(`[${t.name}] ${t.url} -> Status: ${res.status}`);
    } catch (e) {
      console.log(`[${t.name}] ${t.url} -> Error: ${e.message}`);
    }
  }
}

checkUrls();
