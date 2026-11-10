import React, { useState } from 'react';
import { 
  AlertTriangle, 
  CheckCircle2, 
  ExternalLink, 
  FileText, 
  Sparkles, 
  Send, 
  XCircle, 
  ShieldAlert,
  ChevronRight,
  Edit3,
  ShieldCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import { Job, UserProfile } from '../types';
import { openExternalJobApplication } from '../utils/urlUtils';

interface HumanReviewQueueViewProps {
  jobs: Job[];
  profile: UserProfile;
  onSelectJob: (job: Job) => void;
  onUpdateStatus: (jobId: string, status: any, notes?: string) => Promise<void>;
  onTailorResume: (jobId: string) => Promise<void>;
}

export default function HumanReviewQueueView({
  jobs,
  profile,
  onSelectJob,
  onUpdateStatus,
  onTailorResume,
}: HumanReviewQueueViewProps) {
  const reviewJobs = jobs.filter(j => j.status === 'HUMAN_REVIEW');

  const handleApply = async (job: Job) => {
    confetti({
      particleCount: 80,
      spread: 60,
      origin: { y: 0.6 }
    });
    await onUpdateStatus(job.id, 'APPLIED', 'Verified and submitted after Human Review');
  };

  const handleSkip = async (job: Job) => {
    await onUpdateStatus(job.id, 'SKIPPED', 'Skipped in Human Review queue');
  };

  return (
    <div className="space-y-5 pb-12">
      {/* Header Banner */}
      <motion.div 
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-4 rounded-xl bg-slate-850/70 border border-amber-500/25 flex flex-col md:flex-row md:items-center justify-between gap-4"
      >
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-amber-400" />
            <h1 className="text-sm font-semibold text-white tracking-tight">
              Human-in-the-Loop Verification Queue
            </h1>
          </div>
          <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">
            Strict safety policy: Agent stages candidate answers, compensation questions, and security gates for human authorization before dispatch.
          </p>
        </div>

        <div className="px-3 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300 font-mono text-xs font-semibold shrink-0">
          {reviewJobs.length} Positions Pending Approval
        </div>
      </motion.div>

      {reviewJobs.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-slate-850/40 border border-slate-800 space-y-3">
          <CheckCircle2 className="h-8 w-8 text-emerald-400 mx-auto" />
          <h3 className="text-sm font-medium text-slate-200">Review queue is clear</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            All current job applications have either been safely processed or do not require manual intervention.
          </p>
        </div>
      ) : (
        <div className="space-y-3.5">
          <AnimatePresence>
            {reviewJobs.map((job) => {
              const score = job.analysis?.overallScore || 0;
              const userRequiredQuestions = (job.questions || []).filter(
                q => q.category === 'USER_REQUIRED' || q.category === 'AI_DRAFT' || q.requiresUserApproval
              );

              return (
                <motion.div
                  key={job.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  className="p-4 rounded-xl bg-slate-850/50 border border-amber-500/20 hover:border-amber-500/35 transition-all space-y-3.5 shadow-sm"
                >
                  {/* Header row */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800">
                    <div className="space-y-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold text-white text-sm truncate">{job.company}</span>
                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 border border-slate-750">
                          {job.sourceName || job.source}
                        </span>
                        <span className="text-xs font-mono font-bold text-amber-300 px-2 py-0.2 rounded bg-amber-500/10 border border-amber-500/20">
                          {score}% Match
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 truncate">{job.title} • {job.location}</p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => onSelectJob(job)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs font-medium border border-slate-750 cursor-pointer"
                      >
                        <FileText className="h-3.5 w-3.5 text-purple-400" />
                        <span>Inspect Dossier</span>
                      </motion.button>

                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => openExternalJobApplication(job.url, job.company, job.title)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600/15 hover:bg-indigo-600/25 text-indigo-300 border border-indigo-500/30 text-xs font-medium cursor-pointer"
                      >
                        <span>Open Portal</span>
                        <ExternalLink className="h-3.5 w-3.5" />
                      </motion.button>
                    </div>
                  </div>

                  {/* Staged Questions Requiring Approval */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                      <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />
                      <span>Screening & Questionnaire Prompts</span>
                    </h4>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                      {userRequiredQuestions.length === 0 ? (
                        <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800 text-xs text-slate-400 col-span-2">
                          Compensation and location alignment verification recommended before final submission.
                        </div>
                      ) : (
                        userRequiredQuestions.map((q) => (
                          <div key={q.id} className="p-3 rounded-lg bg-slate-900/60 border border-slate-800 space-y-1.5">
                            <div className="flex items-start justify-between gap-2">
                              <span className="font-medium text-xs text-slate-200">{q.question}</span>
                              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20">
                                {q.category === 'USER_REQUIRED' ? 'Action Req' : 'AI Draft'}
                              </span>
                            </div>
                            <div className="p-2 rounded bg-slate-950/80 border border-slate-850 text-xs text-slate-300 font-mono">
                              {q.suggestedAnswer}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-800 text-xs">
                    <div className="text-[11px] text-slate-400 font-mono">
                      ATS Resume: <strong className="text-purple-300 font-normal">{job.tailoredResume?.versionId || 'Standard Master'}</strong>
                    </div>

                    <div className="flex items-center gap-2">
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleSkip(job)}
                        className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-400 hover:text-slate-200 text-xs font-medium border border-slate-750 cursor-pointer"
                      >
                        Pass
                      </motion.button>

                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleApply(job)}
                        className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium shadow-sm transition-all cursor-pointer"
                      >
                        <Send className="h-3.5 w-3.5" />
                        <span>Authorize & Record Applied</span>
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}

