import React, { useState } from 'react';
import { 
  X, 
  Sparkles, 
  Building2, 
  MapPin, 
  ExternalLink, 
  CheckCircle2, 
  AlertTriangle, 
  FileText, 
  Mail, 
  Send, 
  Copy, 
  Check, 
  Layers, 
  Calendar,
  AlertCircle,
  Download,
  Search,
  Globe,
  Compass,
  Coins,
  GraduationCap,
  Clock,
  Code
} from 'lucide-react';
import { motion } from 'motion/react';
import confetti from 'canvas-confetti';
import { Job, UserProfile } from '../types';
import { normalizeJobUrl, getCompanyCareersSearchUrl, extractHostname, openExternalJobApplication } from '../utils/urlUtils';
import { formatTimeAgo } from '../utils/dateUtils';
import { apiFetch, apiUrl } from '../utils/api';

// Helper component to render rich, structured, beautifully formatted job descriptions
function FormattedJobDescription({ content }: { content: string }) {
  if (!content) {
    return <p className="text-slate-400 italic">No detailed description provided.</p>;
  }

  // Clean any residual HTML entities
  const decoded = content
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#x27;/gi, "'")
    .replace(/&#39;/gi, "'")
    .replace(/&nbsp;/gi, ' ');

  // Split into structural blocks by double newlines
  const blocks = decoded.split(/\n{2,}/);

  return (
    <div className="space-y-4 text-xs text-slate-200 leading-relaxed">
      {blocks.map((block, idx) => {
        const trimmed = block.trim();
        if (!trimmed) return null;

        // Markdown Header 1-6
        if (trimmed.startsWith('### ') || trimmed.startsWith('## ') || trimmed.startsWith('# ')) {
          const headingText = trimmed.replace(/^#+\s*/, '').trim();
          return (
            <div key={idx} className="pt-3 pb-1 border-b border-slate-750/70 flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-indigo-500 ring-4 ring-indigo-500/20" />
              <h5 className="font-bold text-white text-xs sm:text-sm tracking-tight text-indigo-200">
                {headingText}
              </h5>
            </div>
          );
        }

        // Bullet lists
        const lines = trimmed.split('\n');
        const hasBullets = lines.some(l => l.trim().startsWith('•') || l.trim().startsWith('-') || l.trim().startsWith('*'));

        if (hasBullets) {
          return (
            <div key={idx} className="space-y-2 py-0.5">
              {lines.map((line, lIdx) => {
                const lTrim = line.trim();
                if (!lTrim) return null;
                const isBullet = lTrim.startsWith('•') || lTrim.startsWith('-') || lTrim.startsWith('*');
                const bulletText = isBullet ? lTrim.replace(/^[•\-\*]\s*/, '') : lTrim;
                
                return (
                  <div key={lIdx} className="flex items-start gap-2.5 text-slate-300">
                    <span className="text-indigo-400 font-bold mt-0.5 text-xs select-none">▸</span>
                    <span className="flex-1 leading-relaxed">{bulletText}</span>
                  </div>
                );
              })}
            </div>
          );
        }

        // Regular paragraph
        return (
          <p key={idx} className="text-slate-300 leading-relaxed">
            {trimmed}
          </p>
        );
      })}
    </div>
  );
}

interface JobDetailModalProps {
  job: Job | null;
  profile: UserProfile;
  onClose: () => void;
  onTailorResume: (jobId: string) => Promise<void>;
  onGenerateCoverLetter: (jobId: string) => Promise<void>;
  onPrepareQuestions: (jobId: string) => Promise<void>;
  onUpdateStatus: (jobId: string, status: any, notes?: string, interviewDate?: string) => Promise<void>;
  onOpenCopilot?: (job: Job) => void;
  isLoading: boolean;
}

export default function JobDetailModal({
  job,
  profile,
  onClose,
  onTailorResume,
  onGenerateCoverLetter,
  onPrepareQuestions,
  onUpdateStatus,
  onOpenCopilot,
  isLoading,
}: JobDetailModalProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'analysis' | 'resume' | 'coverLetter' | 'questions' | 'apply'>('overview');
  const [copiedResume, setCopiedResume] = useState(false);
  const [copiedCoverLetter, setCopiedCoverLetter] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedDesc, setCopiedDesc] = useState(false);
  const [descViewMode, setDescViewMode] = useState<'formatted' | 'raw'>('formatted');
  const [checkedReqs, setCheckedReqs] = useState<Record<number, boolean>>({});
  const [notesInput, setNotesInput] = useState(job?.applicationRecord?.notes || '');
  const [interviewDateInput, setInterviewDateInput] = useState(job?.applicationRecord?.interviewDate || '');
  const [resumeSubView, setResumeSubView] = useState<'latex' | 'preview'>('latex');
  const [copiedLatex, setCopiedLatex] = useState(false);

  if (!job) return null;

  const analysis = job.analysis;
  const tailoredResume = job.tailoredResume;
  const coverLetter = job.coverLetter;
  const questions = job.questions || [];

  const toggleReq = (idx: number) => {
    setCheckedReqs(prev => ({ ...prev, [idx]: !prev[idx] }));
  };

  const handleCopyDescription = () => {
    if (!job) return;
    navigator.clipboard.writeText(job.description);
    setCopiedDesc(true);
    setTimeout(() => setCopiedDesc(false), 2000);
  };

  const handleCopyResume = () => {
    if (!tailoredResume) return;
    const text = `
TAILORED RESUME - ${job.company} (${job.title})
Version: ${tailoredResume.versionId} | ATS Score: ${tailoredResume.atsMatchScore}%

SUMMARY:
${tailoredResume.tailoredSummary}

SKILLS:
${tailoredResume.orderedSkills.map(c => `${c.category}: ${c.skills.join(', ')}`).join('\n')}

EXPERIENCE:
${tailoredResume.targetedExperiences.map(e => `${e.role} - ${e.company} (${e.duration})\n${e.highlightedResponsibilities.map(r => `• ${r}`).join('\n')}`).join('\n\n')}

KEY PROJECTS:
${tailoredResume.selectedProjects.map(p => `${p.name} (${p.role})\n${p.highlightDescription}\n${p.relevantBullets.map(b => `• ${b}`).join('\n')}`).join('\n\n')}
`;
    navigator.clipboard.writeText(text);
    setCopiedResume(true);
    setTimeout(() => setCopiedResume(false), 2000);
  };

  const handleCopyLatex = () => {
    if (!tailoredResume?.latexCode) return;
    navigator.clipboard.writeText(tailoredResume.latexCode);
    setCopiedLatex(true);
    setTimeout(() => setCopiedLatex(false), 2000);
  };

  const handleCopyCoverLetter = () => {
    if (!coverLetter) return;
    navigator.clipboard.writeText(`${coverLetter.subject}\n\n${coverLetter.content}`);
    setCopiedCoverLetter(true);
    setTimeout(() => setCopiedCoverLetter(false), 2000);
  };

  const handleMarkApplied = async () => {
    confetti({
      particleCount: 80,
      spread: 60,
      origin: { y: 0.6 }
    });
    await onUpdateStatus(job.id, 'APPLIED', notesInput);
  };

  const handleMarkInterview = async () => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.5 }
    });
    await onUpdateStatus(job.id, 'INTERVIEW', notesInput, interviewDateInput);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <motion.div 
        initial={{ opacity: 0, scale: 0.97, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.97, y: 8 }}
        transition={{ duration: 0.15 }}
        className="relative w-full max-w-4xl bg-slate-900 border border-slate-750 rounded-2xl shadow-2xl overflow-hidden my-6 flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 bg-slate-900/95 flex items-start justify-between gap-4 sticky top-0 z-10">
          <div className="space-y-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-lg font-semibold text-white tracking-tight truncate">{job.company}</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-750">
                {job.sourceName || job.source}
              </span>
              {job.remote && (
                <span className="text-[10px] font-medium px-2 py-0.2 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Remote
                </span>
              )}
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded ${
                job.status === 'APPLIED' ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/20' :
                job.status === 'INTERVIEW' ? 'bg-amber-500/15 text-amber-300 border border-amber-500/20' :
                job.status === 'HUMAN_REVIEW' ? 'bg-amber-500/15 text-amber-300 border border-amber-500/20' :
                'bg-indigo-500/15 text-indigo-300 border border-indigo-500/20'
              }`}>
                {job.status}
              </span>
            </div>

            <h2 className="text-xs sm:text-sm font-medium text-slate-200">
              {job.title}
            </h2>

            <div className="flex flex-wrap items-center gap-x-3.5 gap-y-1 text-[11px] text-slate-400 pt-0.5">
              <span className="flex items-center gap-1">
                <MapPin className="h-3 w-3 text-slate-500" />
                <span>{job.location}</span>
              </span>
              {job.salaryMin && (
                <span className="text-slate-300 font-mono font-medium">
                  ₹{job.salaryMin}-{job.salaryMax} {job.salaryCurrency || 'LPA'}
                </span>
              )}
              <span>Exp: {job.experienceMin}-{job.experienceMax} yrs</span>
              <span 
                className="flex items-center gap-1 text-slate-300 font-medium"
                title={job.postedAt ? `Posted: ${new Date(job.postedAt).toLocaleString()}` : ''}
              >
                <Clock className="h-3 w-3 text-indigo-400" />
                <span>Posted {formatTimeAgo(job.postedAt || job.discoveredAt)}</span>
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Modern Segmented Tab Navigation */}
        <div className="px-4 sm:px-6 py-2 border-b border-slate-800 bg-slate-900/90 backdrop-blur-md">
          <div className="flex items-center gap-1.5 p-1 bg-slate-950/70 border border-slate-800/80 rounded-xl overflow-x-auto text-xs scrollbar-none">
            {/* Tab 1: Overview */}
            <button
              type="button"
              onClick={() => setActiveTab('overview')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'overview'
                  ? 'bg-slate-800/95 text-white shadow-sm border border-indigo-500/40 shadow-indigo-500/10 font-semibold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/70 border border-transparent'
              }`}
            >
              <Globe className={`h-3.5 w-3.5 ${activeTab === 'overview' ? 'text-indigo-400' : 'text-slate-400'}`} />
              <span>Overview</span>
            </button>

            {/* Tab 2: AI Fit & Scoring */}
            <button
              type="button"
              onClick={() => setActiveTab('analysis')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'analysis'
                  ? 'bg-slate-800/95 text-white shadow-sm border border-emerald-500/40 shadow-emerald-500/10 font-semibold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/70 border border-transparent'
              }`}
            >
              <Sparkles className={`h-3.5 w-3.5 ${activeTab === 'analysis' ? 'text-emerald-400' : 'text-slate-400'}`} />
              <span>AI Fit</span>
              {analysis ? (
                <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-mono font-bold border leading-none ${
                  analysis.overallScore >= 80 
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                    : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                }`}>
                  {analysis.overallScore}%
                </span>
              ) : (
                <span className="px-1.5 py-0.5 rounded-md text-[10px] font-mono text-slate-400 bg-slate-800/80 border border-slate-700 leading-none">
                  AI
                </span>
              )}
            </button>

            {/* Tab 3: Tailored Resume */}
            <button
              type="button"
              onClick={() => setActiveTab('resume')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'resume'
                  ? 'bg-slate-800/95 text-white shadow-sm border border-purple-500/40 shadow-purple-500/10 font-semibold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/70 border border-transparent'
              }`}
            >
              <FileText className={`h-3.5 w-3.5 ${activeTab === 'resume' ? 'text-purple-400' : 'text-slate-400'}`} />
              <span>Resume</span>
              {tailoredResume ? (
                <span className="px-1.5 py-0.5 rounded-md text-[10px] font-mono font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30 flex items-center gap-0.5 leading-none">
                  <Check className="h-2.5 w-2.5" />
                  <span>{tailoredResume.atsMatchScore}% ATS</span>
                </span>
              ) : (
                <span className="px-1.5 py-0.5 rounded-md text-[10px] font-mono text-slate-400 bg-slate-800/80 border border-slate-700 leading-none">
                  Tailor
                </span>
              )}
            </button>

            {/* Tab 4: Cover Letter */}
            <button
              type="button"
              onClick={() => setActiveTab('coverLetter')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'coverLetter'
                  ? 'bg-slate-800/95 text-white shadow-sm border border-sky-500/40 shadow-sky-500/10 font-semibold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/70 border border-transparent'
              }`}
            >
              <Mail className={`h-3.5 w-3.5 ${activeTab === 'coverLetter' ? 'text-sky-400' : 'text-slate-400'}`} />
              <span>Cover Letter</span>
              {coverLetter && (
                <span className="px-1.5 py-0.5 rounded-md text-[10px] font-semibold bg-sky-500/20 text-sky-300 border border-sky-500/30 leading-none">
                  Ready
                </span>
              )}
            </button>

            {/* Tab 5: Application Questions */}
            <button
              type="button"
              onClick={() => setActiveTab('questions')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'questions'
                  ? 'bg-slate-800/95 text-white shadow-sm border border-amber-500/40 shadow-amber-500/10 font-semibold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/70 border border-transparent'
              }`}
            >
              <AlertCircle className={`h-3.5 w-3.5 ${activeTab === 'questions' ? 'text-amber-400' : 'text-slate-400'}`} />
              <span>Questions</span>
              <span className="px-1.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-slate-800 text-slate-300 border border-slate-750 leading-none">
                {questions.length}
              </span>
            </button>

            {/* Tab 6: Status & Pipeline */}
            <button
              type="button"
              onClick={() => setActiveTab('apply')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'apply'
                  ? 'bg-slate-800/95 text-white shadow-sm border border-teal-500/40 shadow-teal-500/10 font-semibold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/70 border border-transparent'
              }`}
            >
              <Send className={`h-3.5 w-3.5 ${activeTab === 'apply' ? 'text-teal-400' : 'text-slate-400'}`} />
              <span>Pipeline</span>
              <span className={`h-2 w-2 rounded-full shrink-0 ${
                job.status === 'APPLIED' ? 'bg-emerald-400 ring-2 ring-emerald-400/25' :
                job.status === 'INTERVIEW' ? 'bg-amber-400 ring-2 ring-amber-400/25' :
                'bg-indigo-400 ring-2 ring-indigo-400/25'
              }`} />
            </button>
          </div>
        </div>

        {/* Modal Body Area */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-6 text-xs text-slate-300">
          {/* TAB 0: Job Overview & Verified Link */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Verified Application Link Card */}
              <div className="p-3.5 rounded-xl bg-gradient-to-r from-indigo-950/40 via-slate-900 to-slate-900 border border-indigo-500/30 shadow-md">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1 shrink-0">
                        <CheckCircle2 className="h-3 w-3" />
                        <span>Verified Direct Opening</span>
                      </span>
                      <span className="text-[11px] text-slate-400 font-mono truncate">
                        Host: {extractHostname(job.url)}
                      </span>
                    </div>
                    <a
                      href={normalizeJobUrl(job.url, job.company, job.title)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-indigo-400 hover:text-indigo-300 hover:underline font-mono truncate flex items-center gap-1.5 max-w-xl group"
                      title={job.url}
                    >
                      <span className="truncate">{normalizeJobUrl(job.url, job.company, job.title)}</span>
                      <ExternalLink className="h-3 w-3 shrink-0 text-slate-500 group-hover:text-indigo-300 transition-colors" />
                    </a>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 self-start sm:self-center">
                    {onOpenCopilot && (
                      <button
                        type="button"
                        onClick={() => {
                          onOpenCopilot(job);
                          onClose();
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600/25 hover:bg-indigo-600/40 text-indigo-200 border border-indigo-500/35 text-xs font-semibold transition-all cursor-pointer shadow-sm"
                        title="Tailor resume and answer application questions in Copilot"
                      >
                        <Sparkles className="h-3.5 w-3.5 text-indigo-300" />
                        <span>Open in Copilot</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(normalizeJobUrl(job.url, job.company, job.title));
                        setCopiedLink(true);
                        setTimeout(() => setCopiedLink(false), 2000);
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-300 border border-slate-700 text-xs transition-colors cursor-pointer"
                      title="Copy direct application URL"
                    >
                      {copiedLink ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5 text-slate-400" />}
                      <span>{copiedLink ? 'Copied!' : 'Copy Link'}</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Executive Role Summary Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 rounded-xl bg-slate-900/80 border border-slate-800">
                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 flex items-center gap-1">
                    <MapPin className="h-3 w-3 text-indigo-400" />
                    <span>Workplace</span>
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className={`h-2 w-2 rounded-full ${job.remote ? 'bg-emerald-400 ring-2 ring-emerald-400/20' : 'bg-amber-400 ring-2 ring-amber-400/20'}`} />
                    <span className="text-xs font-semibold text-white truncate">
                      {job.remote ? 'Remote Worldwide' : job.location}
                    </span>
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 flex items-center gap-1">
                    <Coins className="h-3 w-3 text-emerald-400" />
                    <span>Target Compensation</span>
                  </span>
                  <p className="text-xs font-semibold text-emerald-400 font-mono">
                    {job.salaryMin ? `₹${job.salaryMin}-${job.salaryMax} ${job.salaryCurrency || 'LPA'}` : 'Competitive Market'}
                  </p>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 flex items-center gap-1">
                    <GraduationCap className="h-3 w-3 text-indigo-400" />
                    <span>Experience Level</span>
                  </span>
                  <p className="text-xs font-semibold text-indigo-300">
                    {job.experienceMin !== undefined ? `${job.experienceMin} - ${job.experienceMax} Years` : 'Entry / Mid-level'}
                  </p>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 flex items-center gap-1">
                    <Compass className="h-3 w-3 text-purple-400" />
                    <span>Source & Posted</span>
                  </span>
                  <div className="flex items-center gap-1.5 truncate">
                    <span className="text-xs font-semibold text-slate-200 truncate">
                      {job.sourceName || job.source}
                    </span>
                    <span className="text-slate-500">•</span>
                    <span 
                      className="text-[11px] font-medium text-indigo-300 shrink-0"
                      title={job.postedAt ? `Posted: ${new Date(job.postedAt).toLocaleString()}` : ''}
                    >
                      {formatTimeAgo(job.postedAt || job.discoveredAt)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Full Detailed Job Specification Card */}
              <div className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-indigo-400" />
                    <h4 className="font-bold text-white text-xs uppercase tracking-wider">
                      Full Job Specification & Overview
                    </h4>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                      {job.description ? `${job.description.length.toLocaleString()} chars` : 'Detailed Spec'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="flex items-center bg-slate-800/90 p-0.5 rounded-lg border border-slate-700">
                      <button
                        type="button"
                        onClick={() => setDescViewMode('formatted')}
                        className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${
                          descViewMode === 'formatted'
                            ? 'bg-indigo-600 text-white shadow-sm'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        Formatted View
                      </button>
                      <button
                        type="button"
                        onClick={() => setDescViewMode('raw')}
                        className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${
                          descViewMode === 'raw'
                            ? 'bg-indigo-600 text-white shadow-sm'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        Raw Plaintext
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={handleCopyDescription}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-300 border border-slate-700 text-[11px] transition-colors cursor-pointer"
                      title="Copy full job description to clipboard"
                    >
                      {copiedDesc ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3 text-slate-400" />}
                      <span>{copiedDesc ? 'Copied!' : 'Copy Text'}</span>
                    </button>
                  </div>
                </div>

                {descViewMode === 'formatted' ? (
                  <div className="p-4 sm:p-5 rounded-xl bg-slate-900/60 border border-slate-800 shadow-inner max-h-[460px] overflow-y-auto">
                    <FormattedJobDescription content={job.description} />
                  </div>
                ) : (
                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 font-mono text-[11px] text-slate-300 leading-relaxed whitespace-pre-wrap max-h-[460px] overflow-y-auto select-text">
                    {job.description}
                  </div>
                )}
              </div>

              {/* Interactive Key Requirements Checklist */}
              {job.requirements && job.requirements.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-white text-xs uppercase tracking-wider flex items-center gap-1.5">
                      <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                      <span>Key Requirements Checklist ({job.requirements.length})</span>
                    </h4>
                    {Object.values(checkedReqs).filter(Boolean).length > 0 && (
                      <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/20">
                        {Object.values(checkedReqs).filter(Boolean).length} of {job.requirements.length} Checked
                      </span>
                    )}
                  </div>
                  <div className="space-y-2">
                    {job.requirements.map((req, idx) => {
                      const isChecked = Boolean(checkedReqs[idx]);
                      return (
                        <div
                          key={idx}
                          onClick={() => toggleReq(idx)}
                          className={`p-3 rounded-xl border transition-all cursor-pointer flex items-start gap-3 select-none ${
                            isChecked
                              ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-100'
                              : 'bg-slate-800/40 border-slate-750/70 hover:bg-slate-800/70 text-slate-300'
                          }`}
                        >
                          <div className={`mt-0.5 flex-shrink-0 h-4 w-4 rounded flex items-center justify-center border transition-colors ${
                            isChecked
                              ? 'bg-emerald-500 border-emerald-400 text-white'
                              : 'border-slate-600 bg-slate-800'
                          }`}>
                            {isChecked && <Check className="h-3 w-3 stroke-[3]" />}
                          </div>
                          <span className="text-xs leading-relaxed flex-1">{req}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Preferred Qualifications */}
              {job.preferredQualifications && job.preferredQualifications.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-bold text-white text-xs uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                    <span>Preferred Qualifications & Bonus Skills</span>
                  </h4>
                  <div className="p-3.5 rounded-xl bg-slate-800/30 border border-slate-750/60 space-y-2">
                    {job.preferredQualifications.map((pref, idx) => (
                      <div key={idx} className="flex items-start gap-2.5 text-slate-300">
                        <span className="text-amber-400 text-xs font-bold select-none">★</span>
                        <span className="text-xs leading-relaxed">{pref}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Core Skills & Technologies */}
              <div className="space-y-2.5">
                <h4 className="font-bold text-white text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <Layers className="h-3.5 w-3.5 text-indigo-400" />
                  <span>Core Skills & Technologies</span>
                </h4>
                <div className="flex flex-wrap gap-2">
                  {job.skills.map((skill) => {
                    const isMatched = (profile.skills || []).some(
                      s => (s.name || '').toLowerCase() === skill.toLowerCase() || skill.toLowerCase().includes((s.name || '').toLowerCase())
                    );
                    return (
                      <span
                        key={skill}
                        className={`px-3 py-1 rounded-lg text-xs font-medium flex items-center gap-1.5 border transition-all ${
                          isMatched
                            ? 'bg-emerald-950/40 text-emerald-300 border-emerald-800/50'
                            : 'bg-indigo-950/40 text-indigo-300 border-indigo-800/50'
                        }`}
                      >
                        {isMatched && <CheckCircle2 className="h-3 w-3 text-emerald-400" />}
                        <span>{skill}</span>
                      </span>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 1: AI Scoring & Fit Analysis */}
          {activeTab === 'analysis' && (
            <div className="space-y-6">
              {analysis ? (
                <>
                  {/* Score Breakdown Cards */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60">
                      <span className="text-[11px] text-slate-400">Technical Stack</span>
                      <div className="text-xl font-bold text-indigo-400 mt-1">{analysis.technicalSkillScore}%</div>
                      <div className="w-full bg-slate-700 h-1.5 rounded-full mt-2 overflow-hidden">
                        <div className="bg-indigo-500 h-full" style={{ width: `${analysis.technicalSkillScore}%` }} />
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60">
                      <span className="text-[11px] text-slate-400">Experience Alignment</span>
                      <div className="text-xl font-bold text-purple-400 mt-1">{analysis.experienceScore}%</div>
                      <div className="w-full bg-slate-700 h-1.5 rounded-full mt-2 overflow-hidden">
                        <div className="bg-purple-500 h-full" style={{ width: `${analysis.experienceScore}%` }} />
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60">
                      <span className="text-[11px] text-slate-400">Location & Mode</span>
                      <div className="text-xl font-bold text-emerald-400 mt-1">{analysis.locationScore}%</div>
                      <div className="w-full bg-slate-700 h-1.5 rounded-full mt-2 overflow-hidden">
                        <div className="bg-emerald-500 h-full" style={{ width: `${analysis.locationScore}%` }} />
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60">
                      <span className="text-[11px] text-slate-400">Overall Match</span>
                      <div className="text-xl font-bold text-amber-400 mt-1">{analysis.overallScore}%</div>
                      <div className="w-full bg-slate-700 h-1.5 rounded-full mt-2 overflow-hidden">
                        <div className="bg-amber-500 h-full" style={{ width: `${analysis.overallScore}%` }} />
                      </div>
                    </div>
                  </div>

                  {/* Recommendation banner */}
                  <div className={`p-4 rounded-xl border flex items-start gap-3 ${
                    analysis.recommendation === 'APPLY' ? 'bg-emerald-950/30 border-emerald-800/50 text-emerald-200' :
                    analysis.recommendation === 'REVIEW' ? 'bg-amber-950/30 border-amber-800/50 text-amber-200' :
                    'bg-slate-800/60 border-slate-700 text-slate-300'
                  }`}>
                    <CheckCircle2 className="h-5 w-5 shrink-0 mt-0.5 text-emerald-400" />
                    <div className="space-y-1">
                      <h4 className="font-bold text-xs uppercase tracking-wide">
                        Recommendation: {analysis.recommendation} ({analysis.overallScore}% Confidence)
                      </h4>
                      <p className="text-xs leading-relaxed opacity-90">{analysis.reasoning}</p>
                    </div>
                  </div>

                  {/* Matched vs Missing Skills Matrix */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl bg-slate-800/40 border border-emerald-900/40 space-y-2.5">
                      <h4 className="font-bold text-emerald-400 text-xs flex items-center gap-1.5">
                        <Check className="h-4 w-4" />
                        <span>Matched Verified Skills ({analysis.matchedSkills.length})</span>
                      </h4>
                      <div className="flex flex-wrap gap-1.5">
                        {analysis.matchedSkills.map(s => (
                          <span key={s} className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 text-[11px] font-medium">
                            ✓ {s}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/60 space-y-2.5">
                      <h4 className="font-bold text-amber-400 text-xs flex items-center gap-1.5">
                        <AlertTriangle className="h-4 w-4" />
                        <span>Missing / Preferred Skills ({analysis.missingSkills.length})</span>
                      </h4>
                      {analysis.missingSkills.length === 0 ? (
                        <p className="text-slate-400 text-[11px]">Zero skill gaps identified!</p>
                      ) : (
                        <div className="flex flex-wrap gap-1.5">
                          {analysis.missingSkills.map(s => (
                            <span key={s} className="px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-300 border border-amber-500/20 text-[11px]">
                              • {s}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Key Strengths & Observations */}
                  <div className="space-y-2">
                    <h4 className="font-bold text-slate-200 text-xs">Profile Strengths for this Role</h4>
                    <ul className="space-y-1.5 list-disc pl-4 text-slate-300">
                      {analysis.strongMatches.map((str, idx) => (
                        <li key={idx} className="leading-relaxed">{str}</li>
                      ))}
                    </ul>
                  </div>
                </>
              ) : (
                <div className="p-8 text-center bg-slate-800/30 rounded-xl border border-slate-800 space-y-3">
                  <Sparkles className="h-8 w-8 text-indigo-400 mx-auto" />
                  <p className="text-slate-300">This role has not been analyzed with Gemini yet.</p>
                  <button
                    onClick={() => onTailorResume(job.id)}
                    disabled={isLoading}
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-all shadow-md"
                  >
                    Analyze & Tailor with Gemini
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: Tailored Resume */}
          {activeTab === 'resume' && (
            <div className="space-y-4">
              {tailoredResume ? (
                <>
                  {/* Top Bar with Version Meta and Actions */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-xl bg-purple-950/30 border border-purple-800/40 gap-3">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-purple-300 text-xs">Tailored Resume Version: {tailoredResume.versionId}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 font-medium">
                          {tailoredResume.atsMatchScore}% ATS Match
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400">
                        Tailored for <strong className="text-slate-300">{job.title}</strong> at <strong className="text-slate-300">{job.company}</strong> using your LaTeX template format.
                      </p>
                    </div>

                    <div className="flex items-center flex-wrap gap-2">
                      <a
                        href={apiUrl(`/api/resumes/download-tex/${tailoredResume.versionId}.tex`)}
                        download={`${tailoredResume.versionId}.tex`}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-sm transition-all active:scale-95 cursor-pointer"
                      >
                        <Download className="h-3.5 w-3.5" />
                        <span>Download .tex</span>
                      </a>

                      <a
                        href={apiUrl(`/api/resumes/download/${tailoredResume.versionId}.pdf`)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow-sm transition-all active:scale-95 cursor-pointer"
                      >
                        <Download className="h-3.5 w-3.5" />
                        <span>Download PDF</span>
                      </a>

                      <button
                        onClick={() => onTailorResume(job.id)}
                        disabled={isLoading}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-purple-300 text-xs font-medium border border-purple-800/60 cursor-pointer disabled:opacity-50"
                        title="Re-tailor using Project Docs & Gemini"
                      >
                        <Sparkles className="h-3.5 w-3.5 text-purple-400" />
                        <span>Re-Tailor</span>
                      </button>
                    </div>
                  </div>

                  {/* Projects Highlighted from Documentation Hub */}
                  {tailoredResume.selectedProjectTitles && tailoredResume.selectedProjectTitles.length > 0 && (
                    <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-xs space-y-1.5">
                      <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1.5">
                        <Layers className="h-3.5 w-3.5 text-indigo-400" />
                        <span>Targeted Projects Selected from Documentation Hub:</span>
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {tailoredResume.selectedProjectTitles.map((projTitle, idx) => (
                          <span key={idx} className="px-2 py-0.5 rounded bg-indigo-500/15 border border-indigo-500/25 text-indigo-300 text-[11px] font-medium">
                            {projTitle}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Sub-view Switcher: LaTeX Code vs Visual Preview */}
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setResumeSubView('latex')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                          resumeSubView === 'latex'
                            ? 'bg-purple-600/30 text-purple-300 border border-purple-500/50'
                            : 'text-slate-400 hover:text-slate-200 border border-transparent'
                        }`}
                      >
                        <Code className="h-3.5 w-3.5" />
                        <span>LaTeX Code (.tex)</span>
                      </button>
                      <button
                        onClick={() => setResumeSubView('preview')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                          resumeSubView === 'preview'
                            ? 'bg-purple-600/30 text-purple-300 border border-purple-500/50'
                            : 'text-slate-400 hover:text-slate-200 border border-transparent'
                        }`}
                      >
                        <FileText className="h-3.5 w-3.5" />
                        <span>Visual ATS Preview</span>
                      </button>
                    </div>

                    {resumeSubView === 'latex' ? (
                      <button
                        onClick={handleCopyLatex}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 cursor-pointer"
                      >
                        {copiedLatex ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                        <span>{copiedLatex ? 'Copied LaTeX!' : 'Copy LaTeX Code'}</span>
                      </button>
                    ) : (
                      <button
                        onClick={handleCopyResume}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 cursor-pointer"
                      >
                        {copiedResume ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                        <span>{copiedResume ? 'Copied Text' : 'Copy Text'}</span>
                      </button>
                    )}
                  </div>

                  {/* View 1: LaTeX Code */}
                  {resumeSubView === 'latex' ? (
                    <div className="relative rounded-xl border border-slate-800 bg-slate-950 overflow-hidden shadow-inner space-y-0">
                      <div className="flex items-center justify-between px-4 py-2.5 bg-slate-900/90 border-b border-slate-800 text-slate-400 text-xs">
                        <span className="font-mono text-[11px] text-purple-300 flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block animate-pulse"></span>
                          {tailoredResume.versionId}.tex — ATS-friendly LaTeX Format
                        </span>
                        <span className="text-[10px] text-slate-500">Overleaf & pdflatex ready</span>
                      </div>
                      <pre className="p-4 text-xs font-mono text-slate-300 overflow-x-auto max-h-[500px] leading-relaxed select-all whitespace-pre bg-slate-950">
                        {tailoredResume.latexCode || '% LaTeX code will appear when tailored.'}
                      </pre>
                    </div>
                  ) : (
                    /* View 2: Formatted Resume Preview */
                    <div className="p-6 rounded-xl bg-slate-950 border border-slate-800 space-y-5 text-slate-200 font-sans shadow-inner">
                      {/* Header */}
                      <div className="text-center space-y-1 pb-4 border-b border-slate-800">
                        <h3 className="text-lg font-bold text-white tracking-wide">{profile.fullName}</h3>
                        <p className="text-xs text-indigo-400 font-medium">{profile.currentRole} — Tailored for {job.company}</p>
                        <p className="text-[11px] text-slate-400">
                          {profile.email} • {profile.phone} • {profile.location} • {profile.portfolioUrl}
                        </p>
                      </div>

                      {/* Tailored Summary */}
                      <div className="space-y-1.5">
                        <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Professional Summary</h4>
                        <p className="text-xs leading-relaxed text-slate-300">{tailoredResume.tailoredSummary}</p>
                      </div>

                      {/* Ordered Skills */}
                      <div className="space-y-2">
                        <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Core Competencies & Stack</h4>
                        <div className="space-y-1">
                          {tailoredResume.orderedSkills.map((cat, idx) => (
                            <div key={idx} className="text-xs">
                              <strong className="text-indigo-300">{cat.category}:</strong> <span className="text-slate-300">{cat.skills.join(', ')}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Targeted Experience */}
                      <div className="space-y-3">
                        <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Professional Experience</h4>
                        {tailoredResume.targetedExperiences.map((exp) => (
                          <div key={exp.experienceId} className="space-y-1">
                            <div className="flex justify-between font-semibold text-xs text-white">
                              <span>{exp.role} — <span className="text-indigo-400">{exp.company}</span></span>
                              <span className="text-slate-400 text-[11px]">{exp.duration}</span>
                            </div>
                            <ul className="list-disc pl-4 space-y-1 text-slate-300 text-[11px]">
                              {exp.highlightedResponsibilities.map((resp, i) => (
                                <li key={i}>{resp}</li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>

                      {/* Key Projects */}
                      <div className="space-y-3">
                        <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Highlighted Engineering Projects</h4>
                        {tailoredResume.selectedProjects.map((proj) => (
                          <div key={proj.projectId} className="space-y-1">
                            <div className="flex justify-between font-semibold text-xs text-white">
                              <span>{proj.name} ({proj.role})</span>
                              <span className="text-slate-400 text-[11px]">{proj.technologies.join(', ')}</span>
                            </div>
                            <p className="text-[11px] text-slate-400">{proj.highlightDescription}</p>
                            <ul className="list-disc pl-4 space-y-0.5 text-slate-300 text-[11px]">
                              {proj.relevantBullets.map((b, i) => (
                                <li key={i}>{b}</li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="p-8 text-center bg-slate-800/30 rounded-xl border border-slate-800 space-y-3">
                  <FileText className="h-8 w-8 text-purple-400 mx-auto" />
                  <p className="text-slate-300">No tailored resume generated yet for {job.company}.</p>
                  <button
                    onClick={() => onTailorResume(job.id)}
                    disabled={isLoading}
                    className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs transition-all shadow-md"
                  >
                    Generate Tailored Resume with Gemini
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: Cover Letter */}
          {activeTab === 'coverLetter' && (
            <div className="space-y-4">
              {coverLetter ? (
                <>
                  <div className="flex items-center justify-between p-3 rounded-xl bg-slate-800/60 border border-slate-700/60">
                    <div>
                      <span className="font-bold text-white text-xs">{coverLetter.subject}</span>
                      <p className="text-[11px] text-slate-400">Word count: {coverLetter.wordCount} words (Target: 150-250 words)</p>
                    </div>

                    <button
                      onClick={handleCopyCoverLetter}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700"
                    >
                      {copiedCoverLetter ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                      <span>{copiedCoverLetter ? 'Copied' : 'Copy Text'}</span>
                    </button>
                  </div>

                  <div className="p-6 rounded-xl bg-slate-950 border border-slate-800 whitespace-pre-wrap leading-relaxed text-slate-300 text-xs font-sans shadow-inner">
                    {coverLetter.content}
                  </div>
                </>
              ) : (
                <div className="p-8 text-center bg-slate-800/30 rounded-xl border border-slate-800 space-y-3">
                  <Mail className="h-8 w-8 text-indigo-400 mx-auto" />
                  <p className="text-slate-300">Generate a targeted 150-250 word cover letter for this role.</p>
                  <button
                    onClick={() => onGenerateCoverLetter(job.id)}
                    disabled={isLoading}
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-all shadow-md"
                  >
                    Generate Cover Letter
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: Application Questions Assistant */}
          {activeTab === 'questions' && (
            <div className="space-y-4">
              <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-700 flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-xs text-white">Smart Form Assistant & Safety Classification</h4>
                  <p className="text-[11px] text-slate-400">
                    Safe fields auto-fill instantly. Sensitive & custom questions are staged for human review.
                  </p>
                </div>
                <button
                  onClick={() => onPrepareQuestions(job.id)}
                  disabled={isLoading}
                  className="px-3 py-1.5 rounded-lg bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 border border-indigo-500/30 text-xs font-medium"
                >
                  Re-classify
                </button>
              </div>

              {questions.length === 0 ? (
                <div className="p-6 text-center text-slate-400">
                  No questions prepared yet. Click "Re-classify" to stage standard application fields.
                </div>
              ) : (
                <div className="space-y-3">
                  {questions.map((q) => (
                    <div
                      key={q.id}
                      className={`p-3.5 rounded-xl border space-y-2 ${
                        q.category === 'USER_REQUIRED'
                          ? 'bg-amber-950/20 border-amber-800/50'
                          : q.category === 'AI_DRAFT'
                          ? 'bg-purple-950/20 border-purple-800/50'
                          : 'bg-slate-800/40 border-slate-700/60'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <span className="font-semibold text-xs text-white">{q.question}</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          q.category === 'SAFE_AUTOFILL' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                          q.category === 'AI_DRAFT' ? 'bg-purple-500/10 text-purple-300 border border-purple-500/20' :
                          'bg-amber-500/10 text-amber-300 border border-amber-500/20'
                        }`}>
                          {q.category === 'SAFE_AUTOFILL' ? 'Safe Auto-fill' :
                           q.category === 'AI_DRAFT' ? 'AI Draft' : 'User Approval Needed'}
                        </span>
                      </div>

                      <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800 text-xs text-slate-300">
                        {q.suggestedAnswer}
                      </div>

                      {q.notes && (
                        <p className="text-[10px] text-amber-400/80 italic">{q.notes}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 5: Status & Tracking */}
          {activeTab === 'apply' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700 space-y-3">
                <h4 className="font-bold text-xs text-white">Application Pipeline Actions</h4>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={async () => {
                      try {
                        const res = await apiFetch('/api/applications/apply', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            jobId: job.id,
                            runBrowserAutomation: true,
                            autoSubmit: false,
                            notes: notesInput
                          })
                        });
                        const data = await res.json();
                        if (data.success) {
                          confetti({ particleCount: 80, spread: 60, origin: { y: 0.6 } });
                          await onUpdateStatus(job.id, data.job.status, notesInput);
                        }
                      } catch (e) {
                        console.error('Browser apply error:', e);
                      }
                    }}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/25 transition-all active:scale-95"
                  >
                    <Sparkles className="h-4 w-4" />
                    <span>Run Playwright Auto-Fill</span>
                  </button>

                  <button
                    onClick={async () => {
                      const targetUrl = job.applicationRecord?.applicationUrl || job.url;
                      try {
                        const res = await apiFetch('/api/browser/launch-assisted', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ url: targetUrl })
                        });
                        if (!res.ok) {
                          openExternalJobApplication(targetUrl, job.company, job.title);
                        }
                      } catch (e) {
                        console.error('Launch assisted browser error:', e);
                        openExternalJobApplication(targetUrl, job.company, job.title);
                      }
                    }}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 text-xs font-semibold transition-all active:scale-95"
                  >
                    <ExternalLink className="h-4 w-4 text-indigo-400" />
                    <span>Launch Assisted Browser on Screen</span>
                  </button>

                  {job.status === 'APPLIED' ? (
                    <div className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-semibold">
                      <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                      <span>Status: Applied (Synced to Excel)</span>
                    </div>
                  ) : (
                    <button
                      onClick={handleMarkApplied}
                      className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md shadow-emerald-600/20 transition-all active:scale-95 cursor-pointer"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      <span>Mark as Applied (Syncs to Excel)</span>
                    </button>
                  )}

                  <button
                    onClick={handleMarkInterview}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold shadow-md shadow-amber-600/20 transition-all active:scale-95"
                  >
                    <Calendar className="h-4 w-4" />
                    <span>Set Interview Status</span>
                  </button>

                  <button
                    onClick={() => onUpdateStatus(job.id, 'SHORTLISTED')}
                    className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700"
                  >
                    Shortlist
                  </button>
                </div>
              </div>

              {/* Notes & Log */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-300">Application Notes & Follow-up Details</label>
                <textarea
                  rows={3}
                  value={notesInput}
                  onChange={(e) => setNotesInput(e.target.value)}
                  placeholder="e.g. Recruiter message received, follow-up scheduled for next Tuesday..."
                  className="w-full p-3 bg-slate-850 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                />
                <button
                  onClick={() => onUpdateStatus(job.id, job.status, notesInput, interviewDateInput)}
                  className="px-3 py-1.5 rounded-lg bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 border border-indigo-500/30 text-xs font-medium"
                >
                  Save Notes
                </button>
              </div>

              {/* Submission Logs if applied */}
              {job.applicationRecord?.submissionLog && (
                <div className="space-y-1.5 pt-2">
                  <h5 className="font-semibold text-xs text-slate-400">Activity & Verification History</h5>
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-[11px] font-mono text-slate-400 space-y-1">
                    {job.applicationRecord.submissionLog.map((log, i) => (
                      <div key={i}>• {log}</div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer Actions */}
        <div className="p-4 sm:p-6 border-t border-slate-800 bg-slate-900 flex flex-wrap items-center justify-between gap-3 sticky bottom-0">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => openExternalJobApplication(job.url, job.company, job.title)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/25 transition-all active:scale-95 cursor-pointer"
              id="modal-footer-open-app-btn"
            >
              <span>Open Job Application</span>
              <ExternalLink className="h-3.5 w-3.5 text-indigo-100" />
            </button>

            <a
              href={getCompanyCareersSearchUrl(job.company, job.title)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 px-2.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-medium transition-colors"
              title="Search Google Careers for company portal"
            >
              <Search className="h-3 w-3 text-slate-400" />
              <span>Search Portal</span>
            </a>

            <button
              type="button"
              onClick={() => {
                navigator.clipboard.writeText(normalizeJobUrl(job.url, job.company, job.title));
                setCopiedLink(true);
                setTimeout(() => setCopiedLink(false), 2000);
              }}
              className="flex items-center gap-1 px-2.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-medium transition-colors cursor-pointer"
            >
              {copiedLink ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5 text-slate-400" />}
              <span>{copiedLink ? 'Copied!' : 'Copy Link'}</span>
            </button>
            {onOpenCopilot && (
              <button
                type="button"
                onClick={() => {
                  onOpenCopilot(job);
                  onClose();
                }}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 text-xs font-semibold transition-all cursor-pointer shadow-sm"
                title="Tailor resume & answer questions in Application Copilot"
              >
                <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
                <span>Open in Copilot</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {job.status === 'APPLIED' ? (
              <div className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-semibold">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                <span>Applied & Synced</span>
              </div>
            ) : (
              <button
                onClick={handleMarkApplied}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-semibold shadow-md shadow-emerald-600/20 transition-all active:scale-95 cursor-pointer"
              >
                <Send className="h-3.5 w-3.5" />
                <span>Mark Applied</span>
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
