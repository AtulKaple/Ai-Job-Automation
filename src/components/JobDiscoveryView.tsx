import React, { useState } from 'react';
import { 
  Search, 
  Filter, 
  Sparkles, 
  Compass, 
  Plus, 
  Building2, 
  MapPin, 
  Check, 
  ExternalLink,
  RefreshCw,
  SlidersHorizontal,
  ChevronDown,
  Layers,
  ArrowUpDown,
  Clock
} from 'lucide-react';
import { motion } from 'motion/react';
import { Job, JobSource, JobStatus } from '../types';
import { openExternalJobApplication } from '../utils/urlUtils';
import { formatTimeAgo } from '../utils/dateUtils';

interface JobDiscoveryViewProps {
  jobs: Job[];
  onSelectJob: (job: Job) => void;
  onOpenManualJob: () => void;
  onTriggerDiscovery: () => Promise<void>;
  onSyncRealJobs?: () => Promise<void>;
  onBatchAnalyze: () => Promise<void>;
  onOpenCopilot?: (job: Job) => void;
  isLoading: boolean;
  isLiveSyncing?: boolean;
  liveSyncMessage?: string | null;
}

export default function JobDiscoveryView({
  jobs,
  onSelectJob,
  onOpenManualJob,
  onTriggerDiscovery,
  onSyncRealJobs,
  onBatchAnalyze,
  onOpenCopilot,
  isLoading,
  isLiveSyncing,
  liveSyncMessage,
}: JobDiscoveryViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSource, setSelectedSource] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [minScore, setMinScore] = useState<number>(0);
  const [remoteOnly, setRemoteOnly] = useState<boolean>(false);
  const [sortBy, setSortBy] = useState<'score' | 'date' | 'company'>('date');

  const sourcesList = [
    { id: 'all', label: 'All 20+ Platforms' },
    { id: 'hiringcafe', label: '☕ Hiring Cafe' },
    { id: 'himalayas', label: '🏔️ Himalayas' },
    { id: 'weworkremotely', label: '💻 We Work Remotely' },
    { id: 'remoteok', label: '🌍 RemoteOK' },
    { id: 'ycombinator', label: '🚀 Y Combinator Jobs' },
    { id: 'welcometothejungle', label: '🌴 Welcome to Jungle' },
    { id: 'wellfound', label: '✌️ Wellfound' },
    { id: 'greenhouse', label: '🏢 Greenhouse' },
    { id: 'ashby', label: '⚡ Ashby' },
    { id: 'remotive', label: '🌐 Remotive' },
    { id: 'jobicy', label: '🎯 Jobicy' },
    { id: 'remoteforme', label: '📡 Remote For Me' },
    { id: 'glassdoor', label: '🚪 Glassdoor' },
    { id: 'ziprecruiter', label: '📬 ZipRecruiter' },
    { id: 'meteor', label: '☄️ Meteor' },
    { id: 'aiapply', label: '🤖 AIApply' },
    { id: 'crossover', label: '🌟 Crossover' },
    { id: 'toptal', label: '💎 Toptal' },
    { id: 'handshake', label: '🤝 Handshake' },
    { id: 'sprout', label: '🌱 Sprout' },
    { id: 'lever', label: '📋 Lever' },
    { id: 'company', label: 'Direct Careers' }
  ];

  const filteredJobs = jobs.filter((job) => {
    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matches = 
        job.company.toLowerCase().includes(q) ||
        job.title.toLowerCase().includes(q) ||
        job.location.toLowerCase().includes(q) ||
        job.skills.some(s => s.toLowerCase().includes(q));
      if (!matches) return false;
    }

    // Source filter
    if (selectedSource !== 'all' && job.source !== selectedSource) {
      return false;
    }

    // Status filter
    if (selectedStatus !== 'all' && job.status !== selectedStatus) {
      return false;
    }

    // Remote filter
    if (remoteOnly && !job.remote) {
      return false;
    }

    // Score filter
    if (minScore > 0) {
      const score = job.analysis?.overallScore || 0;
      if (score < minScore) return false;
    }

    return true;
  });

  // Sorting
  const sortedJobs = [...filteredJobs].sort((a, b) => {
    if (sortBy === 'score') {
      const scoreA = a.analysis?.overallScore || 0;
      const scoreB = b.analysis?.overallScore || 0;
      return scoreB - scoreA;
    }
    if (sortBy === 'date') {
      const timeA = new Date(a.discoveredAt || a.postedAt || 0).getTime();
      const timeB = new Date(b.discoveredAt || b.postedAt || 0).getTime();
      return timeB - timeA;
    }
    return a.company.localeCompare(b.company);
  });

  const unanalyzedCount = jobs.filter(j => !j.analysis).length;

  return (
    <div className="space-y-5 pb-12">
      {/* Top Header & Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Compass className="h-4 w-4 text-indigo-400" />
            <h1 className="text-base font-semibold text-white tracking-tight">
              Opportunity Discovery & Multi-Adapter Feeds
            </h1>
            {isLiveSyncing && (
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 text-[10px] font-medium animate-pulse">
                <RefreshCw className="h-2.5 w-2.5 animate-spin" />
                <span>Auto-syncing live feeds...</span>
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Auto-synced on reload. Latest postings from Greenhouse, Ashby, Remotive, and Jobicy displayed first.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {unanalyzedCount > 0 && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onBatchAnalyze}
              disabled={isLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/25 text-xs font-medium transition-all disabled:opacity-50 cursor-pointer"
              id="discovery-batch-score-btn"
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>Score ({unanalyzedCount})</span>
            </motion.button>
          )}

          {onSyncRealJobs && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onSyncRealJobs}
              disabled={isLoading}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-sm shadow-emerald-600/20 transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
              id="discovery-sync-real-btn"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Sync 100% Real Feeds</span>
            </motion.button>
          )}

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onTriggerDiscovery}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium shadow-sm transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
            id="discovery-trigger-btn"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Discover Roles</span>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onOpenManualJob}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700/80 text-xs font-medium transition-all cursor-pointer"
            id="discovery-add-manual-btn"
          >
            <Plus className="h-3.5 w-3.5 text-slate-400" />
            <span>Add Manual</span>
          </motion.button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-3.5 rounded-xl bg-slate-850/60 border border-slate-800 space-y-3">
        <div className="flex flex-col md:flex-row items-center gap-3">
          {/* Search Input */}
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by company, role title, skills (e.g. React, Next.js)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 bg-slate-900/80 border border-slate-750 rounded-lg text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Quick source pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 scrollbar-none">
            {sourcesList.slice(0, 8).map((src) => (
              <button
                key={src.id}
                onClick={() => setSelectedSource(src.id)}
                className={`px-2.5 py-1 rounded-md text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
                  selectedSource === src.id
                    ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30'
                    : 'bg-slate-800/60 text-slate-400 hover:text-slate-200 border border-transparent'
                }`}
              >
                {src.label}
              </button>
            ))}
          </div>
        </div>

        {/* Secondary Filters Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2.5 border-t border-slate-800/80 text-xs">
          <div className="flex flex-wrap items-center gap-3">
            {/* Status Dropdown */}
            <div className="flex items-center gap-1.5 text-slate-400">
              <span className="text-[11px]">Status:</span>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="bg-slate-900 border border-slate-750 rounded-md px-2 py-1 text-slate-200 focus:outline-none focus:border-indigo-500 text-xs"
              >
                <option value="all">All Statuses</option>
                <option value="DISCOVERED">Discovered</option>
                <option value="SHORTLISTED">Shortlisted</option>
                <option value="RESUME_GENERATED">Resume Ready</option>
                <option value="READY_TO_APPLY">Ready to Apply</option>
                <option value="HUMAN_REVIEW">Review Needed</option>
                <option value="APPLIED">Applied</option>
                <option value="INTERVIEW">Interview</option>
              </select>
            </div>

            {/* Minimum Score */}
            <div className="flex items-center gap-1.5 text-slate-400">
              <span className="text-[11px]">Match Threshold:</span>
              <select
                value={minScore}
                onChange={(e) => setMinScore(Number(e.target.value))}
                className="bg-slate-900 border border-slate-750 rounded-md px-2 py-1 text-slate-200 focus:outline-none focus:border-indigo-500 text-xs"
              >
                <option value={0}>Any Score</option>
                <option value={70}>≥ 70% (Review+)</option>
                <option value={80}>≥ 80% (Strong+)</option>
                <option value={90}>≥ 90% (Excellent)</option>
              </select>
            </div>

            {/* Remote Only Toggle */}
            <label className="flex items-center gap-1.5 cursor-pointer text-slate-300 text-xs">
              <input
                type="checkbox"
                checked={remoteOnly}
                onChange={(e) => setRemoteOnly(e.target.checked)}
                className="rounded bg-slate-900 border-slate-700 text-indigo-600 focus:ring-0"
              />
              <span>Remote Only</span>
            </label>
          </div>

          {/* Sort By */}
          <div className="flex items-center gap-2 text-slate-400">
            <span className="text-[11px]">Sort:</span>
            <button
              onClick={() => setSortBy(sortBy === 'score' ? 'date' : sortBy === 'date' ? 'company' : 'score')}
              className="flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 text-slate-200 hover:bg-slate-750 border border-slate-700 text-xs cursor-pointer"
            >
              <ArrowUpDown className="h-3 w-3 text-indigo-400" />
              <span className="capitalize">{sortBy}</span>
            </button>
            <span className="text-slate-400 font-mono text-[11px]">({sortedJobs.length} results)</span>
          </div>
        </div>
      </div>

      {/* Jobs List Grid */}
      {sortedJobs.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-slate-850/40 border border-slate-800 space-y-3">
          <Compass className="h-8 w-8 text-slate-500 mx-auto" />
          <h3 className="text-sm font-medium text-slate-300">No matching positions found</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Try adjusting your search criteria or click "Discover Roles" to fetch new jobs from active source adapters.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {sortedJobs.map((job) => {
            const score = job.analysis?.overallScore;
            const hasTailoredResume = Boolean(job.tailoredResume);
            const isReviewNeeded = job.status === 'HUMAN_REVIEW';

            return (
              <motion.div
                key={job.id}
                whileHover={{ y: -1 }}
                transition={{ duration: 0.15 }}
                onClick={() => onSelectJob(job)}
                className="group relative p-4 rounded-xl bg-slate-850/50 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 transition-all cursor-pointer flex flex-col justify-between space-y-3.5 shadow-sm"
              >
                <div className="space-y-2">
                  {/* Top Bar: Company & Match Badge */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold text-white text-sm group-hover:text-indigo-300 transition-colors truncate">
                          {job.company}
                        </span>
                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 border border-slate-750">
                          {job.sourceName || job.source}
                        </span>
                        <span 
                          className="text-[10px] font-medium px-1.5 py-0.2 rounded bg-slate-800/90 text-slate-300 border border-slate-750 flex items-center gap-1"
                          title={job.postedAt ? `Posted: ${new Date(job.postedAt).toLocaleString()}` : ''}
                        >
                          <Clock className="h-2.5 w-2.5 text-indigo-400" />
                          <span>{formatTimeAgo(job.postedAt || job.discoveredAt)}</span>
                        </span>
                      </div>
                      <h3 className="text-xs font-medium text-slate-200 pt-0.5 truncate">
                        {job.title}
                      </h3>
                    </div>

                    {score !== undefined ? (
                      <div className={`px-2 py-0.5 rounded font-mono text-xs font-bold flex items-center gap-1 shrink-0 ${
                        score >= 85 ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20' :
                        score >= 70 ? 'bg-indigo-500/10 text-indigo-300 border border-indigo-500/20' :
                        'bg-amber-500/10 text-amber-300 border border-amber-500/20'
                      }`}>
                        <span>{score}%</span>
                        <span className="text-[10px] font-normal text-slate-400 font-sans">Match</span>
                      </div>
                    ) : (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-750 shrink-0">
                        Unanalyzed
                      </span>
                    )}
                  </div>

                  {/* Location & Salary */}
                  <div className="flex flex-wrap items-center gap-x-3.5 gap-y-1 text-[11px] text-slate-400">
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

                  {/* Skills tags */}
                  <div className="flex flex-wrap gap-1.5 pt-0.5">
                    {job.skills.slice(0, 5).map((skill) => {
                      const isMatched = job.analysis?.matchedSkills?.includes(skill);
                      return (
                        <span
                          key={skill}
                          className={`text-[10px] px-2 py-0.5 rounded border ${
                            isMatched
                              ? 'bg-indigo-500/10 text-indigo-300 border-indigo-500/25 font-medium'
                              : 'bg-slate-800/80 text-slate-400 border-slate-750'
                          }`}
                        >
                          {skill}
                        </span>
                      );
                    })}
                  </div>
                </div>

                {/* Bottom Bar Status & Action hint */}
                <div className="flex items-center justify-between pt-2.5 border-t border-slate-800/80 text-xs">
                  <div className="flex items-center gap-1.5">
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded ${
                      job.status === 'APPLIED' ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/20' :
                      job.status === 'INTERVIEW' ? 'bg-amber-500/15 text-amber-300 border border-amber-500/20' :
                      job.status === 'HUMAN_REVIEW' ? 'bg-amber-500/15 text-amber-300 border border-amber-500/20' :
                      hasTailoredResume ? 'bg-purple-500/15 text-purple-300 border border-purple-500/20' :
                      job.status === 'SHORTLISTED' ? 'bg-indigo-500/15 text-indigo-300 border border-indigo-500/20' :
                      'bg-slate-800 text-slate-400 border border-slate-700'
                    }`}>
                      {job.status === 'APPLIED' ? 'APPLIED' :
                       job.status === 'INTERVIEW' ? 'INTERVIEW' :
                       job.status === 'HUMAN_REVIEW' ? 'REVIEW NEEDED' :
                       hasTailoredResume ? 'RESUME READY' :
                       job.status === 'SHORTLISTED' ? 'SHORTLISTED' :
                       'DISCOVERED'}
                    </span>

                    {job.remote && (
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
                        Remote
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {onOpenCopilot && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenCopilot(job);
                        }}
                        className="flex items-center gap-1 px-2 py-0.5 rounded bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/25 text-[10px] font-semibold transition-colors cursor-pointer"
                        title="Tailor resume & answer questions in Application Copilot"
                      >
                        <Sparkles className="h-3 w-3 text-indigo-400" />
                        <span>Copilot</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        openExternalJobApplication(job.url, job.company, job.title);
                      }}
                      className="p-1 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors cursor-pointer"
                      title="Open verified career application"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                    </button>

                    <span className="text-[11px] text-indigo-400 group-hover:text-indigo-300 font-medium">
                      Inspect →
                    </span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
