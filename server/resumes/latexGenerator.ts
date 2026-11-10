import fs from 'fs';
import path from 'path';
import { UserProfile, Job, TailoredResume, ProjectDoc } from '../../src/types';

const STORAGE_RESUMES_DIR = path.join(process.cwd(), 'storage', 'resumes');

if (!fs.existsSync(STORAGE_RESUMES_DIR)) {
  fs.mkdirSync(STORAGE_RESUMES_DIR, { recursive: true });
}

/**
 * Safely escape LaTeX special characters while preserving intentional LaTeX commands/math
 */
export function escapeLatex(str: string): string {
  if (!str) return '';
  return str
    // Strip markdown bold / italic formatting so asterisks don't leak into LaTeX
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    // Sanitize any accidental proprietary names or legacy codenames
    .replace(/lexaid(\s*ai)?/gi, 'Legal Case Automation')
    .replace(/winsights\s*social/gi, 'Patient Community Network')
    .replace(/winsights\s*patienthub/gi, 'Healthcare Research Application')
    .replace(/winsights/gi, 'Healthcare Platform')
    .replace(/defence\+\s*(ai)?/gi, 'Environmental Monitoring Dashboard')
    .replace(/visionmap/gi, 'Collaborative Whiteboard Application')
    // Sanitize banned words as per resume instructions manual
    .replace(/\barchitected\b/gi, 'built')
    .replace(/\bengineered\b/gi, 'developed')
    .replace(/\bleveraged\b/gi, 'used')
    .replace(/\butilized\b/gi, 'applied')
    .replace(/\butilizing\b/gi, 'using')
    .replace(/\brobust\b/gi, 'reliable')
    .replace(/\bscalable\b/gi, 'high-throughput')
    .replace(/\bseamless\b/gi, 'direct')
    .replace(/\bend-to-end\b/gi, 'complete')
    .replace(/\bcutting-edge\b/gi, 'modern')
    .replace(/\bdynamic\b/gi, 'interactive')
    .replace(/\binnovative\b/gi, 'advanced')
    .replace(/\bpassionate\b/gi, 'dedicated')
    .replace(/\bresults-driven\b/gi, 'metrics-focused')
    .replace(/\bspearheaded\b/gi, 'led')
    .replace(/\bsynergy\b/gi, 'collaboration')
    .replace(/\bstate-of-the-art\b/gi, 'modern')
    .replace(/\bAI-powered\b/gi, 'AI-assisted')
    .replace(/\bpowerful\b/gi, 'effective')
    .replace(/\befficient\b/gi, 'fast')
    .replace(/\bstreamlined\b/gi, 'automated')
    .replace(/\bresponsible for\b/gi, 'tasked with')
    .replace(/\bworked on\b/gi, 'developed')
    .replace(/\bhelped with\b/gi, 'contributed to')
    // Preserve existing \$k < 5\$ or already escaped chars
    .replace(/(?<!\\)%/g, '\\%')
    .replace(/(?<!\\)&/g, '\\&')
    .replace(/(?<!\\)#/g, '\\#')
    .replace(/(?<!\\)_(?!\{)/g, '\\_');
}

/**
 * Generates compilable ATS LaTeX resume code strictly matching Atul's template
 */
export function generateLatexResumeCode(
  profile: UserProfile,
  job?: Job,
  tailored?: Partial<TailoredResume>
): string {
  const targetRole = job?.title || profile.currentRole || 'Full Stack Developer';
  const defaultSummary = 'Full Stack Developer with nearly 2 years of experience in React, Next.js, Node.js, TypeScript and MongoDB. Delivered LLM features (Google Gemini, OpenAI), vector search and real-time messaging for legal, healthcare, finance and environmental clients, hosted on AWS.';
  const summaryText = tailored?.tailoredSummary || defaultSummary;

  // Contact info
  const fullName = profile.fullName;
  const phone = profile.phone;
  const email = profile.email;
  const portfolioUrl = profile.portfolioUrl;
  const linkedinUrl = profile.linkedinUrl;
  const githubUrl = profile.githubUrl;
  const location = profile.location;

  // Skills formatting
  let skillsLines: string[] = [];
  if (tailored?.orderedSkills && tailored.orderedSkills.length > 0) {
    skillsLines = tailored.orderedSkills.map((cat, idx) => {
      const isLastTwo = idx >= tailored.orderedSkills!.length - 2;
      const vspace = isLastTwo ? '' : ' \\vspace{1pt}';
      return `      \\textbf{${escapeLatex(cat.category)}}{: ${escapeLatex(cat.skills.join(', '))}}${vspace} \\\\`;
    });
  } else if (profile.skills && profile.skills.length > 0) {
    const categoryOrder = [
      'Languages',
      'Frontend',
      'Backend',
      'Databases',
      'AI and LLM',
      'Cloud and Tools',
      'Data Viz & Geo',
      'Other Tools'
    ];
    const grouped: { [key: string]: string[] } = {};
    profile.skills.forEach(s => {
      let cat = s.category || 'Other Tools';
      if (cat === 'Database') cat = 'Databases';
      if (cat === 'DevOps') cat = 'Cloud and Tools';
      if (cat === 'Tools' && ['Google Gemini', 'OpenAI API', 'LangChain', 'Ollama', 'RAG', 'Vector Embeddings', 'OCR', 'NLP'].includes(s.name)) {
        cat = 'AI and LLM';
      }
      if (!grouped[cat]) grouped[cat] = [];
      if (!grouped[cat].includes(s.name)) grouped[cat].push(s.name);
    });

    const orderedCategories = [
      ...categoryOrder.filter(c => grouped[c]),
      ...Object.keys(grouped).filter(c => !categoryOrder.includes(c))
    ];

    skillsLines = orderedCategories.map((cat, idx) => {
      const isLastTwo = idx >= orderedCategories.length - 2;
      const vspace = isLastTwo ? '' : ' \\vspace{1pt}';
      return `      \\textbf{${escapeLatex(cat)}}{: ${escapeLatex(grouped[cat].join(', '))}}${vspace} \\\\`;
    });
  } else {
    // Default categories matching resume
    skillsLines = [
      '      \\textbf{Languages}{: JavaScript, TypeScript, Java, Python} \\vspace{1pt} \\\\',
      '      \\textbf{Frontend}{: React.js, Next.js, Vite, Redux, Zustand, Tailwind CSS, MUI, Framer Motion, GSAP} \\vspace{1pt} \\\\',
      '      \\textbf{Backend}{: Node.js, Express.js, REST APIs, JWT, Socket.io, Multer, node-cron} \\vspace{1pt} \\\\',
      '      \\textbf{Databases}{: MongoDB, Mongoose, Redis, MongoDB Atlas Vector Search} \\vspace{1pt} \\\\',
      '      \\textbf{AI and LLM}{: Google Gemini, OpenAI API, LangChain, Ollama, RAG, Vector Embeddings, OCR, NLP} \\vspace{1pt} \\\\',
      '      \\textbf{Cloud and Tools}{: AWS (Cognito, S3, CloudFront, Elastic Beanstalk, KMS), Docker, Electron, Git, GitHub} \\vspace{1pt} \\\\',
      '      \\textbf{Data Viz \\& Geo}{: Chart.js, Recharts, ApexCharts, ECharts, Leaflet, Turf.js} \\\\',
      '      \\textbf{Other Tools}{: ExcelJS, Docxtemplater, PapaParse, Cloudinary, SendGrid, Zod, React Hook Form} \\\\'
    ];
  }

  // Work experience subprojects matching template
  const expBullets = getExperienceProjectsLatex(profile, job, tailored);

  // Personal project
  const personalProjectLatex = getPersonalProjectLatex(profile, job, tailored);

  // Education
  const edu = profile.education[0] || {
    institution: 'Army Institute of Technology',
    degree: 'Bachelor of Engineering',
    field: 'Mechanical Engineering',
    startYear: 'June 2020',
    endYear: 'May 2024',
    grade: 'GPA: 8.0'
  };

  return `%-------------------------
% Resume in LaTeX
% Author : Atul Kaple
% One page, ATS-friendly, project names removed
%------------------------

\\documentclass[letterpaper,9pt]{extarticle}
\\usepackage{lmodern}
\\usepackage{latexsym}
\\usepackage{amsmath}
\\usepackage[margin=0.5in, top=0.45in, bottom=0.45in]{geometry}
\\usepackage{titlesec}
\\usepackage[usenames,dvipsnames]{color}
\\usepackage{enumitem}
\\usepackage[hidelinks]{hyperref}
\\usepackage[english]{babel}
\\usepackage{tabularx}

\\pagestyle{empty}
\\urlstyle{same}
\\raggedbottom
\\raggedright
\\setlength{\\tabcolsep}{0in}

% Keep PDF text machine readable for ATS parsers
\\ifdefined\\pdfgentounicode
  \\input{glyphtounicode}
  \\pdfgentounicode=1
\\fi

% Section headings
\\titleformat{\\section}{
  \\vspace{-6pt}\\scshape\\raggedright\\large\\bfseries
}{}{0em}{}[\\color{black}\\titlerule \\vspace{-2pt}]

%-------------------------
% Custom commands
\\newcommand{\\resumeItem}[1]{
  \\item\\small{
    {#1 \\vspace{2pt}}
  }
}

\\newcommand{\\resumeSubheading}[4]{
  \\vspace{-2pt}\\item
    \\begin{tabular*}{1.0\\textwidth}[t]{l@{\\extracolsep{\\fill}}r}
      \\textbf{#1} & \\textbf{\\small #2} \\\\
      \\textit{\\small#3} & \\textit{\\small #4} \\\\
    \\end{tabular*}\\vspace{-4pt}
}

\\newcommand{\\resumeProjectHeading}[2]{
    \\vspace{2pt}\\item
    \\begin{tabular*}{1.001\\textwidth}{l@{\\extracolsep{\\fill}}r}
      \\small#1 & \\textbf{\\small #2}\\\\
    \\end{tabular*}\\vspace{-4pt}
}

\\newcommand{\\resumeProjectLabel}[1]{\\vspace{4pt}\\noindent{\\small\\textbf{#1}}\\\\[-3pt]}

\\renewcommand\\labelitemi{$\\vcenter{\\hbox{\\tiny$\\bullet$}}$}

\\newcommand{\\resumeSubHeadingListStart}{\\begin{itemize}[leftmargin=0.0in, label={}]}
\\newcommand{\\resumeSubHeadingListEnd}{\\end{itemize}}
\\newcommand{\\resumeItemListStart}{\\begin{itemize}[itemsep=0pt, parsep=0pt, topsep=0pt, leftmargin=0.18in]}
\\newcommand{\\resumeItemListEnd}{\\end{itemize}\\vspace{-3pt}}

%-------------------------------------------
\\begin{document}

%----------HEADING----------
\\begin{center}    {\\Huge \\scshape Atul Kaple} \\\\ \\vspace{4pt}    \\small    +91 8669663539 \\ $|$ \\    \\href{mailto:kapleatul07@gmail.com}{\\underline{kapleatul07@gmail.com}} \\ $|$ \\    \\href{https://atulkaple.vercel.app/}{\\underline{Portfolio}} \\ $|$ \\    \\href{https://www.linkedin.com/in/atul-kaple-b91976227/}{\\underline{LinkedIn}} \\ $|$ \\    \\href{https://github.com/AtulKaple}{\\underline{GitHub}} \\ $|$ \\    Pune, Maharashtra, India\\end{center}

%-----------SUMMARY-----------
\\section{Professional Summary}
\\small{${escapeLatex(summaryText)}}

%-----------TECHNICAL SKILLS-------
\\section{Technical Skills}
 \\begin{itemize}[leftmargin=0.15in, label={}, topsep=0pt, itemsep=0pt]
    \\small{\\item{
${skillsLines.join('\n')}
    }}
 \\end{itemize}

%-----------EXPERIENCE-----------
\\section{Experience}
  \\resumeSubHeadingListStart

    \\resumeSubheading
      {SidLabs LLP}{Nov 2024 -- Present}
      {Full Stack Developer}{Delhi, India (Remote)}

${expBullets}

   

  \\resumeSubHeadingListEnd

%-----------PROJECTS-----------
\\section{Personal Project}
    \\resumeSubHeadingListStart
        \\vspace{-4pt}
${personalProjectLatex}
    \\resumeSubHeadingListEnd

%-----------EDUCATION-----------
\\section{Education}
  \\resumeSubHeadingListStart
    \\resumeSubheading
      {Army Institute of Technology}{June 2020 -- May 2024}
      {Bachelor of Engineering, Mechanical Engineering $\\vert$ GPA: 8.0}{Pune, Maharashtra}
  \\resumeSubHeadingListEnd

\\end{document}
`;
}

function getExperienceProjectsLatex(
  profile: UserProfile,
  job?: Job,
  tailored?: Partial<TailoredResume>
): string {
  // Full verified catalog of all 6 SidLabs projects with ATS-optimized metrics matching Atul's template
  const projectCatalog: { [key: string]: { label: string; bullets: string[] } } = {
    'Legal Case Automation': {
      label: 'Legal Case Automation (Next.js, Node.js, Google Gemini)',
      bullets: [
        'Built a case evaluation flow on Google Gemini that checks Swiss asylum admissibility and drafts structured UN Human Rights appeals (CAT, CEDAW) of 3,000+ words, cutting case turnaround by 50\\%.',
        'Wrote browser-side text extraction with Tesseract.js, pdfjs-dist and Mammoth that reads PDFs, scanned images and Word files without a server round trip, replacing manual evidence transcription.',
        'Generated court-ready .docx petitions from case data with Docxtemplater and PizZip, sorting evidence into standard annexes automatically.'
      ]
    },
    'Patient Community Network': {
      label: 'Patient Community Network (React, TypeScript, Node.js, Socket.io, Redis)',
      bullets: [
        'Developed a privacy-focused social network with polls, media uploads, mood tags, anonymous posting and a ranked feed; Redis caching and cursor pagination support 2,000 concurrent users.',
        'Indexed posts and comments for semantic search with Transformers.js and MongoDB Atlas Vector Search (RAG), returning summaries that link back to the original posts.',
        'Gave authors audience controls and applied HIPAA Safe Harbor rules to strip identifying details before posts reach clinical researchers.'
      ]
    },
    'Healthcare Research Application': {
      label: 'Healthcare Research Application (React, TypeScript, Node.js, AWS)',
      bullets: [
        'Created a five-role system (patient, caregiver, clinician, researcher, admin) with an HL7 FHIR R4 assessment module, MongoDB transactions, automatic scoring and S3 video streaming.',
        'Met HIPAA and GDPR requirements with tiered consent checks, separate MongoDB clusters for health and public data, AWS Cognito MFA and a SHA-256 hash-chained audit log.',
        'Wrote a de-identification job (AWS KMS decryption, HMAC-SHA256 pseudonyms, small-group suppression with $k < 5$) over 34+ datasets; synced Apple HealthKit data and scheduled medication reminders.'
      ]
    },
    'Environmental Monitoring Dashboard': {
      label: 'Environmental Monitoring Dashboard (Next.js, Leaflet, Node.js, MongoDB)',
      bullets: [
        'Compressed multi-GB environmental datasets into a 4.4MB JSON snapshot through schema encoding and truncation, an 80\\% size cut that brought dashboard load time under one second.',
        'Scheduled a node-cron job with Compromise NLP that reads 30+ RSS feeds every 15 minutes, matches 120+ threat keywords, geocodes 200+ Peruvian regions via Nominatim and removes duplicates in MongoDB.',
        'Drew Leaflet maps with Turf.js 20km buffers and point-in-polygon tests on protected reserves to flag nearby threats and rank the top 5 deforestation hotspots.'
      ]
    },
    'Financial Projection Tool': {
      label: 'Financial Projection Tool (React, Node.js, ExcelJS, MongoDB)',
      bullets: [
        'Designed a 14-step form flow that produces bank-format Credit Monitoring Arrangement (CMA) projections, loan amortization schedules and 14 annexures for Chartered Accountants.',
        'Coded an 8,000+ line ExcelJS module that places live formulas across 15+ linked worksheets, with a custom fix for \\#REF! errors when rows are inserted or removed.',
        'Issued expiring client links (Node.js crypto tokens, MongoDB TTL index, 72-hour limit) that need no login and refill the multi-step form from saved Zustand state.'
      ]
    },
    'Multi-Tenant Enterprise Platform': {
      label: 'Multi-Tenant Enterprise Platform (Next.js 15, TanStack Query, Socket.io, Razorpay, ExcelJS)',
      bullets: [
        'Assembled a multi-tenant management portal with Next.js 15, React 19, TypeScript and Node.js/Express, isolating dual-database connections to serve corporate clients with zero cross-tenant contamination.',
        'Slashed network payload sizes by 72\\% and achieved sub-10ms cached view paints by deploying offline-first TanStack React Query persistence with client-scoped localStorage caching and HTTP gzip compression.',
        'Cut redundant database roundtrips by 90\\% through background sync-status hashing, and dropped dashboard latency from 1,400ms to < 45ms (96\\% reduction) using in-memory TTL caching and compound indexes.'
      ]
    }
  };

  const projectKeys = Object.keys(projectCatalog);
  const selectedKeys: string[] = [];

  // 1. If AI specified selectedProjectTitles, map those to our verified catalog keys
  if (tailored?.selectedProjectTitles && tailored.selectedProjectTitles.length > 0) {
    for (const title of tailored.selectedProjectTitles) {
      const match = projectKeys.find(k =>
        k.toLowerCase() === title.toLowerCase() ||
        title.toLowerCase().includes(k.toLowerCase()) ||
        k.toLowerCase().includes(title.toLowerCase())
      );
      if (match && !selectedKeys.includes(match)) {
        selectedKeys.push(match);
      }
    }
  }

  // 2. Score remaining projects against job keywords
  const jobText = `${job?.title || ''} ${job?.description || ''} ${(job?.skills || []).join(' ')} ${(job?.requirements || []).join(' ')}`.toLowerCase();

  const remainingKeys = projectKeys.filter(k => !selectedKeys.includes(k));
  const scored = remainingKeys.map(key => {
    let score = 0;
    const cat = projectCatalog[key];
    const allText = `${key} ${cat.label} ${cat.bullets.join(' ')}`.toLowerCase();

    for (const skill of (job?.skills || [])) {
      if (allText.includes(skill.toLowerCase())) score += 3;
    }

    if (jobText.includes('gemini') || jobText.includes('ai') || jobText.includes('llm') || jobText.includes('legal') || jobText.includes('ocr')) {
      if (key.includes('Legal')) score += 6;
    }
    if (jobText.includes('socket') || jobText.includes('chat') || jobText.includes('redis') || jobText.includes('vector') || jobText.includes('social')) {
      if (key.includes('Patient')) score += 6;
    }
    if (jobText.includes('aws') || jobText.includes('health') || jobText.includes('fhir') || jobText.includes('security') || jobText.includes('hipaa')) {
      if (key.includes('Healthcare')) score += 6;
    }
    if (jobText.includes('geo') || jobText.includes('map') || jobText.includes('leaflet') || jobText.includes('nlp') || jobText.includes('gis')) {
      if (key.includes('Environmental')) score += 6;
    }
    if (jobText.includes('enterprise') || jobText.includes('saas') || jobText.includes('tenant') || jobText.includes('tanstack') || jobText.includes('query') || jobText.includes('payment') || jobText.includes('razorpay') || jobText.includes('ticket') || jobText.includes('b2b') || jobText.includes('crm') || jobText.includes('dnd')) {
      if (key.includes('Multi-Tenant')) score += 7;
    }
    if (jobText.includes('excel') || jobText.includes('finance') || jobText.includes('form') || jobText.includes('zustand') || jobText.includes('cma')) {
      if (key.includes('Financial')) score += 6;
    }

    return { key, score };
  });

  scored.sort((a, b) => b.score - a.score);

  for (const s of scored) {
    if (selectedKeys.length >= 5) break;
    selectedKeys.push(s.key);
  }

  // Fallback defaults in case fewer than 5
  const defaultKeys = [
    'Legal Case Automation',
    'Patient Community Network',
    'Healthcare Research Application',
    'Environmental Monitoring Dashboard',
    'Financial Projection Tool'
  ];
  for (const defKey of defaultKeys) {
    if (selectedKeys.length >= 5) break;
    if (!selectedKeys.includes(defKey)) {
      selectedKeys.push(defKey);
    }
  }

  const topKeys = selectedKeys.slice(0, 5);

  return topKeys.map(key => {
    const item = projectCatalog[key];
    const bulletsLatex = item.bullets.map(b => `      \\resumeItem{${b}}`).join('\n');
    return `    \\resumeProjectLabel{${item.label}}
    \\resumeItemListStart
${bulletsLatex}
    \\resumeItemListEnd`;
  }).join('\n\n');
}

function getPersonalProjectLatex(
  profile?: UserProfile,
  job?: Job,
  tailored?: Partial<TailoredResume>
): string {
  return `      \\resumeProjectHeading
          {\\textbf{Collaborative Whiteboard Application} (Next.js, TypeScript, Liveblocks) $\\vert$ \\href{https://vision-map-psi.vercel.app/}{\\underline{Live Link}}
          $\\vert$ \\href{https://drive.google.com/file/d/1ns4KWCwO-QIQ7Ji2xOfByeqClSMt-WEo/view?usp=sharing}{\\underline{Demo}}}{}
          \\vspace{-4pt}
          \\resumeItemListStart
            \\resumeItem{ Architected an infinite-canvas collaborative workspace supporting 16+ vector primitives, sticky notes and connector arrows using Next.js 14, React 18, TypeScript and Tailwind CSS.}
            \\resumeItem{ Implemented real-time CRDT synchronization via Liveblocks (LiveMap/LiveList) with 16ms throttling (60 FPS), powering conflict-free multi-user editing, ephemeral cursor chat, live reactions, and camera spotlight follow mode.}
            \\resumeItem{Engineered client-side optimizations and secure architecture, utilizing the Ramer-Douglas-Peucker (RDP) algorithm for stroke point reduction, and Clerk + Convex for multi-tenant RBAC with sub-100ms reactive database queries.}
          \\resumeItemListEnd`;
}

/**
 * Saves generated LaTeX file to storage/resumes/{versionId}.tex
 */
export function saveResumeLatexFile(versionId: string, latexCode: string): string {
  const fileName = `${versionId}.tex`;
  const filePath = path.join(STORAGE_RESUMES_DIR, fileName);
  fs.writeFileSync(filePath, latexCode, 'utf-8');
  return filePath;
}
