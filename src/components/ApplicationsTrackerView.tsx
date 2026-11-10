import React, { useState } from 'react';
import { 
  Send, 
  FileSpreadsheet, 
  ExternalLink, 
  Calendar, 
  Search, 
  Filter, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  Plus,
  ArrowRight,
  TrendingUp,
  LayoutGrid,
  List
} from 'lucide-react';
import { motion } from 'motion/react';
import confetti from 'canvas-confetti';
import { Job, JobStatus } from '../types';
import { openExternalJobApplication, normalizeJobUrl } from '../utils/urlUtils';
import { formatTimeAgo } from '../utils/dateUtils';

interface ApplicationsTrackerViewProps {
  jobs: Job[];
  onSelectJob: (job: Job) => void;
  onUpdateStatus: (jobId: string, status: any, notes?: string, interviewDate?: string) => Promise<void>;
  onOpenExcelSync: () => void;
}

export default function ApplicationsTrackerView({
  jobs,
  onSelectJob,
  onUpdateStatus,
  onOpenExcelSync,
}: ApplicationsTrackerViewProps) {
  const [viewMode, setViewMode] = useState<'table' | 'kanban'>('table');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const filteredJobs = jobs.filter((job) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      if (!job.company.toLowerCase().includes(q) && !job.title.toLowerCase().includes(q)) {
        return false;
      }
    }
    if (statusFilter !== 'all' && job.status !== statusFilter) {
      return false;
    }
    return true;
  });

  const appliedJobs = jobs.filter(j => j.status === 'APPLIED');
  const interviewJobs = jobs.filter(j => j.status === 'INTERVIEW');
  const readyJobs = jobs.filter(j => j.status === 'READY_TO_APPLY' || j.status === 'SHORTLISTED');

  const kanbanColumns: { id: JobStatus; title: string; color: string }[] = [
    { id: 'SHORTLISTED', title: 'Shortlisted', color: 'text-indigo-300' },
    { id: 'READY_TO_APPLY', title: 'Ready to Apply', color: 'text-purple-300' },
    { id: 'HUMAN_REVIEW', title: 'Review Needed', color: 'text-amber-300' },
    { id: 'APPLIED', title: 'Applied', color: 'text-emerald-300' },
    { id: 'INTERVIEW', title: 'Interview Stage', color: 'text-teal-300' }
  ];

  return (
    <div className="space-y-5 pb-12">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Send className="h-4 w-4 text-emerald-400" />
            <h1 className="text-base font-semibold text-white tracking-tight">
              Application Ledger & Pipeline Tracking
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time audit log of submissions, interview conversions, and automated bi-directional Excel synchronization.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* View mode toggle */}
          <div className="flex items-center p-0.5 bg-slate-900 border border-slate-750 rounded-lg">
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-md text-xs font-medium transition-all cursor-pointer ${
                viewMode === 'table' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
              title="Table View"
            >
              <List className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => setViewMode('kanban')}
              className={`p-1.5 rounded-md text-xs font-medium transition-all cursor-pointer ${
                viewMode === 'kanban' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
              title="Kanban Board View"
            >
              <LayoutGrid className="h-3.5 w-3.5" />
            </button>
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onOpenExcelSync}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-medium transition-all cursor-pointer"
            id="tracker-excel-btn"
          >
            <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-400" />
            <span>Excel Sync</span>
          </motion.button>
        </div>
      </div>

      {/* Top Quick Status Counters */}
      <div className="grid grid-cols-3 gap-3">
        <div className="p-3 rounded-xl bg-slate-850/50 border border-slate-800 flex items-center justify-between">
          <span className="text-xs text-slate-400 font-medium">Ready in Pipeline</span>
          <span className="text-base font-mono font-bold text-purple-300">{readyJobs.length}</span>
        </div>
        <div className="p-3 rounded-xl bg-slate-850/50 border border-slate-800 flex items-center justify-between">
          <span className="text-xs text-slate-400 font-medium">Applied & Logged</span>
          <span className="text-base font-mono font-bold text-emerald-400">{appliedJobs.length}</span>
        </div>
        <div className="p-3 rounded-xl bg-slate-850/50 border border-slate-800 flex items-center justify-between">
          <span className="text-xs text-slate-400 font-medium">Active Interviews</span>
          <span className="text-base font-mono font-bold text-amber-400">{interviewJobs.length}</span>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-center gap-3 p-3 rounded-xl bg-slate-850/50 border border-slate-800">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Filter applications by company or role..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 bg-slate-900/80 border border-slate-750 rounded-lg text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-slate-900 border border-slate-750 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 w-full sm:w-auto"
        >
          <option value="all">All Statuses</option>
          <option value="SHORTLISTED">Shortlisted</option>
          <option value="READY_TO_APPLY">Ready to Apply</option>
          <option value="HUMAN_REVIEW">Review Needed</option>
          <option value="APPLIED">Applied</option>
          <option value="INTERVIEW">Interview</option>
        </select>
      </div>

      {/* VIEW 1: TABLE VIEW */}
      {viewMode === 'table' && (
        <div className="overflow-x-auto rounded-xl bg-slate-850/50 border border-slate-800 shadow-sm">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-900/80 text-slate-400 font-mono text-[10px] border-b border-slate-800">
              <tr>
                <th className="px-4 py-2.5 font-medium">COMPANY & ROLE</th>
                <th className="px-3 py-2.5 font-medium">SOURCE</th>
                <th className="px-3 py-2.5 font-medium">MATCH</th>
                <th className="px-3 py-2.5 font-medium">RESUME VERSION</th>
                <th className="px-3 py-2.5 font-medium">APPLIED DATE</th>
                <th className="px-3 py-2.5 font-medium">STATUS</th>
                <th className="px-4 py-2.5 text-right font-medium">ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredJobs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                    No matching applications found.
                  </td>
                </tr>
              ) : (
                filteredJobs.map((job) => {
                  const score = job.analysis?.overallScore;
                  const appliedAt = job.applicationRecord?.appliedAt;

                  return (
                    <tr
                      key={job.id}
                      onClick={() => onSelectJob(job)}
                      className="hover:bg-slate-800/40 cursor-pointer transition-colors"
                    >
                      <td className="px-4 py-3">
                        <div className="font-semibold text-white text-xs">{job.company}</div>
                        <div className="text-[11px] text-slate-400 truncate max-w-xs">{job.title}</div>
                      </td>

                      <td className="px-3 py-3 text-slate-400 text-[11px] font-mono">
                        {job.sourceName || job.source}
                      </td>

                      <td className="px-3 py-3">
                        {score !== undefined ? (
                          <span className="font-mono font-bold text-indigo-400 text-xs">{score}%</span>
                        ) : (
                          <span className="text-slate-500 text-[11px]">-</span>
                        )}
                      </td>

                      <td className="px-3 py-3 text-[11px] font-mono text-purple-300">
                        {job.tailoredResume?.versionId || 'Master'}
                      </td>

                      <td className="px-3 py-3 text-slate-400 text-[11px] font-mono">
                        {appliedAt ? new Date(appliedAt).toLocaleDateString() : 'Not Yet'}
                      </td>

                      <td className="px-3 py-3">
                        <select
                          value={job.status}
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) => onUpdateStatus(job.id, e.target.value)}
                          className="bg-slate-900 border border-slate-750 rounded px-2 py-0.8 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                        >
                          <option value="DISCOVERED">Discovered</option>
                          <option value="SHORTLISTED">Shortlisted</option>
                          <option value="READY_TO_APPLY">Ready to Apply</option>
                          <option value="HUMAN_REVIEW">Review Needed</option>
                          <option value="APPLIED">Applied</option>
                          <option value="INTERVIEW">Interview</option>
                          <option value="REJECTED_APPLICATION">Rejected</option>
                        </select>
                      </td>

                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            openExternalJobApplication(job.url, job.company, job.title);
                          }}
                          className="inline-flex items-center gap-1 text-[11px] text-indigo-400 hover:text-indigo-300 font-medium cursor-pointer"
                          title="Open official career page"
                        >
                          <span>Open</span>
                          <ExternalLink className="h-3 w-3" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* VIEW 2: KANBAN BOARD VIEW */}
      {viewMode === 'kanban' && (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3.5 overflow-x-auto pb-4">
          {kanbanColumns.map((col) => {
            const colJobs = filteredJobs.filter(j => j.status === col.id);

            return (
              <div
                key={col.id}
                className="p-3 rounded-xl bg-slate-850/50 border border-slate-800 space-y-2.5 flex flex-col min-w-[210px]"
              >
                <div className={`flex items-center justify-between pb-2 border-b border-slate-800 font-semibold text-xs ${col.color}`}>
                  <span>{col.title}</span>
                  <span className="px-1.5 py-0.2 rounded font-mono bg-slate-800 text-[10px] text-slate-300">
                    {colJobs.length}
                  </span>
                </div>

                <div className="space-y-2 flex-1">
                  {colJobs.length === 0 ? (
                    <div className="p-4 text-center text-slate-500 text-[11px]">
                      No items
                    </div>
                  ) : (
                    colJobs.map((job) => (
                      <motion.div
                        key={job.id}
                        whileHover={{ y: -1 }}
                        transition={{ duration: 0.15 }}
                        onClick={() => onSelectJob(job)}
                        className="p-2.5 rounded-lg bg-slate-900/90 hover:bg-slate-800 border border-slate-750 cursor-pointer space-y-1 transition-all shadow-sm"
                      >
                        <div className="flex items-start justify-between gap-1">
                          <h4 className="font-semibold text-white text-xs truncate">{job.company}</h4>
                          {job.analysis?.overallScore && (
                            <span className="text-[10px] font-mono font-bold text-indigo-400">
                              {job.analysis.overallScore}%
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-400 truncate">{job.title}</p>
                        <div className="text-[10px] font-mono text-slate-500 flex items-center justify-between pt-1">
                          <span className="flex items-center gap-1 truncate">
                            <span className="truncate">{job.source}</span>
                            <span>•</span>
                            <span className="text-slate-400">{formatTimeAgo(job.postedAt || job.discoveredAt)}</span>
                          </span>
                          <span className="shrink-0">{job.location.split(',')[0]}</span>
                        </div>
                      </motion.div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
