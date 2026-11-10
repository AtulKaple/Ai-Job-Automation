# INSTRUCTIONS MANUAL FOR GENERATING ATS-OPTIMIZED RESUMES

This manual governs the automated ATS Resume Generation and Tailoring pipeline for Atul Kaple's professional profile.

---

## PROCESS (Follow in strict order)

### Step 1 - Analyse the Job Description
- **Keyword Extraction**: List the 10–15 most important keywords and phrases: tools, languages, frameworks, concepts, and the exact job title wording.
- **Classification**: Split them into "required" and "nice to have".
- **Employer Intent**: Note the 3 things the employer cares about most (e.g., performance at scale, distributed architecture, security/compliance).

### Step 2 - Select and Rank Projects
- **Scoring**: Score each project in the documented project library against the required keywords.
- **Selection**: Keep only the 4–5 most relevant projects. Put the strongest match first.
- **Bullet Selection**: Within each project, keep the 2–3 bullets that best match the job and drop the rest.

### Step 3 - Write the Bullets
- **Formula**: Action Verb + What I Built + Tools Used + Measurable Result.
- **Length & Focus**: Each bullet is 1–2 lines (about 20–30 words), exactly one idea per bullet.
- **Exact Tool Naming**: Use the job description's exact wording for tools and concepts wherever it is true for my work (e.g., write "Node.js" or "PostgreSQL" exactly as the posting does).
- **Truthfulness & Verification**: Never invent a number, tool, result or responsibility. If a metric is missing, leave it out and list it under "things to verify".
- **Skills Alignment**: A tool may appear in Technical Skills only if it appears in a bullet or is verified in the candidate's master profile.
- **AI/LLM Rigor**: For AI/LLM work, show how the output was checked, such as validation schemas, structured JSON output, human review in the loop, or cost and latency handling.

### Step 4 - Language Rules
- **Banned Words**: 
  `architected`, `engineered`, `leveraged`, `utilized`, `utilizing`, `robust`, `scalable`, `seamless`, `end-to-end`, `cutting-edge`, `dynamic`, `innovative`, `passionate`, `results-driven`, `spearheaded`, `synergy`, `state-of-the-art`, `AI-powered`, `powerful`, `efficient`, `streamlined`, `"responsible for"`, `"worked on"`, `"helped with"`.
- **No Repeated Action Verbs**: No action verb may be used twice in the whole resume.
- **Descriptive Word Frequency Cap**: No descriptive word (such as pipeline, platform, system, workflow, dashboard) may be used more than twice in the whole resume. Technology names are exempt.
- **Tone**: Plain, concrete wording. No filler adjectives. No first-person pronouns (`I`, `me`, `my`).
- **Anonymization & Project Naming**: Do not use proprietary, client-confidential, or internal codenames (e.g., never use `LexAid`, `WinSights`, `Defence+`, `VisionMap`, `SMS`). Describe each project by what it does and its stack:
  1. `Legal Case Automation (Next.js, Node.js, Google Gemini)`
  2. `Patient Community Network (React, TypeScript, Node.js, Socket.io, Redis)`
  3. `Healthcare Research Application (React, TypeScript, Node.js, AWS)`
  4. `Environmental Monitoring Dashboard (Next.js, Leaflet, Node.js, MongoDB)`
  5. `Financial Projection Tool (React, Node.js, ExcelJS, MongoDB)`
  6. `Multi-Tenant Enterprise Platform (Next.js 15, TanStack Query, Socket.io, Razorpay, ExcelJS)`
  7. `Collaborative Whiteboard Application (Next.js, TypeScript, Liveblocks)` [Personal Project]

### Step 5 - Keyword Placement
- **Headline & Summary**: Put the exact job title in the first line of the summary.
- **Summary Length**: 2 lines total, stating years of experience, core tech stack, and primary domain/AI focus.
- **Skills Ordering**: Order the Skills section by relevance to this target job and use plain comma-separated lists.
- **Keyword Density**: Each important keyword should appear 2–3 times across the resume (Skills plus bullets). No keyword stuffing.

### Step 6 - Single-Page ATS LaTeX Formatting
- **Document Class**: `\documentclass[letterpaper,9pt]{extarticle}`
- **Margins**: 0.5in side margins, 0.45in top and bottom margins.
- **Custom Commands**:
  - `\resumeItem{...}`
  - `\resumeSubheading{Employer}{Dates}{Title}{Location}`
  - `\resumeProjectLabel{Project Name (Tech Stack)}`
  - `\resumeProjectHeading{Project Name (Tech Stack) | Links}{}`
- **Character Escaping**: `%` as `\%`, `&` as `\&`, `#` as `\#`, `_` as `\_`, `$` as `\$`.

### Step 7 - Audit Before Output
Check each item and fix any failure before finalizing:
- [ ] Every required keyword is covered, or explicitly marked as a gap.
- [ ] No banned word used anywhere.
- [ ] No action verb repeated anywhere on the page.
- [ ] No descriptive word (platform, system, pipeline, etc.) used more than twice.
- [ ] Zero invented facts, metrics, tools, or dates.
- [ ] Compiles to exactly one page.
- [ ] Zero typos, double periods, broken symbols, or mismatched links.
- [ ] Projects are sorted in order of relevance to the job.
