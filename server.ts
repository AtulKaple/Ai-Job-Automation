import 'dotenv/config';
import express from 'express';
import path from 'path';
import fs from 'fs';
import { UserProfile, AppSettings, Job, AgentExecutionRun } from './src/types';
import {
  analyzeJobWithGemini,
  tailorResumeWithGemini,
  generateCoverLetterWithGemini,
  prepareApplicationQuestionsWithGemini,
  answerApplicationQuestionsWithProjects
} from './server/gemini';
import { loadProjectDocsFromStorage } from './server/projectDocsLoader';
import { runJobDiscoveryPipeline, generateJobHash } from './server/jobDiscovery';
import { generateApplicationsCsv, generateApplicationsXlsxBuffer, formatJobsToExcelRows } from './server/excelSync';
import {
  connectDatabase,
  getUserProfile,
  saveUserProfile,
  getAppSettings,
  saveAppSettings,
  getJobs,
  getJobById,
  saveJob,
  saveJobsBatch,
  deleteJobById,
  getExecutionRuns,
  saveExecutionRun,
  pruneStaleJobs,
  isDatabaseConnected
} from './server/db';
import { generateResumePdf, compileLatexToPdf } from './server/resumes/pdfGenerator';
import { generateLatexResumeCode, saveResumeLatexFile } from './server/resumes/latexGenerator';
import { browserManager } from './server/browser/browserManager';
import { startScheduler, runScheduledPipeline } from './server/scheduler';
import { startKeepAlive } from './server/keepAlive';

function parseAllowedOrigins(): string[] {
  const configured = [process.env.FRONTEND_URL, process.env.CORS_ORIGIN]
    .filter(Boolean)
    .flatMap(val => String(val).split(','))
    .map(origin => origin.trim().replace(/\/+$/, ''))
    .filter(Boolean);

  if (configured.length === 0) return [];

  const localOrigins = [
    'http://localhost:3000',
    'http://localhost:5173',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:5173'
  ];

  return Array.from(new Set([...configured, ...localOrigins]));
}

async function restoreResumeArtifacts(baseName: string, compilePdf: boolean): Promise<void> {
  const resumesDir = path.join(process.cwd(), 'storage', 'resumes');
  if (!fs.existsSync(resumesDir)) {
    fs.mkdirSync(resumesDir, { recursive: true });
  }

  const jobs = await getJobs();
  const matchingJob = jobs.find(
    j =>
      j.tailoredResume?.versionId === baseName ||
      j.applicationRecord?.resumeVersionId === `${baseName}.pdf` ||
      j.applicationRecord?.resumeVersionId === baseName
  );

  if (!matchingJob) return;

  const profile = await getUserProfile();
  const tailored = matchingJob.tailoredResume;
  const texPath = path.join(resumesDir, `${baseName}.tex`);

  if (!fs.existsSync(texPath)) {
    const latexCode =
      tailored?.latexCode || generateLatexResumeCode(profile, matchingJob, tailored);
    saveResumeLatexFile(baseName, latexCode);
  }

  if (compilePdf) {
    const compiled = await compileLatexToPdf(texPath, resumesDir);
    if (!compiled && tailored) {
      await generateResumePdf(profile, matchingJob, { ...tailored, versionId: baseName });
    }
  }
}

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;
  const allowedOrigins = parseAllowedOrigins();

  app.set('trust proxy', 1);

  // Initialize MongoDB connection (with resilient local storage fallback)
  await connectDatabase();

  // Initialize background scheduler
  startScheduler('0 9 * * *');

  // Cross-origin support for separate frontend hosting (e.g. Render Static Site)
  app.use((req, res, next) => {
    const origin = req.headers.origin;
    if (allowedOrigins.length === 0) {
      res.setHeader('Access-Control-Allow-Origin', '*');
    } else if (origin && allowedOrigins.includes(origin.replace(/\/+$/, ''))) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Vary', 'Origin');
    }

    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
      return res.sendStatus(204);
    }
    next();
  });

  app.use(express.json({ limit: '15mb' }));

  // Static storage files (resumes, screenshots)
  const storageDir = path.join(process.cwd(), 'storage');
  if (!fs.existsSync(storageDir)) fs.mkdirSync(storageDir, { recursive: true });
  app.use('/storage', express.static(storageDir));

  // -------------------------------------------------------------
  // API Routes
  // -------------------------------------------------------------

  // Lightweight keep-alive ping (no database query)
  app.get('/api/ping', (_req, res) => {
    res.json({
      ok: true,
      uptimeSeconds: Math.round(process.uptime()),
      timestamp: new Date().toISOString()
    });
  });

  // Health check
  app.get('/api/health', async (req, res) => {
    const jobs = await getJobs();
    res.json({
      status: 'ok',
      hasGeminiApiKey: Boolean(process.env.GEMINI_API_KEY),
      isDatabaseConnected: isDatabaseConnected(),
      databaseType: isDatabaseConnected() ? 'MongoDB' : 'Resilient Local Storage',
      jobsCount: jobs.length,
      timestamp: new Date().toISOString()
    });
  });

  // User Profile
  app.get('/api/profile', async (req, res) => {
    try {
      const profile = await getUserProfile();
      res.json(profile);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/profile', async (req, res) => {
    try {
      const updated = req.body as Partial<UserProfile>;
      const saved = await saveUserProfile(updated);
      res.json({ success: true, profile: saved });
    } catch (err: any) {
      res.status(400).json({ error: err.message || 'Failed to update profile' });
    }
  });

  // Settings
  app.get('/api/settings', async (req, res) => {
    try {
      const settings = await getAppSettings();
      res.json(settings);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/settings', async (req, res) => {
    try {
      const updated = req.body as Partial<AppSettings>;
      const saved = await saveAppSettings(updated);
      res.json({ success: true, settings: saved });
    } catch (err: any) {
      res.status(400).json({ error: err.message || 'Failed to update settings' });
    }
  });

  // Jobs CRUD
  app.get('/api/jobs', async (req, res) => {
    try {
      const jobs = await getJobs();
      res.json(jobs);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Manual Job Addition
  app.post('/api/jobs/manual', async (req, res) => {
    try {
      const {
        company,
        title,
        location,
        url,
        description,
        salaryMin,
        salaryMax,
        experienceMin,
        experienceMax,
        skills,
        remote
      } = req.body;

      if (!company || !title || !description) {
        return res.status(400).json({ error: 'Company, title, and description are required' });
      }

      const id = `job_manual_${Date.now()}`;
      const parsedSkills = Array.isArray(skills)
        ? skills
        : typeof skills === 'string'
          ? skills.split(',').map(s => s.trim()).filter(Boolean)
          : ['React', 'JavaScript', 'TypeScript'];

      const newJob: Job = {
        id,
        externalId: id,
        source: 'company',
        sourceName: 'Manual Entry',
        company: company.trim(),
        title: title.trim(),
        location: location || 'Remote',
        remote: Boolean(remote ?? (location && location.toLowerCase().includes('remote'))),
        employmentType: 'Full-time',
        salaryMin: Number(salaryMin) || undefined,
        salaryMax: Number(salaryMax) || undefined,
        salaryCurrency: 'INR LPA',
        experienceMin: Number(experienceMin) || 1,
        experienceMax: Number(experienceMax) || 3,
        description: description.trim(),
        requirements: [description.slice(0, 150)],
        skills: parsedSkills,
        url: url || 'https://company.com/careers',
        canonicalUrl: url || `https://company.com/careers/${id}`,
        postedAt: new Date().toISOString(),
        discoveredAt: new Date().toISOString(),
        jobHash: generateJobHash(company, title, location || 'Remote'),
        status: 'DISCOVERED',
        automationMode: 'ASSISTED'
      };

      const userProfile = await getUserProfile();
      const appSettings = await getAppSettings();

      // Automatically trigger analysis for manual job
      try {
        const analysis = await analyzeJobWithGemini(newJob, userProfile);
        newJob.analysis = analysis;
        if (analysis.overallScore >= appSettings.minimumScoreThreshold) {
          newJob.status = 'SHORTLISTED';
        }
      } catch (e) {
        console.warn('Initial analysis error for manual job:', e);
      }

      await saveJob(newJob);
      res.json({ success: true, job: newJob });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to add manual job' });
    }
  });

  // Update Job details
  app.put('/api/jobs/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const existingJobs = await getJobs();
      const job = existingJobs.find(j => j.id === id);
      if (!job) {
        return res.status(404).json({ error: 'Job not found' });
      }
      const updatedJob = { ...job, ...req.body };
      await saveJob(updatedJob);
      res.json({ success: true, job: updatedJob });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Delete Job
  app.delete('/api/jobs/:id', async (req, res) => {
    try {
      const { id } = req.params;
      await deleteJobById(id);
      const remaining = await getJobs();
      res.json({ success: true, remaining: remaining.length });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Trigger Job Discovery (100% Real Live Feeds)
  app.post('/api/jobs/discover', async (req, res) => {
    try {
      const existingJobs = await getJobs();
      const appSettings = await getAppSettings();
      const result = await runJobDiscoveryPipeline(existingJobs, appSettings, 5);

      if (result.newJobs.length > 0) {
        await saveJobsBatch(result.newJobs);
      }

      const allJobs = await getJobs();
      res.json({
        success: true,
        newJobsCount: result.newJobs.length,
        duplicatesSkipped: result.duplicatesSkipped,
        totalDiscovered: result.totalDiscovered,
        jobs: allJobs
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Discovery failed' });
    }
  });

  // Sync Real Jobs Only (Purges any mock seed jobs and fetches fresh live jobs)
  app.post('/api/jobs/sync-real', async (req, res) => {
    try {
      console.log('[JobDiscovery] Fetching fresh live jobs from 20+ platforms (Hiring Cafe, Himalayas, WWR, RemoteOK, YC, WTTJ, Wellfound, Greenhouse, Ashby, Remotive, Jobicy, Glassdoor, ZipRecruiter, Meteor, AIApply, Crossover, Toptal, Handshake, Sprout, Remote For Me)...');
      const existingJobs = await getJobs();
      const appSettings = await getAppSettings();
      const result = await runJobDiscoveryPipeline(existingJobs, appSettings, 4);

      // Save fresh real jobs
      if (result.newJobs.length > 0) {
        await saveJobsBatch(result.newJobs);
      }

      const allJobs = await getJobs();
      // Remove any lingering dummy seed jobs
      const realOnly = allJobs.filter(j => !j.id.startsWith('seed_') && !j.id.startsWith('swiggy_') && !j.id.startsWith('groww_'));
      if (realOnly.length !== allJobs.length) {
        await saveJobsBatch(realOnly);
      }

      res.json({
        success: true,
        message: `Successfully synced ${result.newJobs.length} live jobs across 20+ verified platforms!`,
        newJobsCount: result.newJobs.length,
        count: realOnly.length,
        jobs: realOnly
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Live sync failed' });
    }
  });

  // Prune Stale Unacted Jobs Endpoint
  app.post('/api/jobs/prune', async (req, res) => {
    try {
      const appSettings = await getAppSettings();
      const retentionDays = Number(req.body.days) || appSettings.staleJobRetentionDays || 20;
      const result = await pruneStaleJobs(retentionDays);
      const remainingJobs = await getJobs();

      res.json({
        success: true,
        message: `Pruned ${result.deletedCount} unacted jobs older than ${retentionDays} days.`,
        deletedCount: result.deletedCount,
        remainingCount: remainingJobs.length,
        jobs: remainingJobs
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Pruning failed' });
    }
  });

  // Analyze single or batch jobs
  app.post('/api/jobs/analyze', async (req, res) => {
    try {
      const { jobId } = req.body;
      const userProfile = await getUserProfile();
      const appSettings = await getAppSettings();
      const allJobs = await getJobs();

      if (jobId) {
        const targetJob = allJobs.find(j => j.id === jobId);
        if (!targetJob) {
          return res.status(404).json({ error: 'Job not found' });
        }

        const analysis = await analyzeJobWithGemini(targetJob, userProfile);
        targetJob.analysis = analysis;
        if (analysis.overallScore >= appSettings.minimumScoreThreshold && targetJob.status === 'DISCOVERED') {
          targetJob.status = 'SHORTLISTED';
        }

        await saveJob(targetJob);
        return res.json({ success: true, job: targetJob });
      }

      // Batch analyze up to 5 unanalyzed jobs
      const unanalyzed = allJobs.filter(j => !j.analysis).slice(0, 5);
      for (const job of unanalyzed) {
        try {
          const analysis = await analyzeJobWithGemini(job, userProfile);
          job.analysis = analysis;
          if (analysis.overallScore >= appSettings.minimumScoreThreshold && job.status === 'DISCOVERED') {
            job.status = 'SHORTLISTED';
          }
          await saveJob(job);
        } catch (e) {
          console.warn(`Error analyzing job ${job.id}:`, e);
        }
      }

      const refreshed = await getJobs();
      res.json({ success: true, analyzedCount: unanalyzed.length, jobs: refreshed });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Analysis failed' });
    }
  });

  // Tailor Resume for Job & Generate Real PDF
  app.post('/api/jobs/tailor-resume', async (req, res) => {
    try {
      const { jobId } = req.body;
      const targetJob = await getJobById(jobId);
      if (!targetJob) {
        return res.status(404).json({ error: 'Job not found' });
      }

      const userProfile = await getUserProfile();
      const tailoredResume = await tailorResumeWithGemini(targetJob, userProfile);
      targetJob.tailoredResume = tailoredResume;
      if (targetJob.status === 'SHORTLISTED' || targetJob.status === 'DISCOVERED') {
        targetJob.status = 'RESUME_GENERATED';
      }

      // Generate real ATS-optimized PDF on disk
      try {
        const pdfFile = await generateResumePdf(userProfile, targetJob, tailoredResume);
        targetJob.applicationRecord = {
          ...(targetJob.applicationRecord || { id: `app_${jobId}`, jobId, status: targetJob.status, notes: '' }),
          resumeVersionId: pdfFile.fileName
        };
      } catch (pdfErr) {
        console.warn('[PDF] Error generating PDF resume:', pdfErr);
      }

      await saveJob(targetJob);
      res.json({ success: true, tailoredResume, job: targetJob });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Resume tailoring failed' });
    }
  });

  // Real PDF Resume Generation Endpoint
  app.post('/api/resumes/generate-pdf', async (req, res) => {
    try {
      const { jobId } = req.body;
      const userProfile = await getUserProfile();
      const targetJob = jobId ? await getJobById(jobId) : undefined;

      const pdfResult = await generateResumePdf(
        userProfile,
        targetJob || undefined,
        targetJob?.tailoredResume
      );

      res.json({
        success: true,
        file: pdfResult,
        downloadUrl: `/api/resumes/download/${pdfResult.fileName}`
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'PDF generation failed' });
    }
  });

  // PDF Resume Download Endpoint
  app.get('/api/resumes/download/:filename', async (req, res) => {
    const { filename } = req.params;
    const cleanFilename = path.basename(filename);
    const baseName = cleanFilename.replace(/\.pdf$/, '');
    const resumesDir = path.join(process.cwd(), 'storage', 'resumes');
    const filePath = path.join(resumesDir, cleanFilename);

    if (!fs.existsSync(filePath)) {
      const texPath = path.join(resumesDir, `${baseName}.tex`);
      if (fs.existsSync(texPath)) {
        await compileLatexToPdf(texPath, resumesDir);
      } else {
        await restoreResumeArtifacts(baseName, true);
      }
    }

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Resume PDF file not found' });
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${cleanFilename}"`);
    const stream = fs.createReadStream(filePath);
    stream.pipe(res);
  });

  // LaTeX Resume Download Endpoint (.tex)
  app.get('/api/resumes/download-tex/:filename', async (req, res) => {
    const { filename } = req.params;
    const baseName = path.basename(filename).replace(/\.pdf$/, '').replace(/\.tex$/, '');
    const cleanFilename = `${baseName}.tex`;
    const filePath = path.join(process.cwd(), 'storage', 'resumes', cleanFilename);

    if (!fs.existsSync(filePath)) {
      await restoreResumeArtifacts(baseName, false);
    }

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'LaTeX resume file not found' });
    }

    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${cleanFilename}"`);
    const stream = fs.createReadStream(filePath);
    stream.pipe(res);
  });

  // Generate LaTeX Resume Code on-demand
  app.post('/api/resumes/generate-latex', async (req, res) => {
    try {
      const { jobId } = req.body;
      const userProfile = await getUserProfile();
      const targetJob = jobId ? await getJobById(jobId) : undefined;

      const latexCode = targetJob?.tailoredResume?.latexCode || generateLatexResumeCode(userProfile, targetJob, targetJob?.tailoredResume);
      const versionId = targetJob?.tailoredResume?.versionId || `v_${targetJob?.company ? targetJob.company.toLowerCase().replace(/[^a-z0-9]/g, '') : 'master'}_${Date.now()}`;
      saveResumeLatexFile(versionId, latexCode);

      res.json({
        success: true,
        versionId,
        latexCode,
        downloadUrl: `/api/resumes/download-tex/${versionId}.tex`
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'LaTeX generation failed' });
    }
  });

  // Project Documentation Endpoints
  app.get('/api/projects/docs', async (req, res) => {
    try {
      const profile = await getUserProfile();
      res.json(profile.projectDocs || []);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/projects/docs', async (req, res) => {
    try {
      const profile = await getUserProfile();
      const doc = req.body;
      if (!doc.title) {
        return res.status(400).json({ error: 'Project doc title is required' });
      }

      const currentDocs = profile.projectDocs || [];
      const existingIdx = currentDocs.findIndex(d => d.id === doc.id);
      
      const updatedDoc = {
        ...doc,
        id: doc.id || `doc_${Date.now()}`,
        updatedAt: new Date().toISOString()
      };

      if (existingIdx >= 0) {
        currentDocs[existingIdx] = updatedDoc;
      } else {
        currentDocs.unshift(updatedDoc);
      }

      profile.projectDocs = currentDocs;
      await saveUserProfile(profile);

      res.json({ success: true, doc: updatedDoc, docs: currentDocs });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to save project doc' });
    }
  });

  app.delete('/api/projects/docs/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const profile = await getUserProfile();
      profile.projectDocs = (profile.projectDocs || []).filter(d => d.id !== id);
      await saveUserProfile(profile);

      res.json({ success: true, remaining: (profile.projectDocs || []).length });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Generate Cover Letter
  app.post('/api/jobs/cover-letter', async (req, res) => {
    try {
      const { jobId } = req.body;
      const targetJob = await getJobById(jobId);
      if (!targetJob) {
        return res.status(404).json({ error: 'Job not found' });
      }

      const userProfile = await getUserProfile();
      const coverLetter = await generateCoverLetterWithGemini(targetJob, userProfile);
      targetJob.coverLetter = coverLetter;

      await saveJob(targetJob);
      res.json({ success: true, coverLetter, job: targetJob });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Cover letter generation failed' });
    }
  });

  // Prepare Application Questions
  app.post('/api/jobs/prepare-questions', async (req, res) => {
    try {
      const { jobId, rawQuestions } = req.body;
      const targetJob = await getJobById(jobId);
      if (!targetJob) {
        return res.status(404).json({ error: 'Job not found' });
      }

      const userProfile = await getUserProfile();
      const questions = await prepareApplicationQuestionsWithGemini(targetJob, userProfile, rawQuestions);
      targetJob.questions = questions;

      const hasUserRequired = questions.some(q => q.category === 'USER_REQUIRED' || q.requiresUserApproval);
      if (hasUserRequired && targetJob.status !== 'APPLIED' && targetJob.status !== 'INTERVIEW') {
        targetJob.status = 'HUMAN_REVIEW';
      } else if (targetJob.status !== 'APPLIED' && targetJob.status !== 'INTERVIEW') {
        targetJob.status = 'READY_TO_APPLY';
      }

      await saveJob(targetJob);
      res.json({ success: true, questions, job: targetJob });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Question preparation failed' });
    }
  });

  // Application Copilot: Tailor Resume + Answer Application Questions using Whole Profile & All Projects
  app.post('/api/application-copilot/generate', async (req, res) => {
    try {
      const { jobTitle, company, jobDescription, questions, saveJob: shouldSave } = req.body;
      if (!jobTitle || !jobDescription) {
        return res.status(400).json({ error: 'Job title and description are required' });
      }

      const userProfile = await getUserProfile();
      if (!userProfile.projectDocs || userProfile.projectDocs.length === 0) {
        userProfile.projectDocs = loadProjectDocsFromStorage();
      }

      const companyName = (company && company.trim()) ? company.trim() : 'Target Company';
      const cleanTitle = jobTitle.trim();
      const jobId = `job_copilot_${Date.now()}`;

      // Extract skills from description
      const descLower = jobDescription.toLowerCase();
      const knownSkills = [
        'TypeScript', 'JavaScript', 'React', 'Next.js', 'Node.js', 'Python',
        'PostgreSQL', 'MongoDB', 'Redis', 'Tailwind CSS', 'Docker', 'AWS',
        'GraphQL', 'REST', 'WebSockets', 'Convex', 'Liveblocks', 'CRDT',
        'Jest', 'Vitest', 'Zod', 'Prisma', 'Google Gemini', 'OpenAI'
      ];
      const detectedSkills = knownSkills.filter(s => descLower.includes(s.toLowerCase()));
      const skillsToUse = detectedSkills.length >= 3 ? detectedSkills : ['TypeScript', 'React', 'Node.js', 'Next.js', 'PostgreSQL'];

      const targetJob: Job = {
        id: jobId,
        externalId: jobId,
        source: 'company',
        sourceName: 'Application Copilot',
        company: companyName,
        title: cleanTitle,
        location: 'Remote / Flexible',
        remote: true,
        employmentType: 'Full-time',
        experienceMin: 1,
        experienceMax: 3,
        description: jobDescription.trim(),
        requirements: [jobDescription.slice(0, 300)],
        skills: skillsToUse,
        url: 'https://company.com/apply',
        canonicalUrl: `https://company.com/apply/${jobId}`,
        postedAt: new Date().toISOString(),
        discoveredAt: new Date().toISOString(),
        jobHash: generateJobHash(companyName, cleanTitle, 'Remote'),
        status: 'READY_TO_APPLY',
        automationMode: 'ASSISTED'
      };

      // 1. Tailor Resume with Gemini (strict ATS rules, project selection from projectDocs, 3.8 flash high priority cascade)
      const tailoredResume = await tailorResumeWithGemini(targetJob, userProfile);
      targetJob.tailoredResume = tailoredResume;

      // 2. Generate real ATS PDF & LaTeX .tex file
      let pdfFileName = `${tailoredResume.versionId}.pdf`;
      try {
        const pdfFile = await generateResumePdf(userProfile, targetJob, tailoredResume);
        pdfFileName = pdfFile.fileName;
        targetJob.applicationRecord = {
          id: `app_${jobId}`,
          jobId,
          status: 'READY_TO_APPLY',
          resumeVersionId: pdfFileName,
          notes: `Generated via Application Copilot for ${cleanTitle} at ${companyName}`
        };
      } catch (pdfErr) {
        console.warn('[Copilot] PDF generation warning:', pdfErr);
      }

      // 3. Process Application Questions with Whole Profile + All Project Documentation
      const inputQuestions = Array.isArray(questions) && questions.length > 0
        ? questions.map((q: any, idx: number) => ({
            id: q.id || `q_${idx + 1}`,
            question: typeof q === 'string' ? q : (q.question || ''),
            category: q.category
          })).filter((q: any) => q.question.trim().length > 0)
        : [
            { id: 'q_1', question: `Why are you interested in this ${cleanTitle} role at ${companyName}?` },
            { id: 'q_2', question: 'Describe a challenging technical problem you solved, your approach, and the outcome.' },
            { id: 'q_3', question: 'What experience do you have with real-time systems, state synchronization, and scalable web architectures?' },
            { id: 'q_4', question: 'What is your current notice period and CTC expectation?' }
          ];

      const answeredQuestions = await answerApplicationQuestionsWithProjects(targetJob, userProfile, inputQuestions);

      targetJob.questions = answeredQuestions.map(q => ({
        id: q.id,
        question: q.question,
        category: (q.category as any) || 'AI_DRAFT',
        suggestedAnswer: q.suggestedAnswer,
        confidence: q.confidence || 0.95,
        requiresUserApproval: true,
        fieldType: 'textarea',
        notes: q.keyHighlights?.join('; ')
      }));

      // 4. Optionally save to database
      if (shouldSave !== false) {
        await saveJob(targetJob);
      }

      res.json({
        success: true,
        job: targetJob,
        tailoredResume: {
          ...tailoredResume,
          pdfUrl: `/api/resumes/download/${pdfFileName}`,
          texUrl: `/api/resumes/download-tex/${tailoredResume.versionId}.tex`,
          fileName: pdfFileName
        },
        questions: answeredQuestions
      });
    } catch (err: any) {
      console.error('[Copilot] Generation error:', err);
      res.status(500).json({ error: err.message || 'Failed to generate tailored application' });
    }
  });

  // Answer additional questions for a specific role / description on the fly
  app.post('/api/application-copilot/answer-questions', async (req, res) => {
    try {
      const { jobId, jobTitle, company, jobDescription, questions } = req.body;
      const userProfile = await getUserProfile();
      if (!userProfile.projectDocs || userProfile.projectDocs.length === 0) {
        userProfile.projectDocs = loadProjectDocsFromStorage();
      }

      let targetJob: Job | null = null;
      if (jobId) {
        targetJob = await getJobById(jobId);
      }

      if (!targetJob) {
        const companyName = (company && company.trim()) ? company.trim() : 'Target Company';
        const cleanTitle = (jobTitle && jobTitle.trim()) ? jobTitle.trim() : 'Software Engineer';
        targetJob = {
          id: `job_copilot_${Date.now()}`,
          externalId: `job_copilot_${Date.now()}`,
          source: 'company',
          sourceName: 'Application Copilot',
          company: companyName,
          title: cleanTitle,
          location: 'Remote',
          remote: true,
          employmentType: 'Full-time',
          experienceMin: 1,
          experienceMax: 3,
          description: jobDescription || 'Full stack engineering position.',
          requirements: [],
          skills: ['TypeScript', 'React', 'Node.js'],
          url: '',
          canonicalUrl: '',
          postedAt: new Date().toISOString(),
          discoveredAt: new Date().toISOString(),
          jobHash: '',
          status: 'READY_TO_APPLY',
          automationMode: 'ASSISTED'
        };
      }

      const inputQuestions = Array.isArray(questions) ? questions : [{ question: questions }];
      const answered = await answerApplicationQuestionsWithProjects(targetJob, userProfile, inputQuestions);

      res.json({ success: true, questions: answered });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to answer questions' });
    }
  });

  // Update Job Status
  app.post('/api/jobs/update-status', async (req, res) => {
    try {
      const { jobId, status, notes, interviewDate, applicationUrl } = req.body;
      const targetJob = await getJobById(jobId);
      if (!targetJob) {
        return res.status(404).json({ error: 'Job not found' });
      }

      targetJob.status = status;
      if (!targetJob.applicationRecord) {
        targetJob.applicationRecord = {
          id: `app_${jobId}`,
          jobId,
          status,
          notes: notes || ''
        };
      }

      targetJob.applicationRecord.status = status;
      if (notes) targetJob.applicationRecord.notes = notes;
      if (applicationUrl) targetJob.applicationRecord.applicationUrl = applicationUrl;
      if (interviewDate) targetJob.applicationRecord.interviewDate = interviewDate;

      if (status === 'APPLIED' && !targetJob.applicationRecord.appliedAt) {
        targetJob.applicationRecord.appliedAt = new Date().toISOString();
        targetJob.applicationRecord.followUpDate = new Date(Date.now() + 7 * 86400000).toISOString();
      }

      await saveJob(targetJob);
      res.json({ success: true, job: targetJob });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to update status' });
    }
  });

  // Application Submission Engine (Playwright Auto & Assisted Apply)
  app.post('/api/applications/apply', async (req, res) => {
    try {
      const { jobId, answers, notes, runBrowserAutomation, autoSubmit } = req.body;
      const targetJob = await getJobById(jobId);
      if (!targetJob) {
        return res.status(404).json({ error: 'Job not found' });
      }

      const userProfile = await getUserProfile();
      const appSettings = await getAppSettings();

      // Ensure a real PDF resume exists on disk
      let pdfFilePath: string | undefined;
      try {
        const pdfResult = await generateResumePdf(userProfile, targetJob, targetJob.tailoredResume);
        pdfFilePath = pdfResult.filePath;
      } catch (e) {
        console.warn('[Apply] Could not generate PDF resume for attachment:', e);
      }

      // Update question answers if provided
      if (answers && Array.isArray(answers) && targetJob.questions) {
        targetJob.questions = targetJob.questions.map(q => {
          const match = answers.find((a: any) => a.id === q.id);
          return match ? { ...q, userAnswer: match.userAnswer } : q;
        });
      }

      let automationResult: any = null;

      // Run real Playwright Browser Automation if enabled or requested
      if (runBrowserAutomation || appSettings.autoApplyMode !== 'OFF') {
        try {
          automationResult = await browserManager.applyToJob(targetJob, userProfile, {
            resumeFilePath: pdfFilePath,
            headless: true,
            autoSubmit: Boolean(autoSubmit && appSettings.autoApplyMode === 'PERMITTED_AUTO')
          });

          targetJob.status = automationResult.status;
        } catch (autoErr: any) {
          console.warn('[Apply] Browser automation error:', autoErr);
          targetJob.status = 'HUMAN_REVIEW';
        }
      } else {
        // Standard safe mark as applied
        targetJob.status = 'APPLIED';
      }

      const appliedTimestamp = new Date().toISOString();
      if (!targetJob.applicationRecord) {
        targetJob.applicationRecord = {
          id: `app_${jobId}_${Date.now()}`,
          jobId,
          status: targetJob.status,
          appliedAt: targetJob.status === 'APPLIED' ? appliedTimestamp : undefined,
          followUpDate: new Date(Date.now() + 7 * 86400000).toISOString(),
          applicationUrl: targetJob.url,
          resumeVersionId: pdfFilePath ? path.basename(pdfFilePath) : 'Master_v1.0',
          coverLetterId: targetJob.coverLetter?.id,
          notes: notes || `Processed via JobPilot AI (${targetJob.sourceName})`,
          submissionLog: automationResult?.logs || [
            `[${new Date().toLocaleTimeString()}] Application initiated for ${targetJob.company}`,
            `[${new Date().toLocaleTimeString()}] Attached Tailored Resume: ${pdfFilePath ? path.basename(pdfFilePath) : 'Master Profile'}`,
            `[${new Date().toLocaleTimeString()}] Recorded in database & Excel tracker (Status: ${targetJob.status})`
          ]
        };
      } else {
        targetJob.applicationRecord.status = targetJob.status;
        if (targetJob.status === 'APPLIED') targetJob.applicationRecord.appliedAt = appliedTimestamp;
        if (notes) targetJob.applicationRecord.notes = notes;
        if (automationResult?.logs) {
          targetJob.applicationRecord.submissionLog = [
            ...(targetJob.applicationRecord.submissionLog || []),
            ...automationResult.logs
          ];
        }
      }

      await saveJob(targetJob);
      const allJobs = await getJobs();

      res.json({
        success: true,
        message: targetJob.status === 'APPLIED' 
          ? `Successfully applied to ${targetJob.company} and logged to Excel Tracker!`
          : `Application staged for human review (${automationResult?.message || 'Awaiting manual confirmation'})`,
        job: targetJob,
        automationResult,
        excelRowCount: allJobs.length
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Application submission failed' });
    }
  });

  // Launch Assisted Browser Directly on User Screen
  app.post('/api/browser/launch-assisted', async (req, res) => {
    try {
      const { url } = req.body;
      if (!url) return res.status(400).json({ error: 'URL is required' });
      await browserManager.launchAssistedBrowser(url);
      res.json({ success: true, message: 'Assisted browser launched on your screen' });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Could not launch assisted browser' });
    }
  });

  // Full End-to-End Automated Pipeline Runner
  app.post('/api/pipeline/run', async (req, res) => {
    try {
      const runRecord = await runScheduledPipeline();
      const allJobs = await getJobs();
      res.json({
        success: true,
        run: runRecord,
        jobs: allJobs
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Pipeline run failed' });
    }
  });

  // Excel XLSX Export Endpoint (Binary workbook)
  app.get('/api/excel/export-xlsx', async (req, res) => {
    try {
      const jobs = await getJobs();
      const buffer = await generateApplicationsXlsxBuffer(jobs);
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename=JobPilot_Applications_Tracker_${new Date().toISOString().slice(0, 10)}.xlsx`);
      res.send(buffer);
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'XLSX export failed' });
    }
  });

  // Excel CSV Export Endpoint
  app.get('/api/excel/export', async (req, res) => {
    try {
      const jobs = await getJobs();
      const csvData = generateApplicationsCsv(jobs);
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename=JobPilot_Applications_${new Date().toISOString().slice(0, 10)}.csv`);
      res.send(csvData);
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Excel export failed' });
    }
  });

  // Tabular Data for In-App Excel Preview
  app.get('/api/excel/data', async (req, res) => {
    try {
      const jobs = await getJobs();
      const rows = formatJobsToExcelRows(jobs);
      res.json({ success: true, count: rows.length, rows });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Execution Runs
  app.get('/api/runs', async (req, res) => {
    try {
      const runs = await getExecutionRuns();
      res.json(runs);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // -------------------------------------------------------------
  // Vite / Static Middleware
  // -------------------------------------------------------------
  const isProduction = process.env.NODE_ENV === 'production' || process.env.RENDER === 'true';

  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    const indexHtmlPath = path.join(distPath, 'index.html');
    const shouldServeClient =
      process.env.SERVE_STATIC !== 'false' && fs.existsSync(indexHtmlPath);

    if (shouldServeClient) {
      app.use(express.static(distPath));
      app.get('*', (_req, res) => {
        res.sendFile(indexHtmlPath);
      });
    } else {
      app.get('/', (_req, res) => {
        res.json({
          service: 'JobPilot AI Backend',
          status: 'ok',
          health: '/api/health',
          timestamp: new Date().toISOString()
        });
      });
    }
  }

  app.listen(PORT, '0.0.0.0', async () => {
    console.log(`JobPilot AI backend server running on http://0.0.0.0:${PORT}`);

    // Keep Render free tier awake by self-pinging RENDER_EXTERNAL_URL / KEEP_ALIVE_URL
    startKeepAlive();

    // Auto-prune stale unacted jobs on boot if any exist
    try {
      const settings = await getAppSettings();
      await pruneStaleJobs(settings.staleJobRetentionDays || 20);
    } catch (e: any) {
      console.log('[JobCleaner] Stale job pruning check handled:', e?.message || e);
    }
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
});
