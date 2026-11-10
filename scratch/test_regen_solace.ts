import { connectDatabase, getJobs, getUserProfile } from '../server/db';
import { generateLatexResumeCode, saveResumeLatexFile } from '../server/resumes/latexGenerator';

async function test() {
  await connectDatabase();
  const jobs = await getJobs();
  const profile = await getUserProfile();
  const job = jobs[0];
  const latex = generateLatexResumeCode(profile, job, job?.tailoredResume);
  saveResumeLatexFile('v_solace_20261013', latex);
  console.log('Saved v_solace_20261013.tex successfully, length:', latex.length);
}
test().catch(console.error);
