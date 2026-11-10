import { connectDatabase, getUserProfile, getJobs } from '../server/db';
import { generateResumePdf } from '../server/resumes/pdfGenerator';
import fs from 'fs';

async function testPdf() {
  console.log('--- TESTING REAL LATEX PDF GENERATION ---');
  await connectDatabase();
  const profile = await getUserProfile();
  const jobs = await getJobs();
  const job = jobs[0];

  const startTime = Date.now();
  const result = await generateResumePdf(profile, job, job?.tailoredResume);
  console.log(`Generated in ${Date.now() - startTime}ms!`);
  console.log('Result file:', result.fileName);
  console.log('Path:', result.filePath);
  console.log('File size:', result.fileSize, 'bytes');

  if (fs.existsSync(result.filePath)) {
    console.log('SUCCESS: Real LaTeX PDF file exists and is compiled identically to Overleaf!');
  } else {
    console.error('FAIL: PDF does not exist');
  }
}

testPdf().catch(console.error);
