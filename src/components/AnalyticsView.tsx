import React from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  CheckCircle2, 
  Target, 
  PieChart as PieIcon, 
  Award, 
  Zap,
  Activity
} from 'lucide-react';
import { motion } from 'motion/react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';
import { Job, UserProfile } from '../types';

interface AnalyticsViewProps {
  jobs: Job[];
  profile: UserProfile;
}

export default function AnalyticsView({ jobs, profile }: AnalyticsViewProps) {
  const total = jobs.length;
  const applied = jobs.filter(j => j.status === 'APPLIED').length;
  const interview = jobs.filter(j => j.status === 'INTERVIEW').length;
  const shortlisted = jobs.filter(j => (j.analysis?.overallScore || 0) >= 80).length;

  // Source Distribution
  const sourceCounts: Record<string, number> = {};
  jobs.forEach(j => {
    const src = j.sourceName || j.source;
    sourceCounts[src] = (sourceCounts[src] || 0) + 1;
  });
  const sourceData = Object.keys(sourceCounts).map(k => ({ name: k, count: sourceCounts[k] }));

  // Score brackets
  const scoreBrackets = [
    { range: '90-100%', count: jobs.filter(j => (j.analysis?.overallScore || 0) >= 90).length },
    { range: '80-89%', count: jobs.filter(j => (j.analysis?.overallScore || 0) >= 80 && (j.analysis?.overallScore || 0) < 90).length },
    { range: '70-79%', count: jobs.filter(j => (j.analysis?.overallScore || 0) >= 70 && (j.analysis?.overallScore || 0) < 80).length },
    { range: '<70%', count: jobs.filter(j => j.analysis && j.analysis.overallScore < 70).length },
  ];

  // Status Distribution
  const statusData = [
    { name: 'Discovered', value: jobs.filter(j => j.status === 'DISCOVERED').length, color: '#6366f1' },
    { name: 'Shortlisted', value: jobs.filter(j => j.status === 'SHORTLISTED' || j.status === 'RESUME_GENERATED').length, color: '#8b5cf6' },
    { name: 'Review', value: jobs.filter(j => j.status === 'HUMAN_REVIEW').length, color: '#f59e0b' },
    { name: 'Applied', value: applied, color: '#10b981' },
    { name: 'Interview', value: interview, color: '#14b8a6' },
  ].filter(d => d.value > 0);

  const responseRate = applied > 0 ? Math.round((interview / applied) * 100) : 0;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.15 }}
      className="space-y-6 pb-12"
    >
      <div>
        <h1 className="text-lg font-semibold text-white tracking-tight flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-indigo-400" />
          <span>Job Search Analytics & Intelligence</span>
        </h1>
        <p className="text-xs text-slate-400">
          Conversion metrics, ATS scoring distribution, and adapter discovery performance.
        </p>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-750">
          <span className="text-xs text-slate-400 font-medium">Pipeline Volume</span>
          <div className="text-xl font-semibold text-white font-mono mt-1">{total}</div>
          <p className="text-[11px] text-slate-400 mt-0.5">Discovered positions</p>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-750">
          <span className="text-xs text-slate-400 font-medium">High Fit Ratio</span>
          <div className="text-xl font-semibold text-indigo-400 font-mono mt-1">
            {total > 0 ? Math.round((shortlisted / total) * 100) : 0}%
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">≥ 80% Match Score</p>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-750">
          <span className="text-xs text-slate-400 font-medium">Applications Logged</span>
          <div className="text-xl font-semibold text-emerald-400 font-mono mt-1">{applied}</div>
          <p className="text-[11px] text-slate-400 mt-0.5">Excel synchronized</p>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-750">
          <span className="text-xs text-slate-400 font-medium">Interview Conversion</span>
          <div className="text-xl font-semibold text-amber-400 font-mono mt-1">{responseRate}%</div>
          <p className="text-[11px] text-slate-400 mt-0.5">{interview} Invitations</p>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Match Score Distribution */}
        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4">
          <h3 className="font-bold text-xs text-white uppercase tracking-wider">
            Match Score Distribution (Gemini Multi-Factor)
          </h3>
          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={scoreBrackets}>
                <XAxis dataKey="range" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} allowDecimals={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                />
                <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Source Adapter Discovery */}
        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4">
          <h3 className="font-bold text-xs text-white uppercase tracking-wider">
            Jobs Discovered by Platform Source
          </h3>
          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={sourceData}>
                <XAxis dataKey="name" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} allowDecimals={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                />
                <Bar dataKey="count" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
