import { useState, useEffect } from 'react';
import { 
  Sparkles, 
  Play, 
  FileSpreadsheet, 
  Plus, 
  CheckCircle2, 
  Layers,
  Cpu,
  RefreshCw,
  Sliders,
  ExternalLink
} from 'lucide-react';
import { motion } from 'motion/react';
import { UserProfile, Job } from '../types';
import { apiFetch } from '../utils/api';

interface HeaderProps {
  profile: UserProfile;
  jobs: Job[];
  onOpenPipeline: () => void;
  onOpenManualJob: () => void;
  onOpenExcelSync: () => void;
  onNavigate: (tab: string) => void;
  isLiveSyncing?: boolean;
  liveSyncMessage?: string | null;
}

export default function Header({
  profile,
  jobs,
  onOpenPipeline,
  onOpenManualJob,
  onOpenExcelSync,
  onNavigate,
  isLiveSyncing,
  liveSyncMessage,
}: HeaderProps) {
  const [geminiStatus, setGeminiStatus] = useState<boolean | null>(null);

  useEffect(() => {
    apiFetch('/api/health')
      .then(r => r.json())
      .then(d => setGeminiStatus(d.hasGeminiApiKey))
      .catch(() => setGeminiStatus(false));
  }, []);

  const readyToApplyCount = jobs.filter(j => j.status === 'READY_TO_APPLY' || j.status === 'SHORTLISTED').length;
  const humanReviewCount = jobs.filter(j => j.status === 'HUMAN_REVIEW').length;
  const appliedCount = jobs.filter(j => j.status === 'APPLIED' || j.status === 'INTERVIEW').length;

  return (
    <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-xl border-b border-slate-800/80 px-4 lg:px-6 py-2.5 transition-all">
      <div className="flex items-center justify-between gap-4 max-w-7xl mx-auto">
        {/* Left branding */}
        <div className="flex items-center gap-3">
          <motion.div 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="h-9 w-9 rounded-xl bg-gradient-to-br from-indigo-500 via-indigo-600 to-indigo-700 flex items-center justify-center shadow-lg shadow-indigo-600/25 ring-1 ring-white/10"
          >
            <Cpu className="h-4.5 w-4.5 text-white" />
          </motion.div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm tracking-tight text-white">JobPilot AI</span>
              <span className="text-[10px] font-mono font-medium px-1.5 py-0.2 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                PRO AGENT
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-normal hidden sm:block">
              Multi-Source Discovery • Zero-Hallucination ATS Tailoring • Excel Ledger
            </p>
          </div>
        </div>

        {/* Center / Right quick status & triggers */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          {/* Live Sync Status Indicator */}
          {isLiveSyncing ? (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-500/10 border border-indigo-500/25 text-xs text-indigo-300 animate-pulse">
              <RefreshCw className="h-3 w-3 animate-spin text-indigo-400" />
              <span className="font-medium text-[11px] hidden sm:inline">Syncing Live Jobs...</span>
            </div>
          ) : liveSyncMessage ? (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/25 text-xs text-emerald-300">
              <CheckCircle2 className="h-3 w-3 text-emerald-400" />
              <span className="font-medium text-[11px] hidden sm:inline">{liveSyncMessage}</span>
            </div>
          ) : (
            <div className="hidden lg:flex items-center gap-1.5 px-2 py-1 rounded-lg bg-slate-800/40 border border-slate-700/40 text-[11px] text-slate-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              <span>Live Feeds Active</span>
            </div>
          )}

          {/* Gemini AI Status Indicator */}
          <div className="hidden md:flex items-center gap-2 px-2.5 py-1 rounded-lg bg-slate-800/60 border border-slate-700/60 text-xs text-slate-300">
            <span className="relative flex h-2 w-2">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${geminiStatus ? 'bg-emerald-400' : 'bg-amber-400'}`} />
              <span className={`relative inline-flex rounded-full h-2 w-2 ${geminiStatus ? 'bg-emerald-500' : 'bg-amber-500'}`} />
            </span>
            <span className="font-medium text-[11px] text-slate-300">Gemini 3.8 Flash (High)</span>
            <span className="text-[10px] font-mono text-slate-400">{geminiStatus ? 'Online' : 'Standby'}</span>
          </div>

          {/* Review Alert badge */}
          {humanReviewCount > 0 && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onNavigate('review')}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/25 text-amber-300 text-xs font-medium hover:bg-amber-500/20 transition-all cursor-pointer"
              title="Questions and roles awaiting your review"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" />
              <span>{humanReviewCount} Review Needed</span>
            </motion.button>
          )}

          {/* Application Copilot Button */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onNavigate('copilot')}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-200 border border-indigo-500/35 text-xs font-semibold transition-all cursor-pointer shadow-sm"
            title="Open Application Copilot to tailor resume & answer questions"
          >
            <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
            <span className="hidden sm:inline">Apply Copilot</span>
          </motion.button>

          {/* Add Job button */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onOpenManualJob}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-750 text-slate-200 border border-slate-700/80 text-xs font-medium transition-all cursor-pointer"
            id="header-add-job-btn"
          >
            <Plus className="h-3.5 w-3.5 text-slate-400" />
            <span className="hidden sm:inline">Add Job</span>
          </motion.button>

          {/* Excel Export / Sync */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onOpenExcelSync}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-950/40 hover:bg-emerald-900/50 text-emerald-300 border border-emerald-700/50 text-xs font-medium transition-all cursor-pointer"
            id="header-excel-sync-btn"
          >
            <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-400" />
            <span className="hidden sm:inline">Excel Tracker</span>
          </motion.button>

          {/* Automated Pipeline Trigger */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            onClick={onOpenPipeline}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs shadow-sm shadow-indigo-600/30 transition-all active:scale-95 cursor-pointer"
            id="header-run-pipeline-btn"
          >
            <Play className="h-3.5 w-3.5 fill-current" />
            <span>Run Pipeline</span>
          </motion.button>
        </div>
      </div>
    </header>
  );
}

