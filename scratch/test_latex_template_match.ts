import { getUserProfile, getJobById } from '../server/db';
import { generateLatexResumeCode, saveResumeLatexFile } from '../server/resumes/latexGenerator';
import { generateResumePdf } from '../server/resumes/pdfGenerator';
import fs from 'fs';
import path from 'path';

async function verifyLatexTemplate() {
  const profile = await getUserProfile();
  const latex = generateLatexResumeCode(profile);
  console.log('=== GENERATED LATEX SAMPLE (First 40 lines) ===');
  console.log(latex.split('\n').slice(0, 40).join('\n'));

  console.log('\n=== CHECKING MACROS AND STRUCTURE ===');
  const requiredMarkers = [
    '\\documentclass[letterpaper,9pt]{extarticle}',
    '\\newcommand{\\resumeItem}[1]{',
    '\\newcommand{\\resumeSubheading}[4]{',
    '\\newcommand{\\resumeProjectHeading}[2]{',
    '\\newcommand{\\resumeProjectLabel}[1]{',
    '\\begin{center}    {\\Huge \\scshape Atul Kaple}',
    '\\section{Professional Summary}',
    '\\section{Technical Skills}',
    '\\section{Experience}',
    '\\resumeSubheading\n      {SidLabs LLP}{Nov 2024 -- Present}',
    '\\resumeProjectLabel{Legal Case Automation (Next.js, Node.js, Google Gemini)}',
    '\\resumeProjectLabel{Patient Community Network (React, TypeScript, Node.js, Socket.io, Redis)}',
    '\\resumeProjectLabel{Healthcare Research Application (React, TypeScript, Node.js, AWS)}',
    '\\resumeProjectLabel{Environmental Monitoring Dashboard (Next.js, Leaflet, Node.js, MongoDB)}',
    '\\resumeProjectLabel{Financial Projection Tool (React, Node.js, ExcelJS, MongoDB)}',
    '\\section{Personal Project}',
    'Collaborative Whiteboard Application',
    '\\section{Education}',
    '\\end{document}'
  ];

  let allPass = true;
  for (const marker of requiredMarkers) {
    if (!latex.includes(marker)) {
      console.error(`FAIL: Missing marker: "${marker}"`);
      allPass = false;
    } else {
      console.log(`PASS: Found marker: "${marker.slice(0, 35)}..."`);
    }
  }

  const versionId = 'v_template_verify_test';
  saveResumeLatexFile(versionId, latex);
  console.log(`Saved LaTeX file: storage/resumes/${versionId}.tex`);

  const pdfResult = await generateResumePdf(profile);
  if (pdfResult && fs.existsSync(pdfResult.filePath)) {
    console.log(`PDF successfully generated: ${pdfResult.filePath} (${pdfResult.fileSize} bytes)`);
  } else {
    console.warn(`PDF generation returned:`, pdfResult);
  }

  console.log(`\nOVERALL VERIFICATION RESULT: ${allPass ? 'ALL TESTS PASSED' : 'SOME TESTS FAILED'}`);
}

verifyLatexTemplate().catch(console.error);
