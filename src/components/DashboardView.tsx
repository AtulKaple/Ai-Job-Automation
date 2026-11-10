import React from 'react';
import { 
  Sparkles, 
  TrendingUp, 
  FileCheck2, 
  Send, 
  Clock, 
  ArrowRight, 
  CheckCircle2, 
  AlertTriangle,
  Play, 
  FileSpreadsheet, 
  Building2, 
  MapPin, 
  Briefcase,
  ChevronRight,
  ExternalLink,
  Target,
  BarChart2,
  ShieldCheck,
  Compass
} from 'lucide-react';
import { motion } from 'motion/react';
import { Job, UserProfile, AgentExecutionRun } from '../types';
import { formatTimeAgo } from '../utils/dateUtils';

interface DashboardViewProps {
  jobs: Job[];
  profile: UserProfile;
  runs: AgentExecutionRun[];
  onSelectJob: (job: Job) => void;
  onOpenPipeline: () => void;
  onOpenExcelSync: () => void;
  onNavigate: (tab: string) => void;
}

export default function DashboardView({
  jobs,
  profile,
  runs,
  onSelectJob,
  onOpenPipeline,
  onOpenExcelSync,
  onNavigate,
}: DashboardViewProps) {
  const totalFound = jobs.length;
  const shortlisted = jobs.filter(j => j.status === 'SHORTLISTED' || (j.analysis && j.analysis.overallScore >= 80)).length;
  const tailoredCount = jobs.filter(j => j.tailoredResume).length;
  const appliedCount = jobs.filter(j => j.status === 'APPLIED').length;
  const interviewCount = jobs.filter(j => j.status === 'INTERVIEW').length;
  const reviewCount = jobs.filter(j => j.status === 'HUMAN_REVIEW').length;

  const topJobs = [...jobs]
    .filter(j => j.analysis)
    .sort((a, b) => (b.analysis?.overallScore || 0) - (a.analysis?.overallScore || 0))
    .slice(0, 5);

  const recentApplied = jobs
    .filter(j => j.status === 'APPLIED' || j.status === 'INTERVIEW')
    .slice(0, 4);

  return (
    <div className="space-y-6 pb-12">
      {/* Executive Command Banner */}
      <motion.div 
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 border border-slate-750 p-5 md:p-6 shadow-sm"
      >
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-indigo-500/15 text-indigo-300 border border-indigo-500/25">
                EXECUTIVE DASHBOARD
              </span>
              <span className="text-xs text-slate-400">
                Preferred: {profile.preferredLocations.slice(0, 2).join(', ')} (Remote eligible)
              </span>
            </div>
            <h1 className="text-xl md:text-2xl font-semibold text-white tracking-tight">
              Welcome back, {profile.fullName.split(' ')[0]}
            </h1>
            <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
              Autonomous pipeline has indexed <span className="font-semibold text-indigo-300">{totalFound} opportunities</span> across verified ATS platforms.
              {shortlisted > 0 && ` ${shortlisted} positions match your criteria with ATS scores ≥ 80%.`}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onOpenPipeline}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium shadow-sm transition-all cursor-pointer"
              id="dash-run-pipeline-btn"
            >
              <Play className="h-3.5 w-3.5 fill-current" />
              <span>Run Automated Pipeline</span>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onOpenExcelSync}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700/80 text-xs font-medium transition-all cursor-pointer"
              id="dash-excel-btn"
            >
              <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-400" />
              <span>Export Ledger</span>
            </motion.button>
          </div>
        </div>
      </motion.div>

      {/* KPI Cards Grid with Professional Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, delay: 0.05 }}
          className="p-4 rounded-xl bg-slate-850/60 border border-slate-800 flex flex-col justify-between"
        >
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Indexed Roles</span>
            <Briefcase className="h-4 w-4 text-slate-400" />
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-white tracking-tight">{totalFound}</div>
            <p className="text-[11px] text-slate-400">Multi-source feeds</p>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, delay: 0.1 }}
          className="p-4 rounded-xl bg-slate-850/60 border border-slate-800 flex flex-col justify-between"
        >
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Top Matches</span>
            <Target className="h-4 w-4 text-indigo-400" />
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-indigo-300 tracking-tight">{shortlisted}</div>
            <p className="text-[11px] text-slate-400">ATS Score &gt; 80%</p>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, delay: 0.15 }}
          className="p-4 rounded-xl bg-slate-850/60 border border-slate-800 flex flex-col justify-between"
        >
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Tailored Resumes</span>
            <FileCheck2 className="h-4 w-4 text-purple-400" />
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-purple-300 tracking-tight">{tailoredCount}</div>
            <p className="text-[11px] text-slate-400">Zero-hallucination</p>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, delay: 0.2 }}
          className="p-4 rounded-xl bg-slate-850/60 border border-slate-800 flex flex-col justify-between"
        >
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Applied</span>
            <Send className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-emerald-400 tracking-tight">{appliedCount}</div>
            <p className="text-[11px] text-slate-400">Excel synchronised</p>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, delay: 0.25 }}
          className="p-4 rounded-xl bg-slate-850/60 border border-slate-800 col-span-2 lg:col-span-1 flex flex-col justify-between"
        >
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Interviews</span>
            <TrendingUp className="h-4 w-4 text-amber-400" />
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-amber-300 tracking-tight">{interviewCount}</div>
            <p className="text-[11px] text-slate-400">Pipeline active</p>
          </div>
        </motion.div>
      </div>

      {/* Main Content: High Match Opportunities & Conversion Funnel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: High Match Recommendations */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Compass className="h-4 w-4 text-indigo-400" />
              <h2 className="text-xs font-bold text-slate-200 tracking-wider uppercase">
                High-Fit Recommendations
              </h2>
            </div>
            <button
              onClick={() => onNavigate('discovery')}
              className="text-xs font-medium text-indigo-400 hover:text-indigo-300 flex items-center gap-1 cursor-pointer transition-colors"
            >
              <span>Explore all {jobs.length} positions</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="space-y-2.5">
            {topJobs.map((job) => {
              const score = job.analysis?.overallScore || 0;
              const isTailored = Boolean(job.tailoredResume);

              return (
                <motion.div
                  key={job.id}
                  whileHover={{ y: -1 }}
                  transition={{ duration: 0.15 }}
                  onClick={() => onSelectJob(job)}
                  className="group relative p-4 rounded-xl bg-slate-850/50 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 transition-all cursor-pointer shadow-sm"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1.5 min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold text-white text-sm group-hover:text-indigo-300 transition-colors truncate">
                          {job.company}
                        </span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700/60">
                          {job.sourceName || job.source}
                        </span>
                        <span 
                          className="text-[10px] font-medium px-1.5 py-0.2 rounded bg-slate-800/90 text-slate-300 border border-slate-750 flex items-center gap-1"
                          title={job.postedAt ? `Posted: ${new Date(job.postedAt).toLocaleString()}` : ''}
                        >
                          <Clock className="h-2.5 w-2.5 text-indigo-400" />
                          <span>{formatTimeAgo(job.postedAt || job.discoveredAt)}</span>
                        </span>
                        {job.remote && (
                          <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            Remote
                          </span>
                        )}
                      </div>

                      <h3 className="text-xs font-medium text-slate-300">
                        {job.title}
                      </h3>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate-400 pt-0.5">
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3 text-slate-500" />
                          <span>{job.location}</span>
                        </span>
                        {job.salaryMin && (
                          <span className="text-slate-300 font-mono font-medium">
                            ₹{job.salaryMin}-{job.salaryMax} {job.salaryCurrency || 'LPA'}
                          </span>
                        )}
                        <span 
                          className="flex items-center gap-1 text-slate-400/90"
                          title={job.postedAt ? `Posted: ${new Date(job.postedAt).toLocaleString()}` : ''}
                        >
                          <Clock className="h-3 w-3 text-slate-500 shrink-0" />
                          <span>Posted {formatTimeAgo(job.postedAt || job.discoveredAt)}</span>
                        </span>
                      </div>

                      {/* Matching Skills Pills */}
                      <div className="flex flex-wrap gap-1.5 pt-1.5">
                        {job.skills.slice(0, 5).map((skill) => (
                          <span
                            key={skill}
                            className="text-[10px] px-2 py-0.5 rounded bg-slate-800/90 text-slate-300 border border-slate-750"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Right side Score & Status */}
                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-500/10 border border-indigo-500/25 text-indigo-300 font-bold text-xs font-mono">
                        <span>{score}%</span>
                        <span className="text-[10px] font-normal text-slate-400 font-sans">Match</span>
                      </div>

                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded ${
                        job.status === 'APPLIED' ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/20' :
                        job.status === 'INTERVIEW' ? 'bg-amber-500/15 text-amber-300 border border-amber-500/20' :
                        job.status === 'HUMAN_REVIEW' ? 'bg-orange-500/15 text-orange-300 border border-orange-500/20' :
                        isTailored ? 'bg-purple-500/15 text-purple-300 border border-purple-500/20' :
                        'bg-slate-800 text-slate-300 border border-slate-700'
                      }`}>
                        {job.status === 'APPLIED' ? 'APPLIED' :
                         job.status === 'INTERVIEW' ? 'INTERVIEW' :
                         job.status === 'HUMAN_REVIEW' ? 'REVIEW' :
                         isTailored ? 'RESUME READY' : 'SHORTLISTED'}
                      </span>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Right Col: Funnel & Active Tracker */}
        <div className="space-y-5">
          {/* Active Pipeline Funnel */}
          <div className="p-4 rounded-xl bg-slate-850/50 border border-slate-800 space-y-4">
            <h3 className="text-xs font-bold text-slate-200 tracking-wider uppercase flex items-center justify-between">
              <span>Conversion Funnel</span>
              <TrendingUp className="h-3.5 w-3.5 text-indigo-400" />
            </h3>

            <div className="space-y-3 text-xs">
              <div className="space-y-1">
                <div className="flex justify-between text-slate-400 text-[11px]">
                  <span>1. Indexed Roles</span>
                  <span className="font-mono font-semibold text-slate-200">{totalFound}</span>
                </div>
                <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-indigo-500 h-full rounded-full w-full" />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-slate-400 text-[11px]">
                  <span>2. Scored Positions</span>
                  <span className="font-mono font-semibold text-slate-200">{jobs.filter(j => j.analysis).length}</span>
                </div>
                <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <div 
                    className="bg-indigo-400 h-full rounded-full transition-all"
                    style={{ width: `${(jobs.filter(j => j.analysis).length / Math.max(1, totalFound)) * 100}%` }}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-slate-400 text-[11px]">
                  <span>3. High Fit Shortlist</span>
                  <span className="font-mono font-semibold text-indigo-300">{shortlisted}</span>
                </div>
                <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <div 
                    className="bg-purple-400 h-full rounded-full transition-all"
                    style={{ width: `${(shortlisted / Math.max(1, totalFound)) * 100}%` }}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-slate-400 text-[11px]">
                  <span>4. Tailored Resumes</span>
                  <span className="font-mono font-semibold text-purple-300">{tailoredCount}</span>
                </div>
                <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <div 
                    className="bg-purple-500 h-full rounded-full transition-all"
                    style={{ width: `${(tailoredCount / Math.max(1, totalFound)) * 100}%` }}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-slate-400 text-[11px]">
                  <span>5. Submitted Applications</span>
                  <span className="font-mono font-semibold text-emerald-400">{appliedCount}</span>
                </div>
                <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <div 
                    className="bg-emerald-500 h-full rounded-full transition-all"
                    style={{ width: `${(appliedCount / Math.max(1, totalFound)) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Recent Submissions */}
          <div className="p-4 rounded-xl bg-slate-850/50 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-200 tracking-wider uppercase">
                Recent Submissions
              </h3>
              <button
                onClick={() => onNavigate('applications')}
                className="text-[11px] text-indigo-400 hover:text-indigo-300 font-medium cursor-pointer transition-colors"
              >
                View Ledger →
              </button>
            </div>

            {recentApplied.length === 0 ? (
              <p className="text-xs text-slate-500 py-3 text-center">
                No submissions logged yet. Tailor and submit candidate roles above.
              </p>
            ) : (
              <div className="space-y-2">
                {recentApplied.map((job) => (
                  <div
                    key={job.id}
                    onClick={() => onSelectJob(job)}
                    className="p-2.5 rounded-lg bg-slate-800/40 hover:bg-slate-800/80 border border-slate-750 flex items-center justify-between cursor-pointer text-xs transition-colors"
                  >
                    <div className="min-w-0 pr-2">
                      <h4 className="font-semibold text-slate-200 truncate">{job.company}</h4>
                      <p className="text-[11px] text-slate-400 truncate">{job.title}</p>
                    </div>
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded shrink-0 ${
                      job.status === 'INTERVIEW' ? 'bg-amber-500/15 text-amber-300 border border-amber-500/20' : 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/20'
                    }`}>
                      {job.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

