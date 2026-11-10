import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  Send, 
  FileText, 
  Check, 
  Copy, 
  Plus, 
  Trash2, 
  Download, 
  Briefcase, 
  Building2, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  Layers, 
  Code, 
  Eye, 
  Edit3, 
  FileCode, 
  BookOpen,
  MessageSquare,
  HelpCircle,
  ExternalLink,
  Save,
  RotateCcw,
  ArrowRight,
  SlidersHorizontal,
  ChevronRight,
  Maximize2,
  Columns,
  ListFilter,
  CheckCircle,
  Clock,
  Sparkle,
  Share2,
  ChevronDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import { UserProfile, Job } from '../types';
import { apiFetch, apiUrl } from '../utils/api';

interface DetailedAnsweredQuestion {
  id: string;
  question: string;
  category: string;
  suggestedAnswer: string;
  referencedProjects: string[];
  keyHighlights: string[];
  confidence: number;
}

interface ApplicationCopilotViewProps {
  profile: UserProfile;
  jobs: Job[];
  initialJob?: Job | null;
  onSelectJob?: (job: Job) => void;
  onNavigate?: (tab: string) => void;
  onJobCreated?: (newJob: Job) => void;
}

const PRESET_QUESTIONS = [
  { 
    label: 'Why this role & company?', 
    tag: 'Alignment',
    color: 'from-blue-500/10 to-indigo-500/10 text-indigo-300 border-indigo-500/30',
    text: 'Why are you interested in this role and what makes you a great fit for our team?' 
  },
  { 
    label: 'Hardest technical problem', 
    tag: 'Problem Solving',
    color: 'from-amber-500/10 to-orange-500/10 text-amber-300 border-amber-500/30',
    text: 'Describe a challenging technical problem you solved, your architectural approach, and the outcome.' 
  },
  { 
    label: 'Real-time & state sync', 
    tag: 'Architecture',
    color: 'from-purple-500/10 to-violet-500/10 text-purple-300 border-purple-500/30',
    text: 'What experience do you have with real-time systems, WebSockets, CRDTs, and distributed state synchronization?' 
  },
  { 
    label: 'AI & LLM pipelines', 
    tag: 'AI/LLM',
    color: 'from-emerald-500/10 to-teal-500/10 text-emerald-300 border-emerald-500/30',
    text: 'What experience do you have with generative AI integration, prompt validation, and structured LLM outputs?' 
  },
  { 
    label: 'Code quality & testing', 
    tag: 'Reliability',
    color: 'from-sky-500/10 to-blue-500/10 text-sky-300 border-sky-500/30',
    text: 'How do you approach code quality, test coverage, and high-availability architecture under scale?' 
  },
  { 
    label: 'Notice period & compensation', 
    tag: 'Logistics',
    color: 'from-rose-500/10 to-pink-500/10 text-rose-300 border-rose-500/30',
    text: 'What is your current notice period, location preference, and expected CTC?' 
  },
];

const SAMPLE_JOB = {
  title: 'Senior Full Stack Engineer',
  company: 'Linear',
  description: `Linear is looking for a Senior Full Stack Engineer to build high-performance, real-time collaborative workspace software.

Requirements:
• 2+ years of production experience with TypeScript, React 18+, Node.js, and modern state architectures.
• Experience building low-latency, real-time collaboration engines (WebSockets, CRDTs, optimistic UI updates).
• Deep understanding of SQL/NoSQL databases, index tuning, and performance profiling.
• Familiarity with client-side computing (Web Workers, WebGPU, or canvas rendering) is a plus.
• Strong engineering discipline: type safety, automated CI/CD testing, and defensive system design.

In this role, you will architect customer-facing features, optimize sync latency to sub-50ms, and maintain our high bar for craftsmanship.`
};

export default function ApplicationCopilotView({
  profile,
  jobs,
  initialJob,
  onSelectJob,
  onNavigate,
  onJobCreated,
}: ApplicationCopilotViewProps) {
  // Navigation / View Modes:
  // 'form' -> Full focus on setup & questions
  // 'results' -> Full focus on reading/copying answers & resume
  // 'split' -> Side-by-side on wide screens
  const [viewMode, setViewMode] = useState<'form' | 'results' | 'split'>('form');

  // Form State
  const [jobTitle, setJobTitle] = useState(initialJob?.title || '');
  const [company, setCompany] = useState(initialJob?.company || '');
  const [jobDescription, setJobDescription] = useState(initialJob?.description || '');
  const [questions, setQuestions] = useState<Array<{ id: string; question: string; category?: string }>>([
    { id: 'q_1', question: 'Why are you interested in this role and what makes you a great fit for our team?', category: 'Company Alignment' },
    { id: 'q_2', question: 'Describe a challenging technical problem you solved, your architectural approach, and the outcome.', category: 'Problem Solving' },
    { id: 'q_3', question: 'What experience do you have with real-time systems, WebSockets, CRDTs, and distributed state synchronization?', category: 'Technical Architecture' },
    { id: 'q_4', question: 'What is your current notice period, location preference, and expected CTC?', category: 'Logistics' },
  ]);
  const [saveToDb, setSaveToDb] = useState(true);

  // Bulk question import modal
  const [isBulkOpen, setIsBulkOpen] = useState(false);
  const [bulkInput, setBulkInput] = useState('');

  // Generation & Status State
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStep, setGenerationStep] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Result State
  const [result, setResult] = useState<{
    job: Job;
    tailoredResume: any;
    questions: DetailedAnsweredQuestion[];
  } | null>(null);

  // Results Sub-Tab: 'questions' vs 'resume'
  const [resultTab, setResultTab] = useState<'questions' | 'resume'>('questions');
  const [selectedQuestionIdx, setSelectedQuestionIdx] = useState<number>(0);
  const [questionLayout, setQuestionLayout] = useState<'stack' | 'focus'>('stack');

  // Clipboard & Editing State
  const [copiedAnswerId, setCopiedAnswerId] = useState<string | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);
  const [copiedTex, setCopiedTex] = useState(false);
  const [editingAnswerId, setEditingAnswerId] = useState<string | null>(null);
  const [editedAnswers, setEditedAnswers] = useState<Record<string, string>>({});
  const [showLatexSource, setShowLatexSource] = useState(false);

  // Pre-fill from initialJob if changed
  useEffect(() => {
    if (initialJob) {
      setJobTitle(initialJob.title);
      setCompany(initialJob.company);
      setJobDescription(initialJob.description);
    }
  }, [initialJob]);

  // Animated progress step simulator during generation
  useEffect(() => {
    let timer: any;
    if (isGenerating) {
      setGenerationStep(1);
      timer = setInterval(() => {
        setGenerationStep(prev => (prev < 4 ? prev + 1 : prev));
      }, 3500);
    } else {
      setGenerationStep(0);
    }
    return () => clearInterval(timer);
  }, [isGenerating]);

  // Question Management Handlers
  const handleAddQuestion = (text: string = '', category: string = 'Technical Experience') => {
    const newId = `q_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
    setQuestions(prev => [...prev, { id: newId, question: text, category }]);
  };

  const handleUpdateQuestion = (id: string, text: string) => {
    setQuestions(prev => prev.map(q => (q.id === id ? { ...q, question: text } : q)));
  };

  const handleRemoveQuestion = (id: string) => {
    setQuestions(prev => prev.filter(q => q.id !== id));
  };

  const handleApplyPreset = (presetText: string, category: string = 'Technical Experience') => {
    if (!questions.some(q => q.question.toLowerCase() === presetText.toLowerCase())) {
      handleAddQuestion(presetText, category);
    }
  };

  const handleImportBulk = () => {
    if (!bulkInput.trim()) return;
    const splitLines = bulkInput
      .split(/\r?\n/)
      .map(l => l.trim().replace(/^[\d+.)-]\s*/, ''))
      .filter(l => l.length > 5);

    if (splitLines.length > 0) {
      const newItems = splitLines.map((text, idx) => ({
        id: `q_bulk_${Date.now()}_${idx}`,
        question: text,
        category: 'Custom Question'
      }));
      setQuestions(prev => [...prev, ...newItems]);
    }
    setBulkInput('');
    setIsBulkOpen(false);
  };

  const handleLoadSample = () => {
    setJobTitle(SAMPLE_JOB.title);
    setCompany(SAMPLE_JOB.company);
    setJobDescription(SAMPLE_JOB.description);
  };

  const handleSelectDiscoveredJob = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedId = e.target.value;
    if (!selectedId) return;
    const target = jobs.find(j => j.id === selectedId);
    if (target) {
      setJobTitle(target.title);
      setCompany(target.company);
      setJobDescription(target.description);
    }
  };

  // Main Action: Generate Tailored Resume + Answer All Questions
  const handleGenerate = async () => {
    if (!jobTitle.trim() || !jobDescription.trim()) {
      setError('Please provide both a Job Title and Job Description to tailor your application.');
      return;
    }

    setError(null);
    setIsGenerating(true);

    try {
      const validQuestions = questions.filter(q => q.question.trim().length > 0);
      const res = await apiFetch('/api/application-copilot/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobTitle: jobTitle.trim(),
          company: company.trim() || 'Target Company',
          jobDescription: jobDescription.trim(),
          questions: validQuestions,
          saveJob: saveToDb
        })
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${res.status}: Failed to generate application`);
      }

      const data = await res.json();
      setResult(data);
      // Seamlessly transition into results view
      setViewMode('results');
      setResultTab('questions');
      setSelectedQuestionIdx(0);

      // Initialize editable answers map
      const initialMap: Record<string, string> = {};
      data.questions.forEach((q: DetailedAnsweredQuestion) => {
        initialMap[q.id] = q.suggestedAnswer;
      });
      setEditedAnswers(initialMap);

      if (onJobCreated && data.job) {
        onJobCreated(data.job);
      }

      // Celebratory confetti
      confetti({
        particleCount: 90,
        spread: 75,
        origin: { y: 0.6 }
      });
    } catch (err: any) {
      console.error('Copilot Generation Error:', err);
      setError(err.message || 'Something went wrong while generating tailored application.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Copy Single Answer
  const handleCopyAnswer = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedAnswerId(id);
    setTimeout(() => setCopiedAnswerId(null), 2500);
  };

  // Copy All Q&A
  const handleCopyAllQA = () => {
    if (!result) return;
    const markdown = result.questions
      .map((q, idx) => {
        const currentAns = editedAnswers[q.id] || q.suggestedAnswer;
        return `### Question ${idx + 1}: ${q.question}\n**Category:** ${q.category}\n${q.referencedProjects.length > 0 ? `**Referenced Projects:** ${q.referencedProjects.join(', ')}\n` : ''}\n${currentAns}\n`;
      })
      .join('\n---\n\n');

    navigator.clipboard.writeText(markdown);
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2500);
  };

  // Copy LaTeX
  const handleCopyTex = () => {
    if (result?.tailoredResume?.latexCode) {
      navigator.clipboard.writeText(result.tailoredResume.latexCode);
      setCopiedTex(true);
      setTimeout(() => setCopiedTex(false), 2500);
    }
  };

  const getStepText = (step: number) => {
    switch (step) {
      case 1:
        return 'Analyzing job requirements, keywords, and technical stack...';
      case 2:
        return 'Selecting & ranking best-matching projects from your verified dossiers...';
      case 3:
        return 'Drafting interview-grade answers using your full profile & project architectures...';
      case 4:
        return 'Compiling ATS-compliant LaTeX resume & generating downloadable PDF...';
      default:
        return 'Initializing Application Copilot...';
    }
  };

  // Detected skills preview from description
  const detectedSkills = [
    'React', 'TypeScript', 'Node.js', 'Next.js', 'PostgreSQL', 'Convex', 
    'Liveblocks', 'CRDT', 'Redis', 'Python', 'Tailwind', 'Docker', 'AWS'
  ].filter(s => jobDescription.toLowerCase().includes(s.toLowerCase()));

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Top Banner & Control Deck */}
      <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-slate-800 shadow-xl backdrop-blur-xl relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-indigo-600/30 ring-1 ring-white/10 shrink-0">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-bold tracking-tight text-white">
                  Application Copilot & Q&A Studio
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 font-semibold">
                  PRO
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Tailor ATS-compliant LaTeX resumes & generate grounded answers for portal questions.
              </p>
            </div>
          </div>

          {/* Quick Tools & Mode Switcher */}
          <div className="flex items-center gap-2 flex-wrap">
            {result && (
              <div className="flex items-center bg-slate-950/90 p-1 rounded-xl border border-slate-800">
                <button
                  onClick={() => setViewMode('form')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
                    viewMode === 'form'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <SlidersHorizontal className="h-3.5 w-3.5" />
                  <span>Setup & Form</span>
                </button>

                <button
                  onClick={() => setViewMode('results')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
                    viewMode === 'results'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <CheckCircle className="h-3.5 w-3.5 text-emerald-400" />
                  <span>Results Studio</span>
                  <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300">
                    {result.tailoredResume.atsMatchScore}%
                  </span>
                </button>

                <button
                  onClick={() => setViewMode('split')}
                  className={`hidden xl:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                    viewMode === 'split'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                  title="View Form and Results Side-by-Side"
                >
                  <Columns className="h-3.5 w-3.5" />
                  <span>Split View</span>
                </button>
              </div>
            )}

            {!result && (
              <button
                onClick={handleLoadSample}
                className="px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-750 text-slate-200 border border-slate-700/80 text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
              >
                <Briefcase className="h-3.5 w-3.5 text-indigo-400" />
                <span>Load Sample Job</span>
              </button>
            )}

            {jobs.length > 0 && !result && (
              <select
                onChange={handleSelectDiscoveredJob}
                defaultValue=""
                className="px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-750 text-slate-200 border border-slate-700/80 text-xs font-medium cursor-pointer shadow-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 max-w-xs"
              >
                <option value="" disabled>Load from Discovered Jobs ({jobs.length})</option>
                {jobs.map(j => (
                  <option key={j.id} value={j.id}>{j.title} @ {j.company}</option>
                ))}
              </select>
            )}

            {result && (
              <button
                onClick={() => {
                  setResult(null);
                  setViewMode('form');
                }}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 border border-slate-700 text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>New Application</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* VIEW MODE: FORM SETUP ONLY */}
      {viewMode === 'form' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Step 1: Target Position & Posting (6 Cols) */}
            <div className="lg:col-span-6 space-y-5">
              <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-md backdrop-blur-md space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <span className="h-6 w-6 rounded-lg bg-indigo-500/20 text-indigo-300 font-mono text-xs font-bold flex items-center justify-center">
                      1
                    </span>
                    <h3 className="text-sm font-semibold text-white">Target Position & Description</h3>
                  </div>
                  {jobTitle && company && (
                    <span className="text-[11px] text-emerald-400 font-medium flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3" /> Ready
                    </span>
                  )}
                </div>

                {/* Job Title & Company */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Job Title <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={jobTitle}
                      onChange={e => setJobTitle(e.target.value)}
                      placeholder="e.g. Senior Full Stack Engineer"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Company Name
                    </label>
                    <input
                      type="text"
                      value={company}
                      onChange={e => setCompany(e.target.value)}
                      placeholder="e.g. Linear, Stripe, Vercel"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all font-medium"
                    />
                  </div>
                </div>

                {/* Job Description */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-medium text-slate-300">
                      Job Description & Requirements <span className="text-rose-400">*</span>
                    </label>
                    <div className="flex items-center gap-2 text-[11px] text-slate-500">
                      <span>{jobDescription.split(/\s+/).filter(Boolean).length} words</span>
                      {jobDescription && (
                        <button
                          onClick={() => setJobDescription('')}
                          className="hover:text-rose-400 transition-colors"
                        >
                          Clear
                        </button>
                      )}
                    </div>
                  </div>
                  <textarea
                    value={jobDescription}
                    onChange={e => setJobDescription(e.target.value)}
                    rows={12}
                    placeholder="Paste the full job posting here. Include responsibilities, tech stack, and qualifications for the highest match precision..."
                    className="w-full px-3.5 py-3 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all resize-y leading-relaxed font-sans"
                  />
                </div>

                {/* Detected Keywords Preview */}
                {detectedSkills.length > 0 && (
                  <div className="pt-2 border-t border-slate-800/80">
                    <span className="text-[11px] text-slate-400 font-medium block mb-1.5">
                      Detected Key Tech:
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {detectedSkills.map((s, idx) => (
                        <span key={idx} className="px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 text-[10px] font-mono">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Step 2: Application Questions (6 Cols) */}
            <div className="lg:col-span-6 space-y-5">
              <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-md backdrop-blur-md space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <span className="h-6 w-6 rounded-lg bg-purple-500/20 text-purple-300 font-mono text-xs font-bold flex items-center justify-center">
                      2
                    </span>
                    <h3 className="text-sm font-semibold text-white">Application Questions ({questions.length})</h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsBulkOpen(true)}
                    className="text-xs text-indigo-400 hover:text-indigo-300 font-medium transition-colors cursor-pointer"
                  >
                    + Bulk Paste Questions
                  </button>
                </div>

                {/* Preset Chips */}
                <div className="space-y-1.5">
                  <span className="text-[11px] font-medium text-slate-400 block">
                    Quick-add common application questions:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {PRESET_QUESTIONS.map((preset, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleApplyPreset(preset.text, preset.tag)}
                        className={`px-2.5 py-1 rounded-lg border text-[11px] font-medium transition-all cursor-pointer bg-gradient-to-r hover:opacity-90 ${preset.color}`}
                      >
                        + {preset.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Questions Input List */}
                <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
                  {questions.map((q, idx) => (
                    <div 
                      key={q.id} 
                      className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-slate-750 transition-all space-y-2 group"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="h-5 w-5 rounded-md bg-indigo-500/10 text-indigo-300 text-[10px] font-bold font-mono flex items-center justify-center">
                            #{idx + 1}
                          </span>
                          <span className="text-[11px] text-slate-400 font-medium">
                            {q.category || 'Application Question'}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveQuestion(q.id)}
                          className="p-1 rounded-md text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors opacity-70 group-hover:opacity-100 cursor-pointer"
                          title="Remove Question"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      <textarea
                        value={q.question}
                        onChange={e => handleUpdateQuestion(q.id, e.target.value)}
                        rows={2}
                        placeholder="Type question or prompt from application portal..."
                        className="w-full bg-slate-900/60 p-2 rounded-lg border border-slate-800 text-xs text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none leading-relaxed"
                      />
                    </div>
                  ))}
                </div>

                {/* Add Custom Question Button */}
                <button
                  type="button"
                  onClick={() => handleAddQuestion()}
                  className="w-full py-2.5 rounded-xl border border-dashed border-slate-700 hover:border-indigo-500/50 bg-slate-850/40 hover:bg-indigo-500/10 text-slate-300 hover:text-indigo-200 text-xs font-medium transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Plus className="h-3.5 w-3.5 text-indigo-400" />
                  <span>Add Another Question</span>
                </button>
              </div>
            </div>
          </div>

          {/* Step 3: Launch Deck & Generation Control */}
          <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950/30 to-slate-900 border border-indigo-500/30 shadow-xl backdrop-blur-md">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="saveToDbCheckboxForm"
                    checked={saveToDb}
                    onChange={e => setSaveToDb(e.target.checked)}
                    className="h-4 w-4 rounded bg-slate-950 border-slate-700 text-indigo-600 focus:ring-0 focus:ring-offset-0 cursor-pointer"
                  />
                  <label htmlFor="saveToDbCheckboxForm" className="text-xs font-medium text-slate-200 cursor-pointer select-none">
                    Save this tailored application directly into the Applications Tracker
                  </label>
                </div>
                <p className="text-[11px] text-slate-400 pl-6">
                  Uses Gemini 3.8 Flash High Cascade with zero-hallucination factual grounding.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={handleGenerate}
                  disabled={isGenerating}
                  className={`px-6 py-3 rounded-xl font-bold text-xs sm:text-sm text-white shadow-lg transition-all flex items-center gap-2 cursor-pointer ${
                    isGenerating
                      ? 'bg-indigo-750 cursor-not-allowed opacity-80'
                      : 'bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 shadow-indigo-600/30 hover:shadow-indigo-600/50 active:scale-95'
                  }`}
                >
                  {isGenerating ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin text-indigo-200" />
                      <span>Generating Application...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 text-indigo-200" />
                      <span>Generate Tailored Resume & Answer Questions</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {error && (
              <div className="mt-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {isGenerating && (
              <div className="mt-4 p-3.5 rounded-xl bg-indigo-950/50 border border-indigo-500/30 text-xs text-indigo-200 space-y-2.5 animate-pulse">
                <div className="flex items-center justify-between text-[11px] text-indigo-300 font-semibold">
                  <span>Gemini 3.8 Flash High Cascade Active</span>
                  <span>Step {generationStep || 1} of 4</span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-indigo-500 h-1.5 transition-all duration-500"
                    style={{ width: `${(generationStep / 4) * 100}%` }}
                  />
                </div>
                <p className="text-[11px] text-slate-300 font-mono">
                  {getStepText(generationStep)}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* VIEW MODE: RESULTS STUDIO (Full Focus & Wide Layout) */}
      {(viewMode === 'results' || viewMode === 'split') && result && (
        <div className="space-y-6">
          {/* Executive Results Header Card */}
          <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-indigo-500/30 shadow-xl backdrop-blur-md">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="space-y-1.5">
                <div className="flex items-center gap-3 flex-wrap">
                  <h3 className="text-lg font-bold text-white">
                    {result.job.title}
                  </h3>
                  <span className="text-sm font-semibold text-indigo-300">
                    @ {result.job.company}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                    <CheckCircle className="h-3 w-3" />
                    {result.tailoredResume.atsMatchScore}% ATS Match
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-medium bg-purple-500/15 text-purple-300 border border-purple-500/30">
                    {result.questions.length} Questions Answered
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  Grounded in your verified work at SidLabs LLP & complete project dossiers. Ready to paste directly into your job application.
                </p>
              </div>

              {/* Fast Action Buttons */}
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={() => setViewMode('form')}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer"
                  title="Modify target role or questions"
                >
                  <Edit3 className="h-3.5 w-3.5 text-slate-400" />
                  <span>Edit Form</span>
                </button>

                <button
                  onClick={handleCopyAllQA}
                  className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer"
                  title="Copy all questions & answers as clean Markdown"
                >
                  {copiedAll ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5 text-indigo-400" />}
                  <span>{copiedAll ? 'Copied All!' : 'Copy All Q&A'}</span>
                </button>

                {result.tailoredResume.pdfUrl && (
                  <a
                    href={apiUrl(result.tailoredResume.pdfUrl)}
                    download
                    className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/30 transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <Download className="h-3.5 w-3.5" />
                    <span>Download ATS PDF</span>
                  </a>
                )}
              </div>
            </div>

            {/* Sub-Tabs Selector: Q&A vs Resume */}
            <div className="flex items-center gap-2 pt-4 mt-4 border-t border-slate-800/80">
              <button
                onClick={() => setResultTab('questions')}
                className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-2 ${
                  resultTab === 'questions'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'bg-slate-800/70 text-slate-300 hover:bg-slate-800'
                }`}
              >
                <MessageSquare className="h-3.5 w-3.5" />
                <span>Application Answers ({result.questions.length})</span>
              </button>

              <button
                onClick={() => setResultTab('resume')}
                className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-2 ${
                  resultTab === 'resume'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'bg-slate-800/70 text-slate-300 hover:bg-slate-800'
                }`}
              >
                <FileText className="h-3.5 w-3.5" />
                <span>Tailored ATS Resume & LaTeX</span>
              </button>
            </div>
          </div>

          {/* TAB CONTENT: Questions & Answers */}
          {resultTab === 'questions' && (
            <div className="space-y-4">
              {/* Layout Switcher Toolbar */}
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-slate-300">
                    Questions Overview
                  </span>
                  <span className="text-xs text-slate-500 font-mono">
                    ({result.questions.length} answered)
                  </span>
                </div>

                <div className="flex items-center gap-1.5 bg-slate-900 p-1 rounded-xl border border-slate-800">
                  <button
                    onClick={() => setQuestionLayout('stack')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                      questionLayout === 'stack' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    All Cards
                  </button>
                  <button
                    onClick={() => setQuestionLayout('focus')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                      questionLayout === 'focus' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Question-by-Question Focus
                  </button>
                </div>
              </div>

              {/* FOCUS MODE: Question-by-Question Master Detail */}
              {questionLayout === 'focus' && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                  {/* Left Questions Selector */}
                  <div className="lg:col-span-4 space-y-2">
                    {result.questions.map((q, idx) => {
                      const isSelected = selectedQuestionIdx === idx;
                      return (
                        <div
                          key={q.id || idx}
                          onClick={() => setSelectedQuestionIdx(idx)}
                          className={`p-3 rounded-xl border cursor-pointer transition-all space-y-1.5 ${
                            isSelected
                              ? 'bg-slate-900 border-indigo-500/60 shadow-md ring-1 ring-indigo-500/20'
                              : 'bg-slate-950/60 border-slate-850 hover:bg-slate-900/60 hover:border-slate-800'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold font-mono px-1.5 py-0.5 rounded bg-indigo-500/15 text-indigo-300">
                              Q{idx + 1}
                            </span>
                            <span className="text-[10px] text-slate-400 font-medium">
                              {q.category}
                            </span>
                          </div>
                          <p className="text-xs font-semibold text-white line-clamp-2 leading-snug">
                            {q.question}
                          </p>
                          {q.referencedProjects.length > 0 && (
                            <span className="text-[10px] text-purple-300 font-mono block truncate">
                              • {q.referencedProjects.join(', ')}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Right Active Question Focus View */}
                  <div className="lg:col-span-8">
                    {(() => {
                      const q = result.questions[selectedQuestionIdx];
                      if (!q) return null;
                      const currentText = editedAnswers[q.id] !== undefined ? editedAnswers[q.id] : q.suggestedAnswer;
                      const isEditing = editingAnswerId === q.id;

                      return (
                        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-5">
                          {/* Card Header */}
                          <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-800">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-mono font-bold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                                  Question {selectedQuestionIdx + 1} of {result.questions.length}
                                </span>
                                <span className="text-xs font-medium text-slate-300 px-2 py-0.5 rounded bg-slate-800 border border-slate-750">
                                  {q.category}
                                </span>
                              </div>
                              <h4 className="text-base font-bold text-white pt-1 leading-snug">
                                {q.question}
                              </h4>
                            </div>

                            <button
                              onClick={() => handleCopyAnswer(q.id, currentText)}
                              className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${
                                copiedAnswerId === q.id
                                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                  : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/20'
                              }`}
                            >
                              {copiedAnswerId === q.id ? (
                                <>
                                  <Check className="h-3.5 w-3.5 text-emerald-400" />
                                  <span>Copied!</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="h-3.5 w-3.5" />
                                  <span>Copy Answer</span>
                                </>
                              )}
                            </button>
                          </div>

                          {/* Cited Projects & Takeaways */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {q.referencedProjects.length > 0 && (
                              <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1">
                                <span className="text-[10px] uppercase font-bold text-purple-400 block tracking-wider">
                                  Cited Projects & Experience
                                </span>
                                <div className="flex flex-wrap gap-1">
                                  {q.referencedProjects.map((p, pIdx) => (
                                    <span key={pIdx} className="text-[11px] font-mono text-purple-200">
                                      • {p}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}

                            {q.keyHighlights.length > 0 && (
                              <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1">
                                <span className="text-[10px] uppercase font-bold text-emerald-400 block tracking-wider">
                                  Key Points Emphasized
                                </span>
                                <div className="space-y-0.5">
                                  {q.keyHighlights.map((hl, hIdx) => (
                                    <div key={hIdx} className="text-[11px] text-slate-300 flex items-start gap-1">
                                      <span className="text-emerald-400">✓</span>
                                      <span>{hl}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Answer Body */}
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-semibold text-slate-300">
                                Complete Drafted Answer:
                              </span>
                              <button
                                onClick={() => setEditingAnswerId(isEditing ? null : q.id)}
                                className="text-xs text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1 transition-colors"
                              >
                                <Edit3 className="h-3 w-3" />
                                <span>{isEditing ? 'Done Editing' : 'Edit Text'}</span>
                              </button>
                            </div>

                            {isEditing ? (
                              <textarea
                                value={currentText}
                                onChange={e => setEditedAnswers({ ...editedAnswers, [q.id]: e.target.value })}
                                rows={8}
                                className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-indigo-500/50 text-xs text-white leading-relaxed focus:outline-none resize-y font-sans"
                              />
                            ) : (
                              <div className="p-4 rounded-xl bg-slate-950/90 border border-slate-850 text-xs text-slate-200 leading-relaxed font-sans whitespace-pre-wrap selection:bg-indigo-500 selection:text-white">
                                {currentText}
                              </div>
                            )}
                          </div>

                          {/* Word Count & Navigation between questions */}
                          <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800">
                            <span>{currentText.split(/\s+/).filter(Boolean).length} words • {currentText.length} characters</span>
                            <div className="flex items-center gap-2">
                              <button
                                disabled={selectedQuestionIdx === 0}
                                onClick={() => setSelectedQuestionIdx(prev => Math.max(0, prev - 1))}
                                className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-750 disabled:opacity-40 text-xs text-slate-300 cursor-pointer"
                              >
                                Previous
                              </button>
                              <button
                                disabled={selectedQuestionIdx === result.questions.length - 1}
                                onClick={() => setSelectedQuestionIdx(prev => Math.min(result.questions.length - 1, prev + 1))}
                                className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-750 disabled:opacity-40 text-xs text-slate-300 cursor-pointer"
                              >
                                Next
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </div>
              )}

              {/* STACK MODE: All Cards Expanded */}
              {questionLayout === 'stack' && (
                <div className="space-y-4">
                  {result.questions.map((q, idx) => {
                    const currentText = editedAnswers[q.id] !== undefined ? editedAnswers[q.id] : q.suggestedAnswer;
                    const isEditing = editingAnswerId === q.id;

                    return (
                      <div
                        key={q.id || idx}
                        className="p-5 sm:p-6 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-750 shadow-lg space-y-4 transition-all"
                      >
                        {/* Question Header & Category */}
                        <div className="flex items-start justify-between gap-4">
                          <div className="space-y-1 min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-xs font-mono font-bold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                                Question #{idx + 1}
                              </span>
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-slate-800 text-slate-300 border border-slate-700">
                                {q.category}
                              </span>
                              {q.confidence && (
                                <span className="text-[10px] text-slate-500 font-mono">
                                  {Math.round(q.confidence * 100)}% match
                                </span>
                              )}
                            </div>
                            <h4 className="text-sm sm:text-base font-bold text-white pt-1 leading-snug">
                              {q.question}
                            </h4>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              onClick={() => setEditingAnswerId(isEditing ? null : q.id)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
                              title={isEditing ? 'Done Editing' : 'Edit Answer'}
                            >
                              <Edit3 className="h-3.5 w-3.5" />
                            </button>

                            <button
                              onClick={() => handleCopyAnswer(q.id, currentText)}
                              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                                copiedAnswerId === q.id
                                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                  : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm'
                              }`}
                            >
                              {copiedAnswerId === q.id ? (
                                <>
                                  <Check className="h-3.5 w-3.5 text-emerald-400" />
                                  <span>Copied!</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="h-3.5 w-3.5" />
                                  <span>Copy</span>
                                </>
                              )}
                            </button>
                          </div>
                        </div>

                        {/* Referenced Projects & Highlights */}
                        <div className="flex flex-wrap gap-2 pt-1">
                          {q.referencedProjects.map((p, pIdx) => (
                            <span key={pIdx} className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-500/10 text-purple-300 border border-purple-500/20">
                              Project: {p}
                            </span>
                          ))}
                          {q.keyHighlights.slice(0, 2).map((hl, hIdx) => (
                            <span key={hIdx} className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                              ✓ {hl}
                            </span>
                          ))}
                        </div>

                        {/* Answer Body */}
                        {isEditing ? (
                          <textarea
                            value={currentText}
                            onChange={e => setEditedAnswers({ ...editedAnswers, [q.id]: e.target.value })}
                            rows={6}
                            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-indigo-500/40 text-xs text-white leading-relaxed focus:outline-none resize-y font-sans"
                          />
                        ) : (
                          <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-850 text-xs text-slate-200 leading-relaxed font-sans whitespace-pre-wrap selection:bg-indigo-500 selection:text-white">
                            {currentText}
                          </div>
                        )}

                        <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                          <span>{currentText.split(/\s+/).filter(Boolean).length} words • {currentText.length} characters</span>
                          <span className="italic text-slate-400">Ready to paste</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB CONTENT: Tailored ATS Resume */}
          {resultTab === 'resume' && (
            <div className="space-y-6">
              {/* Top Resume Deck & Action Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-md space-y-2">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                    ATS Match Score
                  </span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-extrabold text-white">
                      {result.tailoredResume.atsMatchScore}%
                    </span>
                    <span className="text-xs text-emerald-400 font-medium">Overleaf Optimized</span>
                  </div>
                  <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div 
                      className="bg-emerald-500 h-1.5" 
                      style={{ width: `${result.tailoredResume.atsMatchScore}%` }}
                    />
                  </div>
                </div>

                <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-md space-y-2">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                    ATS Downloads
                  </span>
                  <div className="flex flex-col gap-2 pt-1">
                    {result.tailoredResume.pdfUrl && (
                      <a
                        href={apiUrl(result.tailoredResume.pdfUrl)}
                        download
                        className="px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md transition-all flex items-center justify-center gap-2"
                      >
                        <Download className="h-3.5 w-3.5" />
                        <span>Download ATS PDF (.pdf)</span>
                      </a>
                    )}
                    {result.tailoredResume.texUrl && (
                      <a
                        href={apiUrl(result.tailoredResume.texUrl)}
                        download
                        className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 text-xs font-medium transition-all flex items-center justify-center gap-2"
                      >
                        <FileCode className="h-3.5 w-3.5 text-purple-400" />
                        <span>Download LaTeX (.tex)</span>
                      </a>
                    )}
                  </div>
                </div>

                <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-md space-y-2">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                    Version & Overleaf Setup
                  </span>
                  <p className="text-xs font-mono text-indigo-300 truncate">
                    {result.tailoredResume.versionId}
                  </p>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Complies with the 1-page ATS template, glyphtounicode, and strict bullet rules.
                  </p>
                  <button
                    onClick={handleCopyTex}
                    className="w-full mt-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-300 border border-slate-700 text-xs font-medium flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    {copiedTex ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                    <span>{copiedTex ? 'Copied LaTeX Code!' : 'Copy LaTeX Code'}</span>
                  </button>
                </div>
              </div>

              {/* Matched Keywords */}
              {result.tailoredResume.keywordsPresent && result.tailoredResume.keywordsPresent.length > 0 && (
                <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-md space-y-2.5">
                  <span className="text-xs font-bold text-slate-300 block">
                    Keywords Matched from Job Description ({result.tailoredResume.keywordsPresent.length}):
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {result.tailoredResume.keywordsPresent.map((kw: string, kIdx: number) => (
                      <span
                        key={kIdx}
                        className="px-2.5 py-1 rounded-md bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 text-[11px] font-mono"
                      >
                        ✓ {kw}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Selected Anonymized Projects */}
              {result.tailoredResume.selectedProjects && result.tailoredResume.selectedProjects.length > 0 && (
                <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-md space-y-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                    <Layers className="h-4 w-4 text-purple-400" />
                    Anonymized Projects Selected for this Role ({result.tailoredResume.selectedProjects.length})
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {result.tailoredResume.selectedProjects.map((proj: any, pIdx: number) => (
                      <div key={pIdx} className="p-4 rounded-xl bg-slate-950/80 border border-slate-850 space-y-2.5">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs text-white">{proj.name}</span>
                          <span className="text-[10px] text-slate-400 font-mono">{proj.role || 'Full Stack Engineer'}</span>
                        </div>
                        {proj.technologies && (
                          <div className="flex flex-wrap gap-1">
                            {proj.technologies.slice(0, 5).map((t: string, tIdx: number) => (
                              <span key={tIdx} className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                                {t}
                              </span>
                            ))}
                          </div>
                        )}
                        <ul className="space-y-1.5 text-slate-300 text-xs">
                          {(proj.relevantBullets || []).map((b: string, bIdx: number) => (
                            <li key={bIdx} className="flex items-start gap-2">
                              <span className="text-indigo-400 font-bold mt-0.5">▸</span>
                              <span className="leading-relaxed">{b}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* LaTeX Code Previewer */}
              {result.tailoredResume.latexCode && (
                <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-md space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                      <Code className="h-4 w-4 text-indigo-400" />
                      LaTeX Source Code (.tex)
                    </h4>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleCopyTex}
                        className="text-xs text-slate-300 hover:text-white px-2.5 py-1 rounded bg-slate-800 cursor-pointer"
                      >
                        {copiedTex ? 'Copied!' : 'Copy Code'}
                      </button>
                      <button
                        onClick={() => setShowLatexSource(!showLatexSource)}
                        className="text-xs text-indigo-400 hover:text-indigo-300 font-medium transition-colors cursor-pointer"
                      >
                        {showLatexSource ? 'Collapse' : 'Expand Code'}
                      </button>
                    </div>
                  </div>

                  {showLatexSource && (
                    <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-[11px] font-mono text-slate-300 overflow-x-auto max-h-[500px] leading-relaxed">
                      {result.tailoredResume.latexCode}
                    </pre>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Bulk Import Questions Modal */}
      {isBulkOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-lg w-full space-y-4 shadow-2xl">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-indigo-400" />
                Bulk Paste Questions
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Paste questions directly from your job portal (one per line). They will be automatically parsed into individual editable fields.
              </p>
            </div>

            <textarea
              value={bulkInput}
              onChange={e => setBulkInput(e.target.value)}
              rows={7}
              placeholder="1. Why are you interested in this position?&#10;2. What is your experience with React and TypeScript?&#10;3. What is your notice period?"
              className="w-full px-3.5 py-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-sans"
            />

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setIsBulkOpen(false)}
                className="px-3 py-1.5 rounded-lg text-slate-400 hover:text-white text-xs font-medium cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleImportBulk}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold cursor-pointer shadow-md shadow-indigo-600/20"
              >
                Import Questions
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
