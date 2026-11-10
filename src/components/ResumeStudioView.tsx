import React, { useState } from 'react';
import { 
  FileText, 
  Sparkles, 
  CheckCircle2, 
  Plus, 
  Trash2, 
  Save, 
  UploadCloud, 
  Copy, 
  Check, 
  ShieldCheck, 
  Building2, 
  Code, 
  Briefcase, 
  Terminal, 
  Layers, 
  ExternalLink, 
  Download, 
  BookOpen, 
  X, 
  Edit3, 
  Eye, 
  FolderGit2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { UserProfile, Job, SkillItem, ExperienceItem, ProjectItem, ProjectDoc } from '../types';
import { apiUrl } from '../utils/api';

interface ResumeStudioViewProps {
  profile: UserProfile;
  jobs: Job[];
  onSaveProfile: (updated: Partial<UserProfile>) => Promise<void>;
  onSelectJob: (job: Job) => void;
  isLoading: boolean;
}

const PROJECT_DOCUMENTATION_PROMPT = `# Role & Objective
You are an expert Principal Software Engineer and Technical Resume Architect.
Your task is to analyze this entire codebase and produce a comprehensive, structured technical documentation dossier for this project.
This documentation will be used by an automated ATS Resume Tailoring engine to extract high-impact, role-relevant bullet points, architectural achievements, and technical stack details for customized LaTeX resumes.

# Instructions
1. Inspect the codebase thoroughly:
   - Identify dependencies, packages, frameworks, languages (e.g. package.json, requirements.txt, go.mod, Cargo.toml).
   - Trace core architecture, data flows, APIs, state management, background workers, databases, caching layers, and external integrations.
   - Look for complex engineering patterns (e.g., CRDTs, WebSocket real-time sync, Web Workers, client-side OCR, RAG/Vector embeddings, compression, HIPAA/GDPR sanitization, distributed queues, indexing, auth flows).
2. Formulate 7 to 10 ATS-optimized, high-impact resume bullet points:
   - Use the formula: [Strong Action Verb] + [Technical Tooling / Architecture Mechanism] + [Measurable Business / Performance Impact].
   - Quantify wherever possible (e.g., latency cut by X%, bundle reduction by Y%, concurrent users Z, throughput, sub-100ms response).
   - Format cleanly with proper LaTeX character escaping where applicable (e.g., \\%, \\&, \\$, \\_, \\#).
3. Output the final report in the exact structured markdown format below.

---

### PROJECT DOCUMENTATION DOSSIER

#### 1. Metadata
- **Project Name**: [Project Name]
- **Role / Title**: [e.g. Lead Full Stack Engineer / Full Stack Developer]
- **Context / Company**: [e.g. SidLabs LLP or Personal Project]
- **Primary Domain**: [e.g. AI LegalTech, Real-Time Collaboration, HealthTech, FinTech, Geospatial Analytics]
- **Live Link / Demo**: [URL or N/A]
- **GitHub Repository**: [URL or N/A]

#### 2. Technical Stack Taxonomy
- **Languages**: [e.g. TypeScript, JavaScript, Python, Java]
- **Frontend**: [e.g. React 18, Next.js 14, Tailwind CSS, Zustand, Redux, Vite]
- **Backend**: [e.g. Node.js, Express.js, Socket.io, REST APIs]
- **Databases & Vector**: [e.g. MongoDB, Mongoose, Redis, MongoDB Atlas Vector Search, PostgreSQL]
- **AI / LLM & NLP**: [e.g. Google Gemini, OpenAI, LangChain, Transformers.js, RAG, Tesseract.js OCR]
- **Cloud & DevOps**: [e.g. AWS (Cognito, S3, CloudFront, KMS), Docker, Vercel]
- **Libraries & Tooling**: [e.g. ExcelJS, Docxtemplater, Turf.js, Leaflet, Zod]

#### 3. Executive Summary & Problem Solved
- **Problem Statement**: What real-world challenge or engineering bottleneck did this project solve?
- **Technical Solution**: How did you architect and execute the solution?

#### 4. Deep Architecture Breakdown
- **Module 1 - [Name]**: [Detailed technical mechanics]
- **Module 2 - [Name]**: [Detailed technical mechanics]
- **Module 3 - [Name]**: [Detailed technical mechanics]

#### 5. Quantified Performance & Business Metrics
- [Metric 1: e.g. 50% faster turnaround time]
- [Metric 2: e.g. 2,000 concurrent active users supported]
- [Metric 3: e.g. 80% payload size compression (<1s load)]

#### 6. Ready-to-Use ATS Resume Bullet Points Pool
* [Action Verb] [Feature/System built with Stack] resulting in [Quantified Outcome/Impact].
* [Action Verb] [Engineered client/server optimization] achieving [Quantified Latency/Scale improvement].
* [Action Verb] [Architected secure/compliant pipeline] ensuring [Regulatory compliance / Security zero-trust].
* [Action Verb] [Implemented real-time/AI workflow] cutting [Time/Friction by X%].`;

const RESUME_INSTRUCTIONS_MANUAL = `PROCESS (follow in order)

Step 1 - Analyse the job description
- List the 10-15 most important keywords and phrases: tools, languages, frameworks, concepts, and the exact job title wording.
- Split them into "required" and "nice to have".
- Note the 3 things the employer cares about most.

Step 2 - Select and rank my projects
- Score each project against the required keywords.
- Keep only the 4-5 most relevant. Put the strongest match first.
- Within each project, keep the 2-3 bullets that best match the job and drop the rest.

Step 3 - Write the bullets
- Formula: action verb + what I built + tools used + measurable result.
- Each bullet is 1-2 lines (about 20-30 words), one idea per bullet.
- Use the job description's exact wording for tools and concepts wherever it is true for my work (write "Node.js" or "PostgreSQL" exactly as the posting does).
- Never invent a number, tool, result or responsibility. If a metric is missing, leave it out and list it under "things to verify".
- A tool may appear in Skills only if it appears in a bullet or I confirm I have used it for real.
- For AI/LLM work, show how the output was checked, such as validation, structured output, human review or cost and latency handling.

Step 4 - Language rules
- Banned words: architected, engineered, leveraged, utilized, utilizing, robust, scalable, seamless, end-to-end, cutting-edge, dynamic, innovative, passionate, results-driven, spearheaded, synergy, state-of-the-art, AI-powered, powerful, efficient, streamlined, "responsible for", "worked on", "helped with".
- No action verb is used twice in the whole resume.
- No descriptive word (such as pipeline, platform, system, workflow, dashboard) is used more than twice in the whole resume. Technology names are exempt.
- Plain, concrete wording. No filler adjectives. No first-person pronouns.
- Do not use project or product names. Describe each project by what it does and its stack, for example "Legal Case Automation (Next.js, Node.js, Google Gemini)".

Step 5 - Keyword placement
- Put the exact job title in the headline or first line of the summary.
- Summary: 2 lines, with years of experience, core stack and the main AI or domain focus.
- Order the Skills section by relevance to this job and use plain comma-separated lists.
- Each important keyword should appear 2-3 times across the resume (Skills plus bullets). No keyword stuffing.

Step 7 - Audit before output
Check each item and fix any failure:
- Every required keyword is covered, or marked as a gap.
- No banned word, no repeated verb, no repeated descriptive word.
- No invented facts.
- Compiles to exactly one page.
- No typos, double periods, broken symbols or mismatched links.
- Projects are in the right order.`;

export default function ResumeStudioView({
  profile,
  jobs,
  onSaveProfile,
  onSelectJob,
  isLoading,
}: ResumeStudioViewProps) {
  const [formData, setFormData] = useState<UserProfile>(profile);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState<'profile' | 'projectDocs' | 'skills' | 'tailoredList'>('projectDocs');

  // Modal States
  const [showPromptModal, setShowPromptModal] = useState(false);
  const [promptModalTab, setPromptModalTab] = useState<'instructions' | 'docsPrompt'>('instructions');
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const [activeDocModal, setActiveDocModal] = useState<ProjectDoc | null>(null);
  const [isEditingDoc, setIsEditingDoc] = useState(false);
  const [docEditForm, setDocEditForm] = useState<Partial<ProjectDoc>>({});

  const tailoredJobs = jobs.filter(j => j.tailoredResume);
  const projectDocs = formData.projectDocs || [];

  const handleSave = async () => {
    await onSaveProfile(formData);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  const handleCopyPrompt = () => {
    const textToCopy = promptModalTab === 'instructions' ? RESUME_INSTRUCTIONS_MANUAL : PROJECT_DOCUMENTATION_PROMPT;
    navigator.clipboard.writeText(textToCopy);
    setCopiedPrompt(true);
    setTimeout(() => setCopiedPrompt(false), 2500);
  };

  const handleAddSkill = () => {
    const newSkill: SkillItem = {
      id: `sk_${Date.now()}`,
      name: 'New Skill',
      category: 'Frontend',
      proficiency: 'Advanced',
      yearsExperience: 2,
      verified: true
    };
    setFormData({ ...formData, skills: [...formData.skills, newSkill] });
  };

  const handleRemoveSkill = (id: string) => {
    setFormData({ ...formData, skills: formData.skills.filter(s => s.id !== id) });
  };

  const handleOpenAddDoc = () => {
    setDocEditForm({
      id: `doc_${Date.now()}`,
      title: '',
      category: 'Work Experience',
      companyOrContext: 'SidLabs LLP',
      role: 'Full Stack Developer',
      technologies: [],
      summary: '',
      problemSolved: '',
      architectureOverview: '',
      keyAchievements: [],
      bulletPointsPool: [],
      fullMarkdown: '',
      updatedAt: new Date().toISOString()
    });
    setIsEditingDoc(true);
  };

  const handleEditDoc = (doc: ProjectDoc) => {
    setDocEditForm({ ...doc });
    setIsEditingDoc(true);
  };

  const handleSaveDocForm = () => {
    if (!docEditForm.title) return;
    const current = formData.projectDocs || [];
    const existingIdx = current.findIndex(d => d.id === docEditForm.id);
    let updatedDocs: ProjectDoc[];

    const newDoc: ProjectDoc = {
      id: docEditForm.id || `doc_${Date.now()}`,
      title: docEditForm.title || 'Untitled Project',
      category: docEditForm.category || 'Work Experience',
      companyOrContext: docEditForm.companyOrContext || 'SidLabs LLP',
      role: docEditForm.role || 'Full Stack Developer',
      technologies: Array.isArray(docEditForm.technologies) ? docEditForm.technologies : [],
      summary: docEditForm.summary || '',
      problemSolved: docEditForm.problemSolved || '',
      architectureOverview: docEditForm.architectureOverview || '',
      keyAchievements: docEditForm.keyAchievements || [],
      bulletPointsPool: docEditForm.bulletPointsPool || [],
      fullMarkdown: docEditForm.fullMarkdown || '',
      liveUrl: docEditForm.liveUrl,
      demoUrl: docEditForm.demoUrl,
      githubUrl: docEditForm.githubUrl,
      updatedAt: new Date().toISOString()
    };

    if (existingIdx >= 0) {
      updatedDocs = [...current];
      updatedDocs[existingIdx] = newDoc;
    } else {
      updatedDocs = [newDoc, ...current];
    }

    const updatedProfile = { ...formData, projectDocs: updatedDocs };
    setFormData(updatedProfile);
    onSaveProfile(updatedProfile);
    setIsEditingDoc(false);
    setDocEditForm({});
  };

  const handleDeleteDoc = (id: string) => {
    const updated = (formData.projectDocs || []).filter(d => d.id !== id);
    const updatedProfile = { ...formData, projectDocs: updated };
    setFormData(updatedProfile);
    onSaveProfile(updatedProfile);
    if (activeDocModal?.id === id) setActiveDocModal(null);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.15 }}
      className="space-y-6 pb-12"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-semibold text-white tracking-tight flex items-center gap-2">
            <FileText className="h-5 w-5 text-indigo-400" />
            <span>Master Resume & Tailoring Studio</span>
          </h1>
          <p className="text-xs text-slate-400">
            Powered by Project Documentation dossiers and single-page ATS LaTeX code generation.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setPromptModalTab('instructions');
              setShowPromptModal(true);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-emerald-300 text-xs font-medium border border-emerald-800/60 transition-all cursor-pointer shadow-sm active:scale-95"
            id="resume-manual-btn"
          >
            <BookOpen className="h-3.5 w-3.5 text-emerald-400" />
            <span>Instructions Manual</span>
          </button>

          <button
            onClick={() => {
              setPromptModalTab('docsPrompt');
              setShowPromptModal(true);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-purple-300 text-xs font-medium border border-purple-800/60 transition-all cursor-pointer shadow-sm active:scale-95"
            id="doc-prompt-btn"
          >
            <Terminal className="h-3.5 w-3.5 text-purple-400" />
            <span>Get Project Docs Prompt</span>
          </button>

          <button
            onClick={handleSave}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium shadow-sm transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
            id="resume-save-btn"
          >
            {saveSuccess ? <Check className="h-3.5 w-3.5 text-emerald-300" /> : <Save className="h-3.5 w-3.5" />}
            <span>{saveSuccess ? 'Saved' : 'Save Master Profile'}</span>
          </button>
        </div>
      </div>

      {/* Sub Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 text-xs">
        <button
          onClick={() => setActiveSubTab('projectDocs')}
          className={`pb-2.5 font-semibold px-3 border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
            activeSubTab === 'projectDocs'
              ? 'border-purple-500 text-purple-300'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <BookOpen className="h-3.5 w-3.5" />
          <span>Project Docs Hub ({projectDocs.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('profile')}
          className={`pb-2.5 font-semibold px-3 border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
            activeSubTab === 'profile'
              ? 'border-purple-500 text-purple-300'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <ShieldCheck className="h-3.5 w-3.5" />
          <span>Master Profile & Experience</span>
        </button>

        <button
          onClick={() => setActiveSubTab('skills')}
          className={`pb-2.5 font-semibold px-3 border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
            activeSubTab === 'skills'
              ? 'border-purple-500 text-purple-300'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Code className="h-3.5 w-3.5" />
          <span>Verified Skills ({formData.skills.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('tailoredList')}
          className={`pb-2.5 font-semibold px-3 border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
            activeSubTab === 'tailoredList'
              ? 'border-purple-500 text-purple-300'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <FileText className="h-3.5 w-3.5" />
          <span>Generated Resumes ({tailoredJobs.length})</span>
        </button>
      </div>

      {/* SUB-TAB 1: Project Docs Hub */}
      {activeSubTab === 'projectDocs' && (
        <div className="space-y-5">
          {/* Hero Banner */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-950/40 to-slate-900 border border-purple-800/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <Layers className="h-4 w-4 text-purple-400" />
                <span>Full-Fledged Project Dossiers for Resume Synthesis</span>
              </h2>
              <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">
                When you tailor a resume for any job posting, the AI reviews these comprehensive project docs to select matching modules, align technologies, and extract the strongest quantifiable bullet points into your LaTeX template.
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={handleOpenAddDoc}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-sm transition-all cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add Project Doc</span>
              </button>
            </div>
          </div>

          {/* Project Dossier Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {projectDocs.map((doc) => (
              <div
                key={doc.id}
                className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-purple-600/40 transition-all flex flex-col justify-between space-y-3.5 shadow-sm"
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300">
                      {doc.companyOrContext || doc.category}
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {doc.bulletPointsPool?.length || 0} bullets ready
                    </span>
                  </div>

                  <div>
                    <h3 className="font-bold text-white text-sm tracking-tight">{doc.title}</h3>
                    <p className="text-xs text-indigo-400 font-medium">{doc.role}</p>
                  </div>

                  <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                    {doc.summary || doc.problemSolved}
                  </p>

                  {/* Tech stack badges */}
                  <div className="flex flex-wrap gap-1 pt-1">
                    {doc.technologies.slice(0, 4).map((tech, idx) => (
                      <span key={idx} className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono border border-slate-700/60">
                        {tech}
                      </span>
                    ))}
                    {doc.technologies.length > 4 && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                        +{doc.technologies.length - 4}
                      </span>
                    )}
                  </div>
                </div>

                {/* Bottom Actions */}
                <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                  <button
                    onClick={() => setActiveDocModal(doc)}
                    className="flex items-center gap-1 text-xs text-purple-400 hover:text-purple-300 font-medium cursor-pointer"
                  >
                    <Eye className="h-3.5 w-3.5" />
                    <span>View Full Dossier</span>
                  </button>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleEditDoc(doc)}
                      className="p-1 rounded text-slate-400 hover:text-white cursor-pointer"
                      title="Edit Doc"
                    >
                      <Edit3 className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteDoc(doc.id)}
                      className="p-1 rounded text-slate-500 hover:text-red-400 cursor-pointer"
                      title="Delete Doc"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUB-TAB 2: Profile & Experience */}
      {activeSubTab === 'profile' && (
        <div className="space-y-6">
          <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4">
            <h3 className="font-bold text-sm text-white flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-emerald-400" />
              <span>Personal & Contact Info (Atul Kaple)</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="space-y-1">
                <label className="text-slate-400 font-medium">Full Name</label>
                <input
                  type="text"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  className="w-full p-2.5 bg-slate-850 border border-slate-700/80 rounded-lg text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-400 font-medium">Current Role Title</label>
                <input
                  type="text"
                  value={formData.currentRole}
                  onChange={(e) => setFormData({ ...formData, currentRole: e.target.value })}
                  className="w-full p-2.5 bg-slate-850 border border-slate-700/80 rounded-lg text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-400 font-medium">Email Address</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full p-2.5 bg-slate-850 border border-slate-700/80 rounded-lg text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-400 font-medium">Phone Number</label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full p-2.5 bg-slate-850 border border-slate-700/80 rounded-lg text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-400 font-medium">Location</label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="w-full p-2.5 bg-slate-850 border border-slate-700/80 rounded-lg text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-400 font-medium">Portfolio / Website</label>
                <input
                  type="text"
                  value={formData.portfolioUrl}
                  onChange={(e) => setFormData({ ...formData, portfolioUrl: e.target.value })}
                  className="w-full p-2.5 bg-slate-850 border border-slate-700/80 rounded-lg text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-400 font-medium">LinkedIn Profile</label>
                <input
                  type="text"
                  value={formData.linkedinUrl}
                  onChange={(e) => setFormData({ ...formData, linkedinUrl: e.target.value })}
                  className="w-full p-2.5 bg-slate-850 border border-slate-700/80 rounded-lg text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-400 font-medium">GitHub Profile</label>
                <input
                  type="text"
                  value={formData.githubUrl}
                  onChange={(e) => setFormData({ ...formData, githubUrl: e.target.value })}
                  className="w-full p-2.5 bg-slate-850 border border-slate-700/80 rounded-lg text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            {/* Master Summary */}
            <div className="space-y-1 pt-2">
              <label className="text-slate-400 font-medium text-xs">Professional Summary (Baseline for LaTeX generation)</label>
              <textarea
                rows={3}
                value={formData.summary}
                onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                className="w-full p-3 bg-slate-850 border border-slate-700/80 rounded-lg text-slate-200 text-xs focus:outline-none focus:border-indigo-500 leading-relaxed"
              />
            </div>
          </div>

          {/* Education */}
          <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4">
            <h3 className="font-bold text-sm text-white flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-indigo-400" />
              <span>Verified Education</span>
            </h3>

            <div className="space-y-3">
              {formData.education.map((edu) => (
                <div key={edu.id} className="p-3.5 rounded-xl bg-slate-850 border border-slate-700/60 text-xs space-y-1">
                  <div className="flex items-center justify-between font-bold text-white">
                    <span>{edu.institution}</span>
                    <span className="text-slate-400 font-normal">{edu.startYear} -- {edu.endYear}</span>
                  </div>
                  <p className="text-indigo-400">{edu.degree}, {edu.field} | {edu.grade}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Work Experience */}
          <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4">
            <h3 className="font-bold text-sm text-white flex items-center gap-2">
              <Briefcase className="h-4 w-4 text-purple-400" />
              <span>Verified Employment History</span>
            </h3>

            <div className="space-y-4">
              {formData.experience.map((exp) => (
                <div key={exp.id} className="p-4 rounded-xl bg-slate-850 border border-slate-700/60 space-y-2 text-xs">
                  <div className="flex items-center justify-between font-bold text-white">
                    <span>{exp.role} @ <span className="text-indigo-400">{exp.company}</span></span>
                    <span className="text-slate-400 font-normal">{exp.startDate} -- {exp.endDate}</span>
                  </div>
                  <p className="text-slate-400 text-[11px]">{exp.location} • {exp.employmentType}</p>
                  <ul className="list-disc pl-4 space-y-1 text-slate-300 text-[11px]">
                    {exp.responsibilities.map((r, i) => (
                      <li key={i}>{r}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 3: Verified Skills */}
      {activeSubTab === 'skills' && (
        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm text-white">Verified Skills Directory</h3>
              <p className="text-xs text-slate-400">Canonical skill pool mapped to your LaTeX Technical Skills section.</p>
            </div>
            <button
              onClick={handleAddSkill}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Add Skill</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {formData.skills.map((skill) => (
              <div
                key={skill.id}
                className="p-3 rounded-xl bg-slate-850 border border-slate-700/60 flex items-center justify-between text-xs"
              >
                <div>
                  <h4 className="font-bold text-white">{skill.name}</h4>
                  <p className="text-[11px] text-slate-400">{skill.category} • {skill.proficiency}</p>
                </div>

                <button
                  onClick={() => handleRemoveSkill(skill.id)}
                  className="p-1 text-slate-500 hover:text-red-400 cursor-pointer"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUB-TAB 4: Generated Tailored Resumes */}
      {activeSubTab === 'tailoredList' && (
        <div className="space-y-4">
          {tailoredJobs.length === 0 ? (
            <div className="p-12 text-center rounded-2xl bg-slate-900/40 border border-slate-800 space-y-3">
              <Sparkles className="h-10 w-10 text-slate-600 mx-auto" />
              <h3 className="text-sm font-semibold text-slate-300">No tailored resumes generated yet</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Select a shortlisted role in the Discovery or Dashboard view and click "Tailor Resume" to generate versioned ATS resumes with full LaTeX code.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {tailoredJobs.map((job) => {
                const tr = job.tailoredResume!;
                return (
                  <div
                    key={job.id}
                    onClick={() => onSelectJob(job)}
                    className="p-4 rounded-xl bg-slate-900/90 hover:bg-slate-850 border border-purple-900/40 hover:border-purple-500/50 transition-all cursor-pointer space-y-3 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="font-bold text-white text-sm">{job.company}</h4>
                        <p className="text-xs text-slate-400">{job.title}</p>
                      </div>
                      <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300">
                        {tr.atsMatchScore}% ATS Match
                      </span>
                    </div>

                    <p className="text-xs text-slate-300 line-clamp-2 italic">
                      "{tr.tailoredSummary}"
                    </p>

                    <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-800">
                      <span>Version: <strong className="font-mono text-purple-400">{tr.versionId}</strong></span>
                      <div className="flex items-center gap-2">
                        <a
                          href={apiUrl(`/api/resumes/download-tex/${tr.versionId}.tex`)}
                          download={`${tr.versionId}.tex`}
                          onClick={(e) => e.stopPropagation()}
                          className="flex items-center gap-1 px-2 py-0.5 rounded bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 font-medium transition-colors cursor-pointer"
                        >
                          <Download className="h-3 w-3" />
                          <span>.tex</span>
                        </a>

                        <a
                          href={apiUrl(`/api/resumes/download/${tr.versionId}.pdf`)}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="flex items-center gap-1 px-2 py-0.5 rounded bg-purple-600/30 hover:bg-purple-600/50 text-purple-300 font-medium transition-colors cursor-pointer"
                        >
                          <Download className="h-3 w-3" />
                          <span>PDF</span>
                        </a>

                        <span className="text-purple-400 font-semibold hover:underline">Inspect →</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* MODAL 1: Codebase Documentation Prompt */}
      <AnimatePresence>
        {showPromptModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-3xl max-h-[90vh] bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden"
            >
              <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-950/40">
                <div className="flex items-center gap-2">
                  {promptModalTab === 'instructions' ? (
                    <BookOpen className="h-5 w-5 text-emerald-400" />
                  ) : (
                    <Terminal className="h-5 w-5 text-purple-400" />
                  )}
                  <div>
                    <h3 className="font-bold text-white text-sm">
                      {promptModalTab === 'instructions'
                        ? 'ATS Resume Generation Instructions Manual'
                        : 'Project Codebase Documentation Prompt'}
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      {promptModalTab === 'instructions'
                        ? 'Step-by-step rules, banned words, keyword placement, and audit procedure for resume tailoring.'
                        : 'Run this prompt in your project codebase to extract the full documentation for resume creation.'}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setShowPromptModal(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Modal Sub-Tabs */}
              <div className="flex items-center gap-2 px-4 pt-2.5 border-b border-slate-800 bg-slate-950/20 text-xs">
                <button
                  onClick={() => setPromptModalTab('instructions')}
                  className={`pb-2 font-semibold border-b-2 transition-all flex items-center gap-1.5 cursor-pointer ${
                    promptModalTab === 'instructions'
                      ? 'border-emerald-500 text-emerald-300'
                      : 'border-transparent text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <BookOpen className="h-3.5 w-3.5" />
                  <span>Instructions Manual (Steps 1–7)</span>
                </button>
                <button
                  onClick={() => setPromptModalTab('docsPrompt')}
                  className={`pb-2 font-semibold border-b-2 transition-all flex items-center gap-1.5 cursor-pointer ${
                    promptModalTab === 'docsPrompt'
                      ? 'border-purple-500 text-purple-300'
                      : 'border-transparent text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Terminal className="h-3.5 w-3.5" />
                  <span>Codebase Dossier Prompt</span>
                </button>
              </div>

              <div className="p-4 space-y-3 overflow-y-auto flex-1 text-xs">
                {promptModalTab === 'instructions' ? (
                  <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-800/40 text-emerald-300 space-y-1">
                    <p className="font-semibold">How this manual is used:</p>
                    <p className="text-slate-300 text-[11px]">
                      These rules are fed directly to Gemini and the resume generator engine. They enforce exact keyword matching, banned word filters, metric validation, single-page ATS LaTeX constraints, and strict project anonymization.
                    </p>
                  </div>
                ) : (
                  <div className="p-3 rounded-xl bg-purple-950/30 border border-purple-800/40 text-purple-300 space-y-1">
                    <p className="font-semibold">How to use this prompt:</p>
                    <ol className="list-decimal pl-4 space-y-0.5 text-slate-300 text-[11px]">
                      <li>Open your project repository in Cursor, Claude Code, Gemini CLI, or ChatGPT.</li>
                      <li>Copy and paste this prompt into the assistant chat.</li>
                      <li>The AI will parse your codebase, files, architecture, and output the structured dossier.</li>
                      <li>Paste the generated dossier into the <strong>Project Docs Hub</strong> in this application!</li>
                    </ol>
                  </div>
                )}

                <div className="relative">
                  <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 font-mono text-[11px] whitespace-pre-wrap max-h-96 overflow-y-auto leading-relaxed select-all">
                    {promptModalTab === 'instructions' ? RESUME_INSTRUCTIONS_MANUAL : PROJECT_DOCUMENTATION_PROMPT}
                  </pre>
                </div>
              </div>

              <div className="p-4 border-t border-slate-800 bg-slate-950/40 flex items-center justify-between">
                <span className="text-[11px] text-slate-500">
                  {promptModalTab === 'instructions'
                    ? 'Enforces banned word checks, no duplicate verbs, and 1-page ATS LaTeX.'
                    : 'Includes LaTeX escaping instructions and ATS metric formula.'}
                </span>
                <button
                  onClick={handleCopyPrompt}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-white font-semibold text-xs transition-all shadow-md active:scale-95 cursor-pointer ${
                    promptModalTab === 'instructions'
                      ? 'bg-emerald-600 hover:bg-emerald-500'
                      : 'bg-purple-600 hover:bg-purple-500'
                  }`}
                >
                  {copiedPrompt ? <Check className="h-4 w-4 text-emerald-200" /> : <Copy className="h-4 w-4" />}
                  <span>{copiedPrompt ? 'Copied to Clipboard!' : 'Copy to Clipboard'}</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 2: View Project Dossier Details */}
      <AnimatePresence>
        {activeDocModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-3xl max-h-[90vh] bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden"
            >
              <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-950/40">
                <div>
                  <h3 className="font-bold text-white text-sm">{activeDocModal.title}</h3>
                  <p className="text-[11px] text-purple-400">{activeDocModal.role} • {activeDocModal.companyOrContext}</p>
                </div>

                <button
                  onClick={() => setActiveDocModal(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="p-5 space-y-4 overflow-y-auto flex-1 text-xs text-slate-300">
                {/* Tech Stack */}
                <div className="space-y-1">
                  <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Technologies Used</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {activeDocModal.technologies.map((t, i) => (
                      <span key={i} className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-200 font-mono text-[11px]">
                        {t}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Problem & Solution */}
                <div className="space-y-1">
                  <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Problem Solved</h4>
                  <p className="text-slate-300 leading-relaxed bg-slate-950 p-3 rounded-lg border border-slate-800">
                    {activeDocModal.problemSolved || activeDocModal.summary}
                  </p>
                </div>

                {/* Architecture Overview */}
                <div className="space-y-1">
                  <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Architecture Overview</h4>
                  <p className="text-slate-300 leading-relaxed bg-slate-950 p-3 rounded-lg border border-slate-800">
                    {activeDocModal.architectureOverview || 'Modular full stack implementation.'}
                  </p>
                </div>

                {/* Ready Bullet Points Pool */}
                <div className="space-y-1.5">
                  <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    ATS Resume Bullet Points Pool ({activeDocModal.bulletPointsPool?.length || 0})
                  </h4>
                  <div className="space-y-2">
                    {(activeDocModal.bulletPointsPool || []).map((bullet, idx) => (
                      <div key={idx} className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-[11px] text-slate-200 flex items-start gap-2">
                        <span className="text-purple-400 font-bold">•</span>
                        <span>{bullet}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Full Markdown */}
                {activeDocModal.fullMarkdown && (
                  <div className="space-y-1">
                    <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Full Technical Dossier Markdown</h4>
                    <pre className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 font-mono text-[11px] whitespace-pre-wrap max-h-60 overflow-y-auto leading-relaxed">
                      {activeDocModal.fullMarkdown}
                    </pre>
                  </div>
                )}
              </div>

              <div className="p-4 border-t border-slate-800 bg-slate-950/40 flex items-center justify-between">
                <button
                  onClick={() => {
                    handleEditDoc(activeDocModal);
                    setActiveDocModal(null);
                  }}
                  className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold cursor-pointer"
                >
                  Edit This Dossier
                </button>

                <button
                  onClick={() => setActiveDocModal(null)}
                  className="px-4 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold cursor-pointer"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 3: Add/Edit Project Dossier Form */}
      <AnimatePresence>
        {isEditingDoc && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-2xl max-h-[90vh] bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden"
            >
              <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-950/40">
                <h3 className="font-bold text-white text-sm">
                  {docEditForm.id ? 'Edit Project Documentation' : 'Add Project Documentation'}
                </h3>
                <button
                  onClick={() => setIsEditingDoc(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="p-5 space-y-4 overflow-y-auto flex-1 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-slate-400 font-medium">Project Name *</label>
                    <input
                      type="text"
                      value={docEditForm.title || ''}
                      onChange={(e) => setDocEditForm({ ...docEditForm, title: e.target.value })}
                      placeholder="e.g. Legal Case Automation"
                      className="w-full p-2 bg-slate-850 border border-slate-700 rounded-lg text-white"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-slate-400 font-medium">Context / Company</label>
                    <input
                      type="text"
                      value={docEditForm.companyOrContext || ''}
                      onChange={(e) => setDocEditForm({ ...docEditForm, companyOrContext: e.target.value })}
                      placeholder="e.g. SidLabs LLP or Personal Project"
                      className="w-full p-2 bg-slate-850 border border-slate-700 rounded-lg text-white"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-slate-400 font-medium">Role</label>
                    <input
                      type="text"
                      value={docEditForm.role || ''}
                      onChange={(e) => setDocEditForm({ ...docEditForm, role: e.target.value })}
                      placeholder="e.g. Full Stack Developer"
                      className="w-full p-2 bg-slate-850 border border-slate-700 rounded-lg text-white"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-slate-400 font-medium">Technologies (comma-separated)</label>
                    <input
                      type="text"
                      value={(docEditForm.technologies || []).join(', ')}
                      onChange={(e) => setDocEditForm({
                        ...docEditForm,
                        technologies: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                      })}
                      placeholder="Next.js, Node.js, Google Gemini, Tesseract.js"
                      className="w-full p-2 bg-slate-850 border border-slate-700 rounded-lg text-white"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-slate-400 font-medium">Problem Statement & Summary</label>
                  <textarea
                    rows={2}
                    value={docEditForm.problemSolved || docEditForm.summary || ''}
                    onChange={(e) => setDocEditForm({ ...docEditForm, problemSolved: e.target.value, summary: e.target.value })}
                    className="w-full p-2.5 bg-slate-850 border border-slate-700 rounded-lg text-white"
                    placeholder="Describe the engineering problem and what was delivered."
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-400 font-medium">ATS Bullet Points Pool (One per line)</label>
                  <textarea
                    rows={4}
                    value={(docEditForm.bulletPointsPool || []).join('\n')}
                    onChange={(e) => setDocEditForm({
                      ...docEditForm,
                      bulletPointsPool: e.target.value.split('\n').map(s => s.trim()).filter(Boolean)
                    })}
                    className="w-full p-2.5 bg-slate-850 border border-slate-700 rounded-lg text-white font-mono text-[11px]"
                    placeholder="Built a case evaluation flow on Google Gemini checking Swiss asylum admissibility...&#10;Wrote browser-side text extraction with Tesseract.js..."
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-400 font-medium">Full Dossier Markdown (Paste from AI Prompt Output)</label>
                  <textarea
                    rows={5}
                    value={docEditForm.fullMarkdown || ''}
                    onChange={(e) => setDocEditForm({ ...docEditForm, fullMarkdown: e.target.value })}
                    className="w-full p-2.5 bg-slate-850 border border-slate-700 rounded-lg text-white font-mono text-[11px]"
                    placeholder="Paste the complete generated markdown dossier here..."
                  />
                </div>
              </div>

              <div className="p-4 border-t border-slate-800 bg-slate-950/40 flex items-center justify-between">
                <button
                  onClick={() => setIsEditingDoc(false)}
                  className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  onClick={handleSaveDocForm}
                  className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold cursor-pointer shadow-md"
                >
                  Save to Project Docs
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
