import { runJobDiscoveryPipeline } from '../server/jobDiscovery';

async function test() {
  console.log('Running test discovery across live adapters...');
  const settings = {
    targetRoles: ['Frontend Developer', 'Full Stack Developer', 'React Developer'],
    targetLocations: ['Remote'],
    excludedCompanies: [],
    excludedKeywords: []
  };

  const result = await runJobDiscoveryPipeline([], settings, 2);
  console.log(`Discovered ${result.newJobs.length} jobs.`);

  console.log('\n--- Sample of Discovered Jobs and their URLs ---');
  for (const j of result.newJobs.slice(0, 10)) {
    console.log(`[${j.source}] ${j.company} - ${j.title}`);
    console.log(`       URL: ${j.url}`);
    console.log(`Canonical: ${j.canonicalUrl}\n`);
  }

  // Check YC jobs specifically
  const ycJobs = result.newJobs.filter(j => j.source === 'ycombinator');
  console.log(`Total YC jobs: ${ycJobs.length}`);
  for (const j of ycJobs) {
    console.log(`YC: ${j.company} -> ${j.url}`);
  }
}

test().catch(console.error);
