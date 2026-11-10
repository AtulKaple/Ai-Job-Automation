import { UserProfile, AppSettings, ProjectDoc } from '../types';

export const defaultProjectDocs: ProjectDoc[] = [
  {
    id: 'doc_legal_case_automation',
    title: 'Legal Case Automation',
    category: 'Work Experience',
    companyOrContext: 'SidLabs LLP',
    role: 'Full Stack Developer',
    technologies: ['Next.js', 'Node.js', 'Google Gemini', 'Tesseract.js', 'pdfjs-dist', 'Mammoth', 'Docxtemplater', 'PizZip'],
    summary: 'AI-assisted legal petition preparation and document generation system evaluating Swiss asylum admissibility and generating structured UN human rights appeals.',
    problemSolved: 'Human rights lawyers faced multi-week turnaround times transcribing evidence manually and drafting 3,000+ word appeals to UN treaty bodies (CAT, CEDAW) with stringent format requirements.',
    architectureOverview: 'Client-side zero-server OCR engine using Tesseract.js and Mammoth for privacy-preserving browser extraction of PDFs, images, and Word files. Prompt-engineered Google Gemini pipeline with grounding checks. Headless docx generator using Docxtemplater with XML-level schema validations.',
    keyAchievements: [
      'Built a case evaluation flow on Google Gemini checking Swiss asylum admissibility and drafting UN Human Rights appeals (3,000+ words)',
      'Cut end-to-end case turnaround by 50% through automated evidence parsing and template generation',
      'Engineered client-side OCR and extraction with Tesseract.js, pdfjs-dist and Mammoth eliminating server transit of sensitive case files',
      'Generated court-ready .docx petitions from case data with Docxtemplater and PizZip, automatically sorting evidence into standard annexes'
    ],
    bulletPointsPool: [
      'Built a case evaluation flow on Google Gemini that checks Swiss asylum admissibility and drafts structured UN Human Rights appeals (CAT, CEDAW) of 3,000+ words, cutting case turnaround by 50%.',
      'Wrote browser-side text extraction with Tesseract.js, pdfjs-dist and Mammoth that reads PDFs, scanned images and Word files without a server round trip, replacing manual evidence transcription.',
      'Generated court-ready .docx petitions from case data with Docxtemplater and PizZip, sorting evidence into standard annexes automatically.',
      'Designed structured prompt workflows with strict temperature controls and deterministic legal grounding constraints to prevent LLM hallucination in evidentiary citations.'
    ],
    fullMarkdown: `# Legal Case Automation - Technical Documentation
## Context
- **Organization**: SidLabs LLP (Nov 2024 - Present)
- **Role**: Full Stack Developer
- **Tech Stack**: Next.js, Node.js, Google Gemini, Tesseract.js, pdfjs-dist, Mammoth, Docxtemplater, PizZip

## Problem Statement
Human rights attorneys preparing asylum admissibility appeals for UN bodies (Convention Against Torture [CAT], Committee on the Elimination of Discrimination against Women [CEDAW]) had to process hundreds of pages of unindexed physical and scanned exhibits. Manual transcriptions and legal petition writing required 15-20 days per case.

## Architecture & Implementation
1. **Zero-Roundtrip Browser Extraction**:
   - Implemented client-side text and OCR pipeline using Web Workers with Tesseract.js and pdfjs-dist.
   - Preserved evidentiary confidentiality by ensuring raw identity documents never leave the user's browser unencrypted.
2. **LLM Legal Reasoning Engine**:
   - Integrated Google Gemini via structured schema prompts to evaluate Swiss asylum admissibility criteria.
   - Produced 3,000+ word structured appeal drafts with factual grounding cross-referenced to annexed evidence.
3. **Court-Ready Document Generation**:
   - Engineered automated .docx generator utilizing Docxtemplater and PizZip.
   - Formatted petitions to strict judicial guidelines with dynamic table of contents, paginated annexes, and digital exhibit stamps.

## Impact & Key Metrics
- **50% reduction** in appeal turnaround time (from 14+ days down to under 7 days).
- **100% client-side privacy** for initial evidence scanning and transcription.
- **Over 3,000 words** of structured, citation-accurate legal draft synthesized per petition.`,
    updatedAt: new Date().toISOString()
  },
  {
    id: 'doc_patient_community_network',
    title: 'Patient Community Network',
    category: 'Work Experience',
    companyOrContext: 'SidLabs LLP',
    role: 'Full Stack Developer',
    technologies: ['React', 'TypeScript', 'Node.js', 'Socket.io', 'Redis', 'MongoDB Atlas Vector Search', 'Transformers.js', 'RAG'],
    summary: 'HIPAA-compliant patient social network featuring semantic vector search, real-time messaging, anonymous peer support, and clinical de-identification.',
    problemSolved: 'Chronic illness patients needed safe peer communication with strict privacy safeguards, while clinical researchers required sanitized, searchable insights without violating health data regulations.',
    architectureOverview: 'Real-time WebSocket event bus managed via Socket.io with Redis Pub/Sub cluster. MongoDB Atlas Vector Search combined with client/server Transformers.js embeddings for Retrieval-Augmented Generation (RAG). Tiered cursor pagination and HIPAA Safe Harbor automated redaction pipeline.',
    keyAchievements: [
      'Developed a privacy-focused social network with polls, media uploads, mood tags, anonymous posting and a ranked feed',
      'Supported 2,000 concurrent users via Redis caching, pub/sub channels and sub-50ms cursor-based pagination',
      'Indexed posts and comments for semantic search with Transformers.js and MongoDB Atlas Vector Search (RAG), returning summaries that link back to source posts',
      'Implemented author audience controls and HIPAA Safe Harbor rule engines to strip 18 direct identifiers before data reaches clinical researchers'
    ],
    bulletPointsPool: [
      'Developed a privacy-focused social network with polls, media uploads, mood tags, anonymous posting and a ranked feed; Redis caching and cursor pagination support 2,000 concurrent users.',
      'Indexed posts and comments for semantic search with Transformers.js and MongoDB Atlas Vector Search (RAG), returning summaries that link back to the original posts.',
      'Gave authors audience controls and applied HIPAA Safe Harbor rules to strip identifying details before posts reach clinical researchers.',
      'Engineered real-time notification dispatch and presence channels using Socket.io with Redis adapter for distributed state consistency.'
    ],
    fullMarkdown: `# Patient Community Network - Technical Documentation
## Context
- **Organization**: SidLabs LLP
- **Role**: Full Stack Developer
- **Tech Stack**: React, TypeScript, Node.js, Socket.io, Redis, MongoDB Atlas Vector Search, Transformers.js

## Problem Statement
Patients living with specialized health conditions require moderated peer networks to share symptom experiences, but standard social platforms compromise medical anonymity. Meanwhile, researchers require structured cohort insights without breaching patient confidentiality.

## Technical Architecture
1. **High-Concurrency Feed & Messaging**:
   - React + TypeScript SPA utilizing cursor-based pagination and optimistic cache mutations.
   - Redis sorted sets for ranking dynamic community feeds by engagement and recency.
   - Socket.io for low-latency direct messaging and ephemeral reactions supporting 2,000 active users.
2. **Semantic Search & RAG**:
   - Vectorized discussion threads using Transformers.js embeddings stored directly in MongoDB Atlas Vector Search.
   - Built semantic retrieval with similarity scoring, surfacing relevant medical discussions with contextual citations.
3. **De-identification & Compliance**:
   - Automatic scrubbing of 18 HIPAA Safe Harbor identifiers (names, dates, zip codes, MRNs).
   - Author-level audience controls ensuring posts can be toggled between private patient-only cohorts and anonymized research feeds.`,
    updatedAt: new Date().toISOString()
  },
  {
    id: 'doc_healthcare_research_app',
    title: 'Healthcare Research Application',
    category: 'Work Experience',
    companyOrContext: 'SidLabs LLP',
    role: 'Full Stack Developer',
    technologies: ['React', 'TypeScript', 'Node.js', 'AWS', 'AWS Cognito', 'AWS KMS', 'S3', 'HL7 FHIR R4', 'MongoDB'],
    summary: 'Clinical trial and patient assessment platform compliant with HIPAA and GDPR, supporting HL7 FHIR R4 standard assessments and encrypted biometric synchronization.',
    problemSolved: 'Decentralized clinical trials lacked uniform assessment protocols and secure multi-role access (patients, caregivers, clinicians, researchers, admins) across disparate hospital datasets.',
    architectureOverview: 'Five-tier Role-Based Access Control (RBAC) backed by AWS Cognito MFA. Separate MongoDB clusters for PHI and de-identified study data. Microservice for cryptographic pseudonymization using AWS KMS and HMAC-SHA256 with k-anonymity validation (k < 5 suppression).',
    keyAchievements: [
      'Created a five-role system (patient, caregiver, clinician, researcher, admin) with an HL7 FHIR R4 assessment module, MongoDB transactions, automatic scoring and S3 video streaming',
      'Met HIPAA and GDPR requirements with tiered consent checks, separate MongoDB clusters for health and public data, AWS Cognito MFA and a SHA-256 hash-chained audit log',
      'Wrote a de-identification job (AWS KMS decryption, HMAC-SHA256 pseudonyms, small-group suppression with k < 5) over 34+ datasets; synced Apple HealthKit data and scheduled medication reminders'
    ],
    bulletPointsPool: [
      'Created a five-role system (patient, caregiver, clinician, researcher, admin) with an HL7 FHIR R4 assessment module, MongoDB transactions, automatic scoring and S3 video streaming.',
      'Met HIPAA and GDPR requirements with tiered consent checks, separate MongoDB clusters for health and public data, AWS Cognito MFA and a SHA-256 hash-chained audit log.',
      'Wrote a de-identification job (AWS KMS decryption, HMAC-SHA256 pseudonyms, small-group suppression with $k < 5$) over 34+ datasets; synced Apple HealthKit data and scheduled medication reminders.',
      'Integrated Apple HealthKit biometric ingestion and node-cron medication compliance dispatchers with S3 presigned video streaming for physical therapy validation.'
    ],
    fullMarkdown: `# Healthcare Research Application - Technical Documentation
## Context
- **Organization**: SidLabs LLP
- **Role**: Full Stack Developer
- **Tech Stack**: React, TypeScript, Node.js, AWS (Cognito, KMS, S3, CloudFront), MongoDB, HL7 FHIR R4

## Key Highlights
- Standardized questionnaires and clinical scorecards using HL7 FHIR Questionnaires and Observation models.
- Immutable audit trail: SHA-256 hash chain recording every access event, modification, and consent grant.
- Data privacy: De-identification engine masking 34+ clinical datasets, enforcing strict $k$-anonymity suppression ($k < 5$).`,
    updatedAt: new Date().toISOString()
  },
  {
    id: 'doc_environmental_monitoring',
    title: 'Environmental Monitoring Dashboard',
    category: 'Work Experience',
    companyOrContext: 'SidLabs LLP',
    role: 'Full Stack Developer',
    technologies: ['Next.js', 'Leaflet', 'Turf.js', 'Node.js', 'MongoDB', 'Compromise NLP', 'Nominatim'],
    summary: 'High-performance geospatial analytics dashboard detecting and geospatial-mapping environmental deforestation and ecological threats from streaming RSS feeds.',
    problemSolved: 'Geospatial field analysts were overwhelmed by hundreds of uncoordinated environmental bulletins and massive raw geographic datasets that took tens of seconds to render in GIS browsers.',
    architectureOverview: 'Next.js frontend with Leaflet and Turf.js running client-side spatial buffering and point-in-polygon algorithms. Automated node-cron backend harvesting 30+ RSS feeds every 15 minutes, powered by Compromise NLP entity extraction and Nominatim geocoding.',
    keyAchievements: [
      'Compressed multi-GB environmental datasets into a 4.4MB JSON snapshot through schema encoding and coordinate truncation, an 80% size cut that brought dashboard load time under one second',
      'Scheduled a node-cron job with Compromise NLP that reads 30+ RSS feeds every 15 minutes, matches 120+ threat keywords, geocodes 200+ Peruvian regions via Nominatim and removes duplicates in MongoDB',
      'Drew Leaflet maps with Turf.js 20km buffers and point-in-polygon tests on protected reserves to flag nearby threats and rank the top 5 deforestation hotspots'
    ],
    bulletPointsPool: [
      'Compressed multi-GB environmental datasets into a 4.4MB JSON snapshot through schema encoding and truncation, an 80% size cut that brought dashboard load time under one second.',
      'Scheduled a node-cron job with Compromise NLP that reads 30+ RSS feeds every 15 minutes, matches 120+ threat keywords, geocodes 200+ Peruvian regions via Nominatim and removes duplicates in MongoDB.',
      'Drew Leaflet maps with Turf.js 20km buffers and point-in-polygon tests on protected reserves to flag nearby threats and rank the top 5 deforestation hotspots.',
      'Engineered responsive Choropleth layers and geospatial clustering handling 10,000+ vector coordinates with zero frame drops on mobile viewports.'
    ],
    fullMarkdown: `# Environmental Monitoring Dashboard - Technical Documentation
## Context
- **Organization**: SidLabs LLP
- **Role**: Full Stack Developer
- **Tech Stack**: Next.js, Leaflet, Turf.js, Node.js, MongoDB, Compromise NLP, Nominatim

## Technical Innovations
1. **80% GeoJSON Compression**:
   - Flattened coordinate precision and normalized property schemas into an optimized 4.4MB binary snapshot from multi-gigabyte sources.
   - Brought initial dashboard render time down from 8.2s to sub-1s.
2. **Automated NLP Threat Extraction**:
   - 15-minute cron pipeline parsing 30+ streaming feeds.
   - Threat keyword taxonomy (120+ keywords) matched against Peruvian regions with automated Nominatim resolution.
3. **Turf.js Geospatial Buffers**:
   - 20km buffer zones computed in the browser around national parks and indigenous reserves to alert on encroachments.`,
    updatedAt: new Date().toISOString()
  },
  {
    id: 'doc_financial_projection_tool',
    title: 'Financial Projection Tool',
    category: 'Work Experience',
    companyOrContext: 'SidLabs LLP',
    role: 'Full Stack Developer',
    technologies: ['React', 'Node.js', 'ExcelJS', 'MongoDB', 'Zustand', 'TypeScript'],
    summary: 'Comprehensive 14-step financial modeler and automated Excel workbook generator for Chartered Accountants preparing banking CMA reports.',
    problemSolved: 'Chartered accountants and financial consultants spent 10-15 hours per client manually linking Excel formulas and balancing CMA projections across multi-sheet workbooks.',
    architectureOverview: '14-step reactive wizard driven by Zustand state synchronization. Expiring headless client links generated via Node.js crypto tokens and MongoDB TTL indices. Robust 8,000+ line ExcelJS calculation engine generating dynamic multi-sheet workbooks with cross-sheet formula dependencies.',
    keyAchievements: [
      'Designed a 14-step form flow that produces bank-format Credit Monitoring Arrangement (CMA) projections, loan amortization schedules and 14 annexures for Chartered Accountants',
      'Coded an 8,000+ line ExcelJS module that places live formulas across 15+ linked worksheets, with a custom fix for #REF! errors when rows are inserted or removed',
      'Issued expiring client links (Node.js crypto tokens, MongoDB TTL index, 72-hour limit) that need no login and refill the multi-step form from saved Zustand state'
    ],
    bulletPointsPool: [
      'Designed a 14-step form flow that produces bank-format Credit Monitoring Arrangement (CMA) projections, loan amortization schedules and 14 annexures for Chartered Accountants.',
      'Coded an 8,000+ line ExcelJS module that places live formulas across 15+ linked worksheets, with a custom fix for #REF! errors when rows are inserted or removed.',
      'Issued expiring client links (Node.js crypto tokens, MongoDB TTL index, 72-hour limit) that need no login and refill the multi-step form from saved Zustand state.',
      'Implemented automated balance sheet balancing validations and cash flow reconciliation across all 14 statutory banking annexures.'
    ],
    fullMarkdown: `# Financial Projection Tool - Technical Documentation
## Context
- **Organization**: SidLabs LLP
- **Role**: Full Stack Developer
- **Tech Stack**: React, Node.js, ExcelJS, MongoDB, Zustand, TypeScript

## Key Capabilities
- 14-Step complex financial wizard with form validation via Zod and state persistence in Zustand.
- 8,000+ line ExcelJS engine writing live dynamic formulas across 15 linked sheets.
- Resolves tricky cross-sheet formula shifting, preventing #REF! errors.
- Secure, tokenized 72-hour access links without requiring client authentication.`,
    updatedAt: new Date().toISOString()
  },
  {
    id: 'doc_multi_tenant_enterprise',
    title: 'Multi-Tenant Enterprise Platform',
    category: 'Work Experience',
    companyOrContext: 'SidLabs LLP',
    role: 'Lead Full Stack Engineer',
    technologies: [
      'Next.js 15',
      'React 19',
      'TypeScript',
      'TanStack React Query',
      'Node.js',
      'Express.js',
      'MongoDB',
      'Socket.io',
      'Tailwind CSS',
      'ExcelJS',
      'PDFKit',
      'Razorpay',
      'Firebase Admin (FCM)',
      'Slack Web API',
      '@dnd-kit',
      'Speakeasy TOTP'
    ],
    summary: 'High-performance multi-tenant B2B platform with offline-first state persistence, real-time developer telemetry, self-healing database queries, and multi-format enterprise exports.',
    problemSolved: 'Siloed tooling across onboarding, ticketing, task tracking, and billing triggered 404 milestone creation failures, client-side network bloat, cross-tenant cache contamination, and lack of compliance audit trails.',
    architectureOverview: 'Next.js 15 App Router paired with a modular dual-database Node.js/Express backend. Offline-first client-scoped TanStack React Query persistence with version-hashed background sync. Dual-write atomic upserts and multi-variant query resolution. Enterprise data center with RFC 4180 CSV, stylized ExcelJS workbooks, PDFKit briefs, and GeoIP audit logging.',
    keyAchievements: [
      'Architected an enterprise-grade multi-tenant platform with Next.js 15, React 19, and Node.js/Express, orchestrating isolated dual-database connections to eliminate cross-tenant contamination',
      'Slashed network payload sizes by 72% and achieved sub-10ms cached view paints by deploying offline-first TanStack React Query persistence with client-scoped localStorage caching and HTTP gzip compression',
      'Cut redundant database roundtrips by 90% through background sync-status hashing, and dropped dashboard latency from 1,400ms to < 45ms (96% drop) using in-memory TTL caching and compound indexes',
      'Eliminated cross-module data mismatches and 404 errors by deploying atomic dual-write upserts and self-healing query engines, cutting milestone failure rate from 12% to 0%',
      'Developed an enterprise Data Center supporting multi-format exports (RFC 4180 CSV, stylized ExcelJS, PDFKit) paired with an asynchronous GeoIP service for 100% audit compliance',
      'Constructed a real-time collaboration engine with Socket.io 4.8 managing developer telemetry, live typing indicators, and multi-channel push fan-out across FCM and Slack'
    ],
    bulletPointsPool: [
      'Architected an enterprise-grade multi-tenant platform using Next.js 15, React 19, TypeScript, and Node.js/Express, orchestrating isolated dual-database connections to serve corporate clients and engineering teams with zero cross-tenant contamination.',
      'Optimized client-side rendering and network transfer by implementing offline-first TanStack React Query persistence with client-scoped localStorage caching and global HTTP gzip compression, slashing payload sizes by 72% and achieving sub-10ms cached paints.',
      'Designed a lightweight background sync-status hashing mechanism (GET /client/sync-status) with 10-second polling intervals, cutting redundant database roundtrips and refetch overhead by over 90%.',
      'Eliminated cross-module data mismatches and 404 milestone errors by deploying atomic dual-write upserts and a self-healing multi-variant query engine, reducing milestone creation failure rates from 12% to 0%.',
      'Built a high-performance analytics tier utilizing in-memory TTL metrics caching and lean MongoDB projections, dropping client dashboard calculation latencies from ~1,400ms to < 45ms (a 96% latency reduction).',
      'Developed an enterprise Data Center supporting multi-format exports (RFC 4180 CSV, stylized ExcelJS spreadsheets, and PDFKit documents), integrated with an asynchronous GeoIP network resolution service logging identities, IPs, and physical locations for 100% audit compliance.',
      'Constructed a real-time collaboration and presence tracking engine with Socket.io 4.8, managing developer activity telemetry (heartbeat, mouse/keyboard activity), live ticket typing indicators, and multi-channel push fan-out across Firebase Admin and Slack.',
      'Instituted enterprise-grade security protocols, including Speakeasy TOTP 2-Factor Authentication, Passport.js OAuth 2.0 (Google & GitHub), bcrypt password hashing, and role-based employee sub-account delegation with end-to-end activity audit logging.',
      'Crafted interactive Kanban and Gantt project management interfaces using @dnd-kit (Core & Sortable) and Tailwind CSS v4, supporting dynamic drag-and-drop reordering, multi-application timeline aggregation, and URL state synchronization.',
      'Engineered a B2B invoicing and financial transaction pipeline with Razorpay payment gateway integration, automated server-side PDF invoice compilation (PDFKit), and Nodemailer SMTP relay, streamlining enterprise billing operations.'
    ],
    fullMarkdown: `# Multi-Tenant Enterprise Platform - Technical Documentation
## Context
- **Organization**: SidLabs LLP
- **Role**: Lead Full Stack Engineer
- **Tech Stack**: Next.js 15, React 19, TypeScript, TanStack Query, Node.js, Express, MongoDB, Socket.io, Tailwind CSS, ExcelJS, PDFKit, Razorpay

## Core Engineering Innovations
1. **Dual-Database Architecture**:
   - Connection-scoped model binding preventing connection leaks or cross-tenant contamination.
2. **Offline-First Data Layer**:
   - Client-scoped TanStack React Query persistence with 72% network payload compression and sub-10ms cached paints.
3. **Resilient Self-Healing Engine**:
   - Dual-write upserts and multi-variant lookup resolving 404 milestone errors from 12% to 0%.
4. **Enterprise Data Center & GeoIP Audit**:
   - RFC 4180 CSV, stylized ExcelJS workbooks, and PDFKit reports backed by asynchronous GeoIP audit resolution.`,
    updatedAt: new Date().toISOString()
  },
  {
    id: 'doc_collaborative_whiteboard',
    title: 'Collaborative Whiteboard Application',
    category: 'Personal Project',
    companyOrContext: 'Personal Project',
    role: 'Full Stack Creator & Architect',
    technologies: ['Next.js 14', 'React 18', 'TypeScript', 'Liveblocks', 'Tailwind CSS', 'Clerk', 'Convex', 'Ramer-Douglas-Peucker (RDP)'],
    summary: 'Infinite-canvas real-time collaborative workspace supporting 16+ vector primitives, sticky notes, connectors, ephemeral cursor chat, and 60 FPS CRDT state synchronization.',
    problemSolved: 'Remote teams needed a silky smooth, conflict-free visual collaboration canvas with instant synchronization, low memory footprint, and reactive state persistence.',
    architectureOverview: 'Next.js 14 App Router with React 18 and Tailwind CSS. Liveblocks CRDT structures (LiveMap, LiveList) throttled at 16ms (60 FPS) for buttery smooth cursor broadcasting and element transforms. Clerk authentication paired with Convex reactive backend database. Custom path smoothing using Ramer-Douglas-Peucker (RDP) algorithm.',
    keyAchievements: [
      'Architected an infinite-canvas collaborative workspace supporting 16+ vector primitives, sticky notes and connector arrows using Next.js 14, React 18, TypeScript and Tailwind CSS',
      'Implemented real-time CRDT synchronization via Liveblocks (LiveMap/LiveList) with 16ms throttling (60 FPS), powering conflict-free multi-user editing, ephemeral cursor chat, live reactions, and camera spotlight follow mode',
      'Engineered client-side optimizations and secure architecture, utilizing the Ramer-Douglas-Peucker (RDP) algorithm for stroke point reduction, and Clerk + Convex for multi-tenant RBAC with sub-100ms reactive database queries'
    ],
    bulletPointsPool: [
      'Architected an infinite-canvas collaborative workspace supporting 16+ vector primitives, sticky notes and connector arrows using Next.js 14, React 18, TypeScript and Tailwind CSS.',
      'Implemented real-time CRDT synchronization via Liveblocks (LiveMap/LiveList) with 16ms throttling (60 FPS), powering conflict-free multi-user editing, ephemeral cursor chat, live reactions, and camera spotlight follow mode.',
      'Engineered client-side optimizations and secure architecture, utilizing the Ramer-Douglas-Peucker (RDP) algorithm for stroke point reduction, and Clerk + Convex for multi-tenant RBAC with sub-100ms reactive database queries.',
      'Built multi-canvas camera zoom/pan transformations with spatial bounding box culling to maintain 60 FPS even with 1,000+ active vector nodes.'
    ],
    fullMarkdown: `# Collaborative Whiteboard Application - Technical Documentation
## Context
- **Type**: Personal Engineering Project
- **Live Link**: https://vision-map-psi.vercel.app/
- **Video Demo**: https://drive.google.com/file/d/1ns4KWCwO-QIQ7Ji2xOfByeqClSMt-WEo/view?usp=sharing
- **Tech Stack**: Next.js 14, React 18, TypeScript, Liveblocks, Tailwind CSS, Clerk, Convex

## Core Engineering Innovations
1. **CRDT Real-Time Sync**:
   - Leveraged Liveblocks LiveMap and LiveList primitives for conflict-free concurrent editing.
   - 16ms animation frame throttling providing 60 FPS cursor chat, live emojis, and collaborator spotlighting.
2. **Path Compression via RDP Algorithm**:
   - Freehand pen strokes are compressed using the Ramer-Douglas-Peucker (RDP) algorithm, reducing raw coordinate points by over 70% without perceptual quality loss.
3. **Reactive Backend with Clerk + Convex**:
   - RBAC organization scoping, board permissions, and sub-100ms reactive subscriptions.`,
    liveUrl: 'https://vision-map-psi.vercel.app/',
    demoUrl: 'https://drive.google.com/file/d/1ns4KWCwO-QIQ7Ji2xOfByeqClSMt-WEo/view?usp=sharing',
    githubUrl: 'https://github.com/AtulKaple',
    updatedAt: new Date().toISOString()
  }
];

export const defaultUserProfile: UserProfile = {
  id: 'usr_atul_kaple',
  fullName: 'Atul Kaple',
  email: 'kapleatul07@gmail.com',
  phone: '+91 8669663539',
  location: 'Pune, Maharashtra, India',
  linkedinUrl: 'https://www.linkedin.com/in/atul-kaple-b91976227/',
  githubUrl: 'https://github.com/AtulKaple',
  portfolioUrl: 'https://atulkaple.vercel.app/',
  currentRole: 'Full Stack Developer',
  yearsOfExperience: 2,
  summary: 'Full Stack Developer with nearly 2 years of experience in React, Next.js, Node.js, TypeScript and MongoDB. Delivered LLM features (Google Gemini, OpenAI), vector search and real-time messaging for legal, healthcare, finance and environmental clients, hosted on AWS.',
  targetRoles: [
    'Full Stack Developer',
    'Frontend Developer',
    'Frontend Engineer',
    'React Developer',
    'Next.js Developer',
    'Software Development Engineer (SDE)'
  ],
  preferredLocations: ['Pune', 'Bangalore', 'Mumbai', 'Hyderabad', 'Delhi NCR', 'Remote'],
  remotePreference: 'Any',
  minimumSalary: 8, // LPA
  preferredSalary: 14,
  noticePeriod: 'Immediate / 15 Days',
  workAuthorization: 'Authorized to work in India (Citizen)',
  requiresSponsorship: false,
  education: [
    {
      id: 'edu_ait_pune',
      institution: 'Army Institute of Technology',
      degree: 'Bachelor of Engineering',
      field: 'Mechanical Engineering',
      startYear: 'June 2020',
      endYear: 'May 2024',
      grade: 'GPA: 8.0'
    }
  ],
  skills: [
    // Languages
    { id: 'sk_1', name: 'JavaScript', category: 'Languages', proficiency: 'Expert', yearsExperience: 2.5, verified: true },
    { id: 'sk_2', name: 'TypeScript', category: 'Languages', proficiency: 'Expert', yearsExperience: 2.0, verified: true },
    { id: 'sk_3', name: 'Java', category: 'Languages', proficiency: 'Intermediate', yearsExperience: 2.0, verified: true },
    { id: 'sk_4', name: 'Python', category: 'Languages', proficiency: 'Intermediate', yearsExperience: 1.5, verified: true },

    // Frontend
    { id: 'sk_5', name: 'React.js', category: 'Frontend', proficiency: 'Expert', yearsExperience: 2.5, verified: true },
    { id: 'sk_6', name: 'Next.js', category: 'Frontend', proficiency: 'Expert', yearsExperience: 2.0, verified: true },
    { id: 'sk_7', name: 'Vite', category: 'Frontend', proficiency: 'Advanced', yearsExperience: 2.0, verified: true },
    { id: 'sk_8', name: 'Redux', category: 'Frontend', proficiency: 'Advanced', yearsExperience: 2.0, verified: true },
    { id: 'sk_9', name: 'Zustand', category: 'Frontend', proficiency: 'Expert', yearsExperience: 2.0, verified: true },
    { id: 'sk_10', name: 'Tailwind CSS', category: 'Frontend', proficiency: 'Expert', yearsExperience: 2.5, verified: true },
    { id: 'sk_11', name: 'MUI', category: 'Frontend', proficiency: 'Advanced', yearsExperience: 1.5, verified: true },
    { id: 'sk_12', name: 'Framer Motion', category: 'Frontend', proficiency: 'Advanced', yearsExperience: 1.5, verified: true },
    { id: 'sk_13', name: 'GSAP', category: 'Frontend', proficiency: 'Intermediate', yearsExperience: 1.0, verified: true },

    // Backend
    { id: 'sk_14', name: 'Node.js', category: 'Backend', proficiency: 'Expert', yearsExperience: 2.0, verified: true },
    { id: 'sk_15', name: 'Express.js', category: 'Backend', proficiency: 'Expert', yearsExperience: 2.0, verified: true },
    { id: 'sk_16', name: 'REST APIs', category: 'Backend', proficiency: 'Expert', yearsExperience: 2.0, verified: true },
    { id: 'sk_17', name: 'JWT', category: 'Backend', proficiency: 'Expert', yearsExperience: 2.0, verified: true },
    { id: 'sk_18', name: 'Socket.io', category: 'Backend', proficiency: 'Advanced', yearsExperience: 1.5, verified: true },
    { id: 'sk_19', name: 'Multer', category: 'Backend', proficiency: 'Advanced', yearsExperience: 1.5, verified: true },
    { id: 'sk_20', name: 'node-cron', category: 'Backend', proficiency: 'Advanced', yearsExperience: 1.5, verified: true },

    // Databases
    { id: 'sk_21', name: 'MongoDB', category: 'Databases', proficiency: 'Expert', yearsExperience: 2.0, verified: true },
    { id: 'sk_22', name: 'Mongoose', category: 'Databases', proficiency: 'Expert', yearsExperience: 2.0, verified: true },
    { id: 'sk_23', name: 'Redis', category: 'Databases', proficiency: 'Advanced', yearsExperience: 1.5, verified: true },
    { id: 'sk_24', name: 'MongoDB Atlas Vector Search', category: 'Databases', proficiency: 'Advanced', yearsExperience: 1.0, verified: true },

    // AI and LLM
    { id: 'sk_25', name: 'Google Gemini', category: 'AI and LLM', proficiency: 'Expert', yearsExperience: 1.5, verified: true },
    { id: 'sk_26', name: 'OpenAI API', category: 'AI and LLM', proficiency: 'Advanced', yearsExperience: 1.5, verified: true },
    { id: 'sk_27', name: 'LangChain', category: 'AI and LLM', proficiency: 'Intermediate', yearsExperience: 1.0, verified: true },
    { id: 'sk_28', name: 'Ollama', category: 'AI and LLM', proficiency: 'Intermediate', yearsExperience: 1.0, verified: true },
    { id: 'sk_29', name: 'RAG', category: 'AI and LLM', proficiency: 'Advanced', yearsExperience: 1.5, verified: true },
    { id: 'sk_30', name: 'Vector Embeddings', category: 'AI and LLM', proficiency: 'Advanced', yearsExperience: 1.5, verified: true },
    { id: 'sk_31', name: 'OCR', category: 'AI and LLM', proficiency: 'Advanced', yearsExperience: 1.5, verified: true },
    { id: 'sk_32', name: 'NLP', category: 'AI and LLM', proficiency: 'Intermediate', yearsExperience: 1.0, verified: true },

    // Cloud and Tools
    { id: 'sk_33', name: 'AWS (Cognito, S3, CloudFront, Elastic Beanstalk, KMS)', category: 'Cloud and Tools', proficiency: 'Advanced', yearsExperience: 1.5, verified: true },
    { id: 'sk_34', name: 'Docker', category: 'Cloud and Tools', proficiency: 'Intermediate', yearsExperience: 1.0, verified: true },
    { id: 'sk_35', name: 'Electron', category: 'Cloud and Tools', proficiency: 'Intermediate', yearsExperience: 1.0, verified: true },
    { id: 'sk_36', name: 'Git & GitHub', category: 'Cloud and Tools', proficiency: 'Expert', yearsExperience: 3.0, verified: true },

    // Data Viz & Geo
    { id: 'sk_37', name: 'Chart.js & Recharts', category: 'Data Viz & Geo', proficiency: 'Advanced', yearsExperience: 2.0, verified: true },
    { id: 'sk_38', name: 'ApexCharts & ECharts', category: 'Data Viz & Geo', proficiency: 'Intermediate', yearsExperience: 1.5, verified: true },
    { id: 'sk_39', name: 'Leaflet & Turf.js', category: 'Data Viz & Geo', proficiency: 'Advanced', yearsExperience: 1.5, verified: true },

    // Other Tools
    { id: 'sk_40', name: 'ExcelJS & Docxtemplater', category: 'Other Tools', proficiency: 'Expert', yearsExperience: 1.5, verified: true },
    { id: 'sk_41', name: 'Zod & React Hook Form', category: 'Other Tools', proficiency: 'Expert', yearsExperience: 2.0, verified: true }
  ],
  experience: [
    {
      id: 'exp_sidlabs',
      company: 'SidLabs LLP',
      role: 'Full Stack Developer',
      location: 'Delhi, India (Remote)',
      employmentType: 'Full-time',
      startDate: 'Nov 2024',
      endDate: 'Present',
      current: true,
      responsibilities: [
        'Built a case evaluation flow on Google Gemini that checks Swiss asylum admissibility and drafts structured UN Human Rights appeals (CAT, CEDAW) of 3,000+ words, cutting case turnaround by 50%.',
        'Wrote browser-side text extraction with Tesseract.js, pdfjs-dist and Mammoth that reads PDFs, scanned images and Word files without a server round trip, replacing manual evidence transcription.',
        'Generated court-ready .docx petitions from case data with Docxtemplater and PizZip, sorting evidence into standard annexes automatically.',
        'Developed a privacy-focused social network with polls, media uploads, mood tags, anonymous posting and a ranked feed; Redis caching and cursor pagination support 2,000 concurrent users.',
        'Indexed posts and comments for semantic search with Transformers.js and MongoDB Atlas Vector Search (RAG), returning summaries that link back to the original posts.',
        'Created a five-role system (patient, caregiver, clinician, researcher, admin) with an HL7 FHIR R4 assessment module, MongoDB transactions, automatic scoring and S3 video streaming.',
        'Compressed multi-GB environmental datasets into a 4.4MB JSON snapshot through schema encoding and truncation, an 80% size cut that brought dashboard load time under one second.',
        'Designed a 14-step form flow producing bank-format Credit Monitoring Arrangement (CMA) projections, loan amortization schedules and 14 annexures; coded an 8,000+ line ExcelJS module placing live formulas across 15+ linked worksheets.'
      ],
      technologies: [
        'React', 'Next.js', 'TypeScript', 'Node.js', 'MongoDB', 
        'Google Gemini', 'Redis', 'Socket.io', 'AWS', 'Leaflet', 'ExcelJS', 'Docxtemplater'
      ],
      metrics: [
        '50% reduction in asylum case turnaround',
        '2,000 concurrent users supported on Redis/Socket.io feed',
        '80% reduction in geospatial payload sizes (<1s load time)',
        '34+ clinical datasets de-identified under HIPAA & GDPR'
      ]
    }
  ],
  projects: [
    {
      id: 'proj_whiteboard',
      name: 'Collaborative Whiteboard Application',
      role: 'Full Stack Creator & Architect',
      description: 'Infinite-canvas real-time collaborative workspace supporting 16+ vector primitives, sticky notes, connectors, ephemeral cursor chat, and 60 FPS CRDT state synchronization.',
      technologies: ['Next.js 14', 'React 18', 'TypeScript', 'Liveblocks', 'Tailwind CSS', 'Clerk', 'Convex'],
      achievements: [
        'Architected an infinite-canvas collaborative workspace supporting 16+ vector primitives, sticky notes and connector arrows using Next.js 14, React 18, TypeScript and Tailwind CSS.',
        'Implemented real-time CRDT synchronization via Liveblocks (LiveMap/LiveList) with 16ms throttling (60 FPS), powering conflict-free multi-user editing, ephemeral cursor chat, live reactions, and camera spotlight follow mode.',
        'Engineered client-side optimizations and secure architecture, utilizing the Ramer-Douglas-Peucker (RDP) algorithm for stroke point reduction, and Clerk + Convex for multi-tenant RBAC with sub-100ms reactive database queries.'
      ],
      githubUrl: 'https://github.com/AtulKaple',
      liveUrl: 'https://vision-map-psi.vercel.app/',
      featured: true
    },
    {
      id: 'proj_legal_case_automation',
      name: 'Legal Case Automation',
      role: 'Full Stack Developer',
      description: 'AI-assisted legal petition preparation and document generation system evaluating Swiss asylum admissibility and generating structured UN human rights appeals.',
      technologies: ['Next.js', 'Node.js', 'Google Gemini', 'Tesseract.js', 'Docxtemplater', 'PizZip'],
      achievements: [
        'Built a case evaluation flow on Google Gemini checking Swiss asylum admissibility and drafting UN appeals of 3,000+ words, cutting turnaround by 50%.',
        'Implemented zero-server OCR with Tesseract.js and Mammoth for privacy-preserving document extraction.',
        'Generated court-ready .docx petitions from case data with Docxtemplater and PizZip with standard annexes.'
      ],
      featured: true
    },
    {
      id: 'proj_patient_community',
      name: 'Patient Community Network',
      role: 'Full Stack Developer',
      description: 'HIPAA-compliant patient social network featuring semantic vector search, real-time messaging, anonymous peer support, and clinical de-identification.',
      technologies: ['React', 'TypeScript', 'Node.js', 'Socket.io', 'Redis', 'MongoDB Atlas Vector Search', 'RAG'],
      achievements: [
        'Developed a privacy-focused social network supporting 2,000 concurrent users with Redis caching and cursor pagination.',
        'Indexed posts for semantic search using Transformers.js and MongoDB Atlas Vector Search (RAG).',
        'Enforced HIPAA Safe Harbor de-identification rules before data reaches researchers.'
      ],
      featured: true
    },
    {
      id: 'proj_healthcare_research',
      name: 'Healthcare Research Application',
      role: 'Full Stack Developer',
      description: 'Clinical trial and patient assessment platform compliant with HIPAA and GDPR, supporting HL7 FHIR R4 standard assessments and encrypted biometric synchronization.',
      technologies: ['React', 'TypeScript', 'Node.js', 'AWS', 'Cognito', 'KMS', 'HL7 FHIR R4', 'MongoDB'],
      achievements: [
        'Created a five-role system with HL7 FHIR R4 assessment module, MongoDB transactions, and S3 video streaming.',
        'Met HIPAA/GDPR requirements with AWS Cognito MFA, tiered consent, and SHA-256 hash-chained audit log.',
        'Built automated de-identification jobs across 34+ datasets using AWS KMS decryption and HMAC pseudonyms.'
      ],
      featured: true
    },
    {
      id: 'proj_environmental_dashboard',
      name: 'Environmental Monitoring Dashboard',
      role: 'Full Stack Developer',
      description: 'High-performance geospatial analytics dashboard detecting deforestation and ecological threats from streaming RSS feeds.',
      technologies: ['Next.js', 'Leaflet', 'Turf.js', 'Node.js', 'MongoDB', 'Compromise NLP'],
      achievements: [
        'Compressed multi-GB environmental datasets into 4.4MB JSON snapshot (80% cut), achieving sub-1s load times.',
        'Scheduled node-cron job with Compromise NLP reading 30+ RSS feeds every 15 min and geocoding 200+ regions.',
        'Rendered Leaflet maps with Turf.js 20km buffers and point-in-polygon tests on protected reserves.'
      ],
      featured: true
    },
    {
      id: 'proj_financial_projection',
      name: 'Financial Projection Tool',
      role: 'Full Stack Developer',
      description: 'Comprehensive 14-step financial modeler and automated Excel workbook generator for Chartered Accountants preparing banking CMA reports.',
      technologies: ['React', 'Node.js', 'ExcelJS', 'MongoDB', 'Zustand', 'TypeScript'],
      achievements: [
        'Designed a 14-step form flow producing bank-format CMA projections and 14 statutory annexures.',
        'Engineered an 8,000+ line ExcelJS module placing dynamic live formulas across 15+ linked worksheets.',
        'Issued expiring client links (Node.js crypto tokens, MongoDB TTL) refilling multi-step forms without login.'
      ],
      featured: true
    }
  ],
  projectDocs: defaultProjectDocs
};

export const defaultSettings: AppSettings = {
  targetRoles: [
    'Full Stack Developer',
    'Frontend Developer',
    'Frontend Engineer',
    'React Developer',
    'Next.js Developer',
    'Software Engineer'
  ],
  targetLocations: ['Pune', 'Bangalore', 'Mumbai', 'Hyderabad', 'Delhi NCR', 'Remote', 'India'],
  minimumScoreThreshold: 75,
  dailyApplicationLimit: 10,
  dailyDiscoveryLimit: 150,
  dailyAnalysisLimit: 50,
  autoApplyMode: 'ASSISTED_ONLY',
  excludedCompanies: ['BadCompany Inc', 'SpamRecruiters'],
  excludedKeywords: ['Senior Manager', '10+ years', 'C++ Embedded', 'Java Spring Senior Lead'],
  scoringWeights: {
    technicalSkills: 40,
    experience: 20,
    education: 10,
    location: 10,
    roleRelevance: 10,
    salary: 5,
    preferences: 5
  },
  enableDemoMode: true,
  syncToExcelOnApply: true,
  telegramNotifications: false,
  staleJobRetentionDays: 20
};
