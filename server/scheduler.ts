import cron, { ScheduledTask } from 'node-cron';
import { getAppSettings, getJobs, getUserProfile, saveExecutionRun, saveJobsBatch, pruneStaleJobs } from './db';
import { runJobDiscoveryPipeline } from './jobDiscovery';
import { analyzeJobWithGemini, tailorResumeWithGemini, generateCoverLetterWithGemini, prepareApplicationQuestionsWithGemini } from './gemini';
import { generateResumePdf } from './resumes/pdfGenerator';
import { AgentExecutionRun } from '../src/types';

let cronTask: ScheduledTask | null = null;
let isJobRunning = false;

/**
 * Execute the automated background job cycle
 */
export async function runScheduledPipeline(): Promise<AgentExecutionRun> {
  if (isJobRunning) {
    console.log('[Scheduler] Pipeline is already running, skipping overlapping execution.');
    return {
      id: `skip_${Date.now()}`,
      type: 'FULL_PIPELINE',
      startedAt: new Date().toISOString(),
      status: 'PARTIAL',
      jobsProcessed: 0,
      jobsSucceeded: 0,
      jobsFailed: 0,
      logs: ['Overlapping execution skipped']
    };
  }

  isJobRunning = true;
  const runId = `sched_${Date.now()}`;
  const logs: string[] = [];
  const runRecord: AgentExecutionRun = {
    id: runId,
    type: 'FULL_PIPELINE',
    startedAt: new Date().toISOString(),
    status: 'RUNNING',
    jobsProcessed: 0,
    jobsSucceeded: 0,
    jobsFailed: 0,
    logs: []
  };

  try {
    logs.push(`[Scheduler] ⏰ Scheduled job pipeline initiated at ${new Date().toLocaleTimeString()}`);
    const settings = await getAppSettings();
    const profile = await getUserProfile();

    // 0. Auto-prune stale unacted jobs older than retention threshold (protects APPLIED, INTERVIEW, etc.)
    const retentionDays = settings.staleJobRetentionDays || 20;
    const pruneResult = await pruneStaleJobs(retentionDays);
    if (pruneResult.deletedCount > 0) {
      logs.push(`🧹 Auto-pruned ${pruneResult.deletedCount} unacted jobs older than ${retentionDays} days.`);
    }

    const existingJobs = await getJobs();

    // 1. Discovery
    logs.push(`[Scheduler] Discovering jobs across live endpoints...`);
    const discoveryResult = await runJobDiscoveryPipeline(existingJobs, settings, 2);
    let currentJobs = existingJobs;
    if (discoveryResult.newJobs.length > 0) {
      currentJobs = [...discoveryResult.newJobs, ...existingJobs];
      await saveJobsBatch(discoveryResult.newJobs);
      logs.push(`[Scheduler] Discovered ${discoveryResult.newJobs.length} new jobs.`);
    }

    // 2. Score unanalyzed jobs
    const unanalyzed = currentJobs.filter(j => !j.analysis).slice(0, settings.dailyAnalysisLimit || 10);
    logs.push(`[Scheduler] Scoring ${unanalyzed.length} unanalyzed jobs with Gemini...`);

    for (const job of unanalyzed) {
      try {
        const analysis = await analyzeJobWithGemini(job, profile);
        job.analysis = analysis;
        runRecord.jobsProcessed++;
        runRecord.jobsSucceeded++;

        if (analysis.overallScore >= settings.minimumScoreThreshold && job.status === 'DISCOVERED') {
          job.status = 'SHORTLISTED';
          // Auto-tailor resume and generate PDF
          const tailored = await tailorResumeWithGemini(job, profile);
          job.tailoredResume = tailored;
          await generateResumePdf(profile, job, tailored);

          const cover = await generateCoverLetterWithGemini(job, profile);
          job.coverLetter = cover;

          const questions = await prepareApplicationQuestionsWithGemini(job, profile);
          job.questions = questions;
          const hasUserRequired = questions.some(q => q.category === 'USER_REQUIRED' || q.requiresUserApproval);
          job.status = hasUserRequired ? 'HUMAN_REVIEW' : 'READY_TO_APPLY';
          logs.push(`[Scheduler] Prepared application for ${job.company} (${job.title}) - Status: ${job.status}`);
        }
      } catch (e: any) {
        runRecord.jobsFailed++;
        logs.push(`[Scheduler] Scoring failed for ${job.company}: ${e.message}`);
      }
    }

    await saveJobsBatch(currentJobs);

    runRecord.status = 'COMPLETED';
    runRecord.completedAt = new Date().toISOString();
    runRecord.logs = logs;
    await saveExecutionRun(runRecord);
    console.log('[Scheduler] Scheduled pipeline run completed successfully.');
    return runRecord;
  } catch (err: any) {
    runRecord.status = 'FAILED';
    runRecord.error = err.message;
    runRecord.completedAt = new Date().toISOString();
    runRecord.logs.push(`[Scheduler] ❌ Pipeline failure: ${err.message}`);
    await saveExecutionRun(runRecord);
    return runRecord;
  } finally {
    isJobRunning = false;
  }
}

/**
 * Initialize background scheduler (Defaults to 09:00 AM daily or custom cron)
 */
export function startScheduler(cronExpression = '0 9 * * *'): void {
  if (cronTask) {
    cronTask.stop();
  }

  cronTask = cron.schedule(cronExpression, async () => {
    console.log(`[Scheduler] Triggering cron job (${cronExpression})...`);
    await runScheduledPipeline();
  });

  console.log(`✅ [Scheduler] Background job scheduler active. Schedule: "${cronExpression}"`);
}

export function stopScheduler(): void {
  if (cronTask) {
    cronTask.stop();
    cronTask = null;
    console.log('[Scheduler] Background job scheduler stopped.');
  }
}
