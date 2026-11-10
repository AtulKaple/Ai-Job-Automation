import { Job, JobSource, AutomationMode, AppSettings } from '../src/types';

export interface JobSourceAdapter {
  id: string;
  name: string;
  source: JobSource;
  icon: string;
  category: 'ATS & Direct' | 'Global Remote' | 'Aggregators & Boards' | 'Startup Ecosystem' | 'India Tech';
  canApplyAutomatically(): boolean;
  getAutomationMode(): AutomationMode;
  discoverJobs(criteria: { roles: string[]; locations: string[]; limit?: number }): Promise<Job[]>;
}

// Deterministic Hash generator for deduplication
export function generateJobHash(company: string, title: string, location: string): string {
  const norm = `${company.toLowerCase().trim()}_${title.toLowerCase().trim()}_${location.toLowerCase().trim()}`
    .replace(/[^a-z0-9]/g, '_');
  return `hash_${norm.slice(0, 45)}`;
}

// Helper to decode HTML entities and format rich job descriptions with markdown headers and bullets
export function formatJobDescription(raw: string): string {
  if (!raw) return '';
  let str = raw
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#x27;/gi, "'")
    .replace(/&#39;/gi, "'")
    .replace(/&rsquo;/gi, "'")
    .replace(/&lsquo;/gi, "'")
    .replace(/&rdquo;/gi, '"')
    .replace(/&ldquo;/gi, '"')
    .replace(/&mdash;/gi, '—')
    .replace(/&ndash;/gi, '–')
    .replace(/&bull;/gi, '•')
    .replace(/&middot;/gi, '•')
    .replace(/&nbsp;/gi, ' ');

  // Convert HTML headings to Markdown headings
  str = str
    .replace(/<h[1-6][^>]*>([\s\S]*?)<\/h[1-6]>/gi, (_m, p) => `\n\n### ${p.replace(/<[^>]+>/g, '').trim()}\n\n`)
    .replace(/<strong[^>]*>([\s\S]*?)<\/strong>/gi, (_m, p) => ` **${p.replace(/<[^>]+>/g, '').trim()}** `)
    .replace(/<b[^>]*>([\s\S]*?)<\/b>/gi, (_m, p) => ` **${p.replace(/<[^>]+>/g, '').trim()}** `)
    .replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, (_m, p) => `\n• ${p.replace(/<[^>]+>/g, '').trim()}`)
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<br\s*[\/]?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  return str;
}

// Backward-compatible simple stripper
export function stripHtml(html: string): string {
  return formatJobDescription(html);
}

// Extract requirement bullet points directly from full job description text
export function extractRequirementsFromText(text: string, defaultReqs: string[] = []): string[] {
  if (!text) return defaultReqs;
  const lines = text.split('\n');
  const sectionBullets: string[] = [];
  let inRequirementsSection = false;

  for (const line of lines) {
    const trimmed = line.trim();
    if (/###\s*(Requirements|Qualifications|What you('ll)? need|What we('re)? looking for|Skills|Must have|Who you are|Basic Qualifications)/i.test(trimmed)) {
      inRequirementsSection = true;
      continue;
    }
    if (inRequirementsSection && /###\s*(Responsibilities|About|Benefits|Perks|What you('ll)? do|Who we are|Nice to have|Preferred)/i.test(trimmed)) {
      inRequirementsSection = false;
      continue;
    }

    if (inRequirementsSection && (trimmed.startsWith('•') || trimmed.startsWith('-') || trimmed.startsWith('*'))) {
      const clean = trimmed.replace(/^[•\-\*]\s*/, '').trim();
      if (clean.length > 15 && clean.length < 320) {
        sectionBullets.push(clean);
      }
    }
  }

  if (sectionBullets.length >= 3) {
    return sectionBullets.slice(0, 8);
  }

  // Fallback: extract any strong bullet points found in the document
  const allBullets = lines
    .map(l => l.trim())
    .filter(l => (l.startsWith('•') || l.startsWith('-') || l.startsWith('*')) && l.length > 25 && l.length < 320)
    .map(l => l.replace(/^[•\-\*]\s*/, '').trim());

  if (allBullets.length >= 3) {
    return allBullets.slice(0, 8);
  }

  return defaultReqs;
}

// Generate structured, realistic job descriptions for curated platforms
export function createRichJobDescription(company: string, title: string, sourceLabel: string, loc: string): string {
  return `### About ${company}

${company} is an industry-innovating engineering organization recognized for building scalable, high-performance web products and mission-critical cloud infrastructure. As part of our continued global technical expansion on ${sourceLabel}, we are seeking an experienced, proactive ${title} to join our engineering organization.

### Role Overview & Impact

In this role, you will take full ownership of core frontend architecture, user interfaces, and client-facing workflows. You will partner with cross-functional product leads, designers, and backend teams to build intuitive, high-velocity experiences that delight users and scale seamlessly across distributed systems.

### Key Responsibilities
• Architect, develop, test, and maintain high-speed web applications using React, TypeScript, and modern component design systems.
• Translate design mockups and wireframes from Figma into clean, modular, accessible, and performant user interface components.
• Build robust state management patterns and integrate RESTful/GraphQL APIs with graceful error handling and optimistic UI updates.
• Optimize Core Web Vitals (LCP, FID, CLS), client-side render times, asset compression, and bundle splitting.
• Implement automated unit and component testing suites (Jest, React Testing Library) to ensure reliability and minimize regressions.
• Actively participate in architectural discussions, code reviews, and cross-team sprint planning.

### Requirements & Qualifications
• Proven experience building production web applications with React, TypeScript, and modern JavaScript (ES6+).
• Strong understanding of responsive layout principles, modern CSS / Tailwind CSS, and web accessibility standards (WCAG 2.1).
• Solid grasp of asynchronous JavaScript, browser APIs, client caching, and REST/HTTP networking.
• Self-starter mindset with strong problem-solving capabilities and clear written communication skills.
• Comfort working in git-based collaborative environments with modern CI/CD pipelines.

### Benefits & Culture
• Highly competitive compensation package benchmarked against top-tier tech standards.
• Flexible remote work arrangement with dedicated home office and equipment stipend.
• Comprehensive medical, dental, and wellness insurance options.
• Annual professional development and learning stipend for courses and conferences.
• Collaborative, inclusive culture with team retreats and generous paid time off.`;
}

// Regex to match engineering, frontend, fullstack, software roles
const TECH_ROLE_REGEX = /frontend|front-end|react|fullstack|full-stack|software|engineer|developer|web|ui|javascript|typescript|platform|backend|node/i;

// Helper to parse XML / RSS feeds into items
interface RssItem {
  title: string;
  link: string;
  description: string;
  pubDate: string;
  category?: string;
}

function parseRssItems(xml: string): RssItem[] {
  const items: RssItem[] = [];
  const itemRegex = /<item[\s\S]*?<\/item>/gi;
  let match;
  while ((match = itemRegex.exec(xml)) !== null) {
    const content = match[0];
    const titleMatch = content.match(/<title>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/i);
    const linkMatch = content.match(/<link>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/link>/i);
    const descMatch = content.match(/<description>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/description>/i);
    const pubDateMatch = content.match(/<pubDate>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/pubDate>/i);
    const catMatch = content.match(/<category>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/category>/i);

    const title = titleMatch ? titleMatch[1].trim() : '';
    const link = linkMatch ? linkMatch[1].trim() : '';
    const description = descMatch ? formatJobDescription(descMatch[1]) : '';
    const pubDate = pubDateMatch ? pubDateMatch[1].trim() : new Date().toISOString();
    const category = catMatch ? catMatch[1].trim() : '';

    if (title && link) {
      items.push({ title, link, description, pubDate, category });
    }
  }
  return items;
}

// =============================================================
// 1. Himalayas API Live Fetcher (https://himalayas.app/jobs/api)
// =============================================================
async function fetchLiveHimalayasJobs(limit = 6): Promise<Job[]> {
  try {
    const res = await fetch('https://himalayas.app/jobs/api?limit=25', {
      signal: AbortSignal.timeout(4500),
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) JobPilot/1.0',
        'Accept': 'application/json'
      }
    });
    if (!res.ok) return [];
    const data = await res.json();
    const rawJobs: any[] = data.jobs || [];

    const matched = rawJobs.filter(j => TECH_ROLE_REGEX.test(j.title || ''));
    return matched.slice(0, limit).map(j => {
      const company = j.companyName || 'Tech Scaleup';
      const title = j.title || 'Software Engineer';
      const loc = j.locationRestrictions || 'Remote Worldwide';
      const cleanDesc = formatJobDescription(j.description || j.excerpt || '');
      const skills = ['React', 'TypeScript', 'JavaScript', 'Node.js', 'REST APIs'];

      return {
        id: `himalayas_${j.guid ? j.guid.replace(/[^a-zA-Z0-9]/g, '_').slice(-20) : Date.now()}`,
        externalId: String(j.guid || j.pubDate || Math.random()),
        source: 'himalayas' as JobSource,
        sourceName: `Himalayas (${company})`,
        company,
        title,
        location: loc,
        remote: true,
        employmentType: 'Full-time',
        salaryMin: j.minSalary ? Math.round(j.minSalary / 1000) : 22,
        salaryMax: j.maxSalary ? Math.round(j.maxSalary / 1000) : 40,
        salaryCurrency: j.currency ? `${j.currency}k` : 'INR LPA (Eqv)',
        experienceMin: 1,
        experienceMax: 4,
        description: cleanDesc || `${company} is actively seeking a ${title} on Himalayas.`,
        requirements: extractRequirementsFromText(cleanDesc, [
          'Proficiency in React, modern JavaScript/TypeScript, and scalable component patterns',
          'Experience working asynchronously with distributed, remote engineering teams',
          'Commitment to writing readable, tested, and high-performance front-end code'
        ]),
        preferredQualifications: ['Experience with Next.js, GraphQL, or state management frameworks'],
        skills,
        url: j.applicationLink || j.guid || 'https://himalayas.app/jobs',
        canonicalUrl: j.applicationLink || j.guid || 'https://himalayas.app/jobs',
        postedAt: j.pubDate ? new Date(j.pubDate * 1000).toISOString() : new Date().toISOString(),
        discoveredAt: new Date().toISOString(),
        jobHash: generateJobHash(company, title, loc),
        status: 'DISCOVERED' as const,
        automationMode: 'ASSISTED' as AutomationMode
      };
    });
  } catch (err) {
    return [];
  }
}

// =============================================================
// 2. RemoteOK API Live Fetcher (https://remoteok.com/api)
// =============================================================
async function fetchLiveRemoteOKJobs(limit = 6): Promise<Job[]> {
  try {
    const res = await fetch('https://remoteok.com/api', {
      signal: AbortSignal.timeout(4500),
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) JobPilot/1.0',
        'Accept': 'application/json'
      }
    });
    if (!res.ok) return [];
    const data = await res.json();
    if (!Array.isArray(data)) return [];

    // Skip the first element which contains legal/meta disclaimer
    const rawJobs = data.slice(1).filter(j => j && j.position && TECH_ROLE_REGEX.test(j.position));

    return rawJobs.slice(0, limit).map(j => {
      const company = j.company || 'Remote Tech Co';
      const title = j.position;
      const loc = j.location || 'Remote Worldwide';
      const cleanDesc = formatJobDescription(j.description || '');
      const skills = Array.isArray(j.tags) && j.tags.length > 0 ? j.tags.slice(0, 6) : ['React', 'TypeScript', 'Node.js', 'Frontend'];

      return {
        id: `remoteok_${j.id || Math.random().toString(36).slice(2)}`,
        externalId: String(j.id || Math.random()),
        source: 'remoteok' as JobSource,
        sourceName: `RemoteOK (${company})`,
        company,
        title,
        location: loc,
        remote: true,
        employmentType: 'Full-time',
        salaryMin: j.salary_min ? Math.round(j.salary_min / 1000) : 20,
        salaryMax: j.salary_max ? Math.round(j.salary_max / 1000) : 38,
        salaryCurrency: 'USDk / LPA Eqv',
        experienceMin: 1,
        experienceMax: 4,
        description: cleanDesc || `${company} is hiring a ${title} through RemoteOK.`,
        requirements: extractRequirementsFromText(cleanDesc, [
          'Solid practical experience in modern web technologies and frontend frameworks',
          'Comfortable working in high-growth, remote-first software development environments',
          'Demonstrated problem-solving skills and eye for clean, accessible design'
        ]),
        preferredQualifications: ['Familiarity with cloud microservices, Docker, or modern CI/CD pipelines'],
        skills,
        url: j.url || j.apply_url || `https://remoteok.com/remote-jobs/${j.id}`,
        canonicalUrl: j.url || j.apply_url || `https://remoteok.com/remote-jobs/${j.id}`,
        postedAt: j.date ? new Date(j.date).toISOString() : new Date().toISOString(),
        discoveredAt: new Date().toISOString(),
        jobHash: generateJobHash(company, title, loc),
        status: 'DISCOVERED' as const,
        automationMode: 'ASSISTED' as AutomationMode
      };
    });
  } catch (err) {
    return [];
  }
}

// =============================================================
// 3. We Work Remotely RSS Live Fetcher
// =============================================================
async function fetchLiveWeWorkRemotelyJobs(limit = 6): Promise<Job[]> {
  try {
    const res = await fetch('https://weworkremotely.com/categories/remote-programming-jobs.rss', {
      signal: AbortSignal.timeout(4500),
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) JobPilot/1.0',
        'Accept': 'application/rss+xml, application/xml, text/xml'
      }
    });
    if (!res.ok) return [];
    const xml = await res.text();
    const items = parseRssItems(xml);

    const relevant = items.filter(item => TECH_ROLE_REGEX.test(item.title));
    return relevant.slice(0, limit).map((item, idx) => {
      // Titles in WWR are formatted like "Company: Job Title"
      let company = 'Tech Company';
      let title = item.title;
      if (item.title.includes(':')) {
        const parts = item.title.split(':');
        company = parts[0].trim();
        title = parts.slice(1).join(':').trim();
      }

      return {
        id: `wwr_${Buffer.from(item.link || `${idx}`).toString('base64').replace(/[^a-zA-Z0-9]/g, '').slice(-18)}`,
        externalId: item.link,
        source: 'weworkremotely' as JobSource,
        sourceName: `We Work Remotely (${company})`,
        company,
        title,
        location: 'Remote Worldwide',
        remote: true,
        employmentType: 'Full-time',
        salaryMin: 22,
        salaryMax: 42,
        salaryCurrency: 'INR LPA (Eqv)',
        experienceMin: 1,
        experienceMax: 4,
        description: item.description || `${company} is hiring a ${title} on We Work Remotely.`,
        requirements: extractRequirementsFromText(item.description, [
          'Strong practical background in React, TypeScript, and modern JavaScript standards',
          'Ability to collaborate across distributed timezones and deliver independently',
          'Passionate about UI/UX performance, responsive layouts, and cross-browser testing'
        ]),
        preferredQualifications: ['Experience with Next.js, fullstack Node.js, and automated unit tests'],
        skills: ['React', 'TypeScript', 'Tailwind CSS', 'Node.js', 'REST APIs', 'Git'],
        url: item.link,
        canonicalUrl: item.link,
        postedAt: item.pubDate ? new Date(item.pubDate).toISOString() : new Date().toISOString(),
        discoveredAt: new Date().toISOString(),
        jobHash: generateJobHash(company, title, 'Remote Worldwide'),
        status: 'DISCOVERED' as const,
        automationMode: 'ASSISTED' as AutomationMode
      };
    });
  } catch (err) {
    return [];
  }
}

// =============================================================
// 4. Y Combinator Live Fetcher (Direct from https://www.ycombinator.com/jobs)
// =============================================================
async function fetchLiveYCombinatorJobs(limit = 10): Promise<Job[]> {
  try {
    const res = await fetch('https://www.ycombinator.com/jobs', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
      },
      signal: AbortSignal.timeout(6000)
    });
    if (!res.ok) return [];
    const html = await res.text();
    const dataPageMatch = html.match(/data-page="([^"]+)"/);
    if (!dataPageMatch) return [];

    const decoded = dataPageMatch[1]
      .replace(/&quot;/g, '"')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>');
    const pageData = JSON.parse(decoded);
    const postings: any[] = pageData.props?.jobPostings || [];

    const jobs: Job[] = [];
    for (const p of postings) {
      if (!p.id || !p.title || !p.companyName) continue;
      const title = p.title.trim();
      const company = p.companyName.trim();
      const jobPath = p.url ? (p.url.startsWith('/') ? p.url : `/${p.url}`) : `/companies/${company.toLowerCase().replace(/[^a-z0-9]/g, '-')}/jobs/${p.id}`;
      const fullUrl = `https://www.ycombinator.com${jobPath}`;
      const loc = p.location || 'Remote';

      // Parse salary if available, e.g. "$120K - $180K" or "₹3M - ₹8M INR"
      let salaryMin = 22;
      let salaryMax = 42;
      if (p.salaryRange) {
        const numbers = (p.salaryRange.match(/\d+/g) || []).map(Number);
        if (numbers.length >= 2) {
          salaryMin = Math.min(numbers[0], numbers[1]);
          salaryMax = Math.max(numbers[0], numbers[1]);
        }
      }

      const skills: string[] = Array.isArray(p.skills) && p.skills.length > 0 ? p.skills : ['React', 'TypeScript', 'Next.js', 'Node.js', 'Tailwind CSS'];

      const desc = `### About ${company} (${p.companyBatchName ? 'YC ' + p.companyBatchName : 'YC Backed'})\n\n${p.companyOneLiner || company + ' is a Y Combinator backed startup.'}\n\n### Role: ${title}\n• **Department / Role**: ${p.prettyRole || 'Engineering'} (${p.roleSpecificType || p.type || 'Full-time'})\n• **Location**: ${loc}\n• **Compensation**: ${p.salaryRange || 'Competitive startup salary'} ${p.equityRange ? '+ ' + p.equityRange + ' equity' : ''}\n• **Experience**: ${p.minExperience || '1-4 years'}\n• **Work Authorization**: ${p.visa || 'Open'}\n\n### Key Technologies\n${skills.map((s: string) => `• ${s}`).join('\n')}\n\n### Application\nApply directly via the official Y Combinator Jobs portal at: ${fullUrl}`;

      jobs.push({
        id: `yc_${p.id}`,
        externalId: String(p.id),
        source: 'ycombinator' as JobSource,
        sourceName: `Y Combinator (${company})`,
        company,
        title,
        location: loc,
        remote: /remote/i.test(loc) || /remote/i.test(p.type || ''),
        employmentType: p.type || 'Full-time',
        salaryMin,
        salaryMax,
        salaryCurrency: 'INR LPA (Eqv)',
        experienceMin: 1,
        experienceMax: 4,
        description: desc,
        requirements: [
          `Proven development capability in modern web architecture (${skills.slice(0, 3).join(', ')})`,
          'Fast-paced startup execution mindset with high product ownership',
          'Clean modular code habits and strong debugging fundamentals'
        ],
        preferredQualifications: [
          'Prior experience in early-stage startups or YC ecosystem projects',
          p.equityRange ? `Interest in equity ownership (${p.equityRange})` : 'Full-stack problem solving'
        ],
        skills,
        url: fullUrl,
        canonicalUrl: fullUrl,
        postedAt: new Date().toISOString(),
        discoveredAt: new Date().toISOString(),
        jobHash: generateJobHash(company, title, loc),
        status: 'DISCOVERED' as const,
        automationMode: 'ASSISTED' as AutomationMode
      });

      if (jobs.length >= limit) break;
    }
    return jobs;
  } catch (err) {
    console.warn('[YCombinator] Error fetching live jobs:', err);
    return [];
  }
}

// =============================================================
// 5. Hiring Cafe Live / Curated Tech Aggregator
// =============================================================
async function fetchHiringCafeJobs(limit = 5): Promise<Job[]> {
  try {
    const res = await fetch('https://hiring.cafe/api/search-jobs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({ query: 'frontend react software engineer' }),
      signal: AbortSignal.timeout(4000)
    });
    if (res.ok) {
      const data = await res.json();
      const hits = Array.isArray(data.jobs) ? data.jobs : Array.isArray(data) ? data : [];
      if (hits.length > 0) {
        return hits.slice(0, limit).map((j: any) => {
          const desc = formatJobDescription(j.description || `${j.company} is actively recruiting a ${j.title} via Hiring Cafe.`);
          return {
            id: `hiringcafe_${j.id || Math.random().toString(36).slice(2)}`,
            externalId: String(j.id || Math.random()),
            source: 'hiringcafe' as JobSource,
            sourceName: `Hiring Cafe (${j.company || 'Tech Employer'})`,
            company: j.company || 'Scaleup Tech',
            title: j.title || 'Frontend Software Engineer',
            location: j.location || 'Remote',
            remote: Boolean(j.remote || /remote/i.test(j.location || '')),
            employmentType: 'Full-time',
            salaryMin: j.salaryMin || 20,
            salaryMax: j.salaryMax || 38,
            salaryCurrency: 'INR LPA (Eqv)',
            experienceMin: 1,
            experienceMax: 4,
            description: desc,
            requirements: extractRequirementsFromText(desc, [
              'Hands-on development experience in React 18+, TypeScript, and modern component systems',
              'Strong foundation in web performance optimization and clean architecture'
            ]),
            preferredQualifications: ['Experience building modern SaaS interfaces with Tailwind CSS'],
            skills: ['React', 'TypeScript', 'JavaScript', 'Tailwind CSS', 'REST APIs'],
            url: j.applyUrl || j.url || 'https://hiring.cafe',
            canonicalUrl: j.url || 'https://hiring.cafe',
            postedAt: j.postedAt || new Date().toISOString(),
            discoveredAt: new Date().toISOString(),
            jobHash: generateJobHash(j.company || 'HiringCafe', j.title || 'Frontend Engineer', j.location || 'Remote'),
            status: 'DISCOVERED' as const,
            automationMode: 'ASSISTED' as AutomationMode
          };
        });
      }
    }
  } catch (err) {
    // Graceful fallback to verified high-growth direct openings
  }

  return [];
}

// =============================================================
// 6. Welcome to the Jungle
// =============================================================
async function fetchWelcomeToTheJungleJobs(_limit = 4): Promise<Job[]> {
  // Only genuine live API endpoints should produce jobs
  return [];
}

// =============================================================
// 7. Wellfound (AngelList Talent)
// =============================================================
async function fetchWellfoundJobs(_limit = 4): Promise<Job[]> {
  // Only genuine live API endpoints should produce jobs
  return [];
}

// =============================================================
// 8. Remotive API Live Fetcher
// =============================================================
async function fetchLiveRemotiveJobs(limit = 6): Promise<Job[]> {
  try {
    const res = await fetch('https://remotive.com/api/remote-jobs?category=software-dev&limit=30', {
      signal: AbortSignal.timeout(4500),
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) JobPilot/1.0',
        'Accept': 'application/json'
      }
    });

    if (!res.ok) return [];
    const data = await res.json();
    const rawJobs: any[] = data.jobs || [];

    const relevant = rawJobs.filter(j => TECH_ROLE_REGEX.test(j.title || ''));
    return relevant.slice(0, limit).map(j => {
      const cleanDesc = formatJobDescription(j.description || '');
      const skills = (j.tags || ['React', 'TypeScript', 'JavaScript', 'Tailwind CSS', 'REST APIs']).slice(0, 7);
      const loc = j.candidate_required_location || 'Remote Worldwide';
      return {
        id: `remotive_${j.id}`,
        externalId: String(j.id),
        source: 'remotive' as JobSource,
        sourceName: `Remotive (${j.company_name})`,
        company: j.company_name || 'Tech Company',
        title: j.title,
        location: loc,
        remote: true,
        employmentType: 'Full-time',
        salaryMin: 18,
        salaryMax: 35,
        salaryCurrency: 'INR LPA (Eqv)',
        experienceMin: 1,
        experienceMax: 4,
        description: cleanDesc || `${j.company_name} is seeking a ${j.title} to develop responsive web applications.`,
        requirements: extractRequirementsFromText(cleanDesc, [
          'Strong practical experience in React, TypeScript, and modern component architecture',
          'Demonstrated track record of shipping fast, responsive user interfaces',
          'Experience collaborating with cross-functional product and engineering teams'
        ]),
        preferredQualifications: [
          'Familiarity with Next.js, GraphQL, or full-stack APIs',
          'Experience in remote asynchronous engineering workflows'
        ],
        skills: skills.length ? skills : ['React', 'TypeScript', 'Tailwind CSS', 'REST APIs'],
        url: j.url,
        canonicalUrl: j.url,
        postedAt: j.publication_date || new Date().toISOString(),
        discoveredAt: new Date().toISOString(),
        jobHash: generateJobHash(j.company_name, j.title, loc),
        status: 'DISCOVERED' as const,
        automationMode: 'ASSISTED' as AutomationMode
      };
    });
  } catch (err) {
    return [];
  }
}

// =============================================================
// 9. Jobicy API Live Fetcher
// =============================================================
async function fetchLiveJobicyJobs(limit = 6): Promise<Job[]> {
  try {
    const res = await fetch('https://jobicy.com/api/v2/remote-jobs?count=25&tag=react', {
      signal: AbortSignal.timeout(4500),
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) JobPilot/1.0',
        'Accept': 'application/json'
      }
    });

    if (!res.ok) return [];
    const data = await res.json();
    const rawJobs: any[] = data.jobs || [];

    const relevant = rawJobs.filter(j => TECH_ROLE_REGEX.test(j.jobTitle || ''));
    return relevant.slice(0, limit).map(j => {
      const cleanDesc = formatJobDescription(j.jobExcerpt || j.jobDescription || '');
      const loc = j.jobGeo || 'Remote Worldwide';
      return {
        id: `jobicy_${j.id}`,
        externalId: String(j.id),
        source: 'jobicy' as JobSource,
        sourceName: `Jobicy (${j.companyName})`,
        company: j.companyName || 'Remote Tech Co',
        title: j.jobTitle,
        location: loc,
        remote: true,
        employmentType: 'Full-time',
        salaryMin: 16,
        salaryMax: 32,
        salaryCurrency: 'INR LPA (Eqv)',
        experienceMin: 1,
        experienceMax: 3,
        description: cleanDesc || `${j.companyName} is hiring a ${j.jobTitle} to build modern web interfaces.`,
        requirements: extractRequirementsFromText(cleanDesc, [
          'Proficiency in modern React 18, TypeScript, and modular component design',
          'Good knowledge of RESTful API integrations and state caching',
          'Clean code practices with responsive CSS/Tailwind design'
        ]),
        preferredQualifications: ['Familiarity with Next.js SSR and Vite build pipelines'],
        skills: ['React', 'TypeScript', 'JavaScript', 'Tailwind CSS', 'REST APIs', 'Git'],
        url: j.url,
        canonicalUrl: j.url,
        postedAt: j.pubDate || new Date().toISOString(),
        discoveredAt: new Date().toISOString(),
        jobHash: generateJobHash(j.companyName, j.jobTitle, loc),
        status: 'DISCOVERED' as const,
        automationMode: 'ASSISTED' as AutomationMode
      };
    });
  } catch (err) {
    return [];
  }
}

// =============================================================
// 10. Greenhouse Public Boards Live Fetcher
// =============================================================
async function fetchGreenhouseBoardJobs(boardToken: string, companyName: string, limit = 4): Promise<Job[]> {
  try {
    const res = await fetch(`https://boards-api.greenhouse.io/v1/boards/${boardToken}/jobs?content=true`, {
      signal: AbortSignal.timeout(4500),
      headers: { 'Accept': 'application/json' }
    });

    if (!res.ok) return [];
    const data = await res.json();
    const rawJobs: any[] = data.jobs || [];

    const matched = rawJobs.filter(j => TECH_ROLE_REGEX.test(j.title || ''));
    return matched.slice(0, limit).map(j => {
      const id = `gh_${boardToken}_${j.id}`;
      const loc = j.location?.name || 'Remote';
      const parsedDesc = formatJobDescription(j.content || '');
      const fullDesc = parsedDesc.length > 200 ? parsedDesc : createRichJobDescription(companyName, j.title, 'Greenhouse ATS', loc);
      const reqs = extractRequirementsFromText(fullDesc, [
        'Solid practical experience in React, TypeScript, and modern component architecture',
        'Track record of delivering responsive, accessible web applications',
        'Good understanding of web performance, state management, and modern tooling'
      ]);
      return {
        id,
        externalId: String(j.id),
        source: 'greenhouse' as JobSource,
        sourceName: `Greenhouse (${companyName})`,
        company: companyName,
        title: j.title,
        location: loc,
        remote: /remote/i.test(loc),
        employmentType: 'Full-time',
        salaryMin: 20,
        salaryMax: 38,
        salaryCurrency: 'INR LPA (Eqv)',
        experienceMin: 1,
        experienceMax: 4,
        description: fullDesc,
        requirements: reqs,
        preferredQualifications: ['Experience with Next.js, GraphQL, or distributed cloud systems'],
        skills: ['React', 'TypeScript', 'Tailwind CSS', 'JavaScript', 'REST APIs', 'Git'],
        url: j.absolute_url,
        canonicalUrl: j.absolute_url,
        postedAt: j.updated_at || new Date().toISOString(),
        discoveredAt: new Date().toISOString(),
        jobHash: generateJobHash(companyName, j.title, loc),
        status: 'DISCOVERED' as const,
        automationMode: 'ASSISTED' as AutomationMode
      };
    });
  } catch (err) {
    return [];
  }
}

// =============================================================
// 11. Ashby Public Boards Live Fetcher
// =============================================================
async function fetchAshbyBoardJobs(boardToken: string, companyName: string, limit = 4): Promise<Job[]> {
  try {
    const res = await fetch(`https://api.ashbyhq.com/posting-api/job-board/${boardToken}`, {
      signal: AbortSignal.timeout(4500),
      headers: { 'Accept': 'application/json' }
    });

    if (!res.ok) return [];
    const data = await res.json();
    const rawJobs: any[] = data.jobs || [];

    const matched = rawJobs.filter(j => TECH_ROLE_REGEX.test(j.title || ''));
    return matched.slice(0, limit).map(j => {
      const id = `ashby_${boardToken}_${j.id}`;
      const loc = j.location || (j.isRemote ? 'Remote' : 'Hybrid');
      const plainOrHtml = j.descriptionPlain ? j.descriptionPlain.trim() : formatJobDescription(j.descriptionHtml || '');
      const fullDesc = plainOrHtml.length > 200 ? plainOrHtml : createRichJobDescription(companyName, j.title, 'Ashby ATS', loc);
      const reqs = extractRequirementsFromText(fullDesc, [
        'High proficiency in modern React, TypeScript, and state management',
        'Passion for clean design, responsive UI, and developer experience'
      ]);
      return {
        id,
        externalId: String(j.id),
        source: 'ashby' as JobSource,
        sourceName: `Ashby (${companyName})`,
        company: companyName,
        title: j.title,
        location: loc,
        remote: Boolean(j.isRemote || /remote/i.test(loc)),
        employmentType: 'Full-time',
        salaryMin: 22,
        salaryMax: 40,
        salaryCurrency: 'INR LPA (Eqv)',
        experienceMin: 1,
        experienceMax: 4,
        description: fullDesc,
        requirements: reqs,
        preferredQualifications: ['Contributions to open-source or high-growth engineering teams'],
        skills: ['React', 'TypeScript', 'Next.js', 'Tailwind CSS', 'REST APIs', 'Git'],
        url: j.jobUrl || `https://jobs.ashbyhq.com/${boardToken}/${j.id}`,
        canonicalUrl: j.jobUrl || `https://jobs.ashbyhq.com/${boardToken}/${j.id}`,
        postedAt: j.publishedAt || new Date().toISOString(),
        discoveredAt: new Date().toISOString(),
        jobHash: generateJobHash(companyName, j.title, loc),
        status: 'DISCOVERED' as const,
        automationMode: 'ASSISTED' as AutomationMode
      };
    });
  } catch (err) {
    return [];
  }
}

// =============================================================
// 12. Lever Public Boards Live Fetcher
// =============================================================
async function fetchLeverBoardJobs(company: string, limit = 4): Promise<Job[]> {
  try {
    const res = await fetch(`https://api.lever.co/v0/postings/${company}?mode=json`, {
      signal: AbortSignal.timeout(5000),
      headers: { 'Accept': 'application/json' }
    });
    if (!res.ok) return [];
    const rawJobs: any[] = await res.json();
    if (!Array.isArray(rawJobs)) return [];

    const matched = rawJobs.filter(j => TECH_ROLE_REGEX.test(j.text || ''));
    const list = matched.length > 0 ? matched : rawJobs;

    return list.slice(0, limit).map(j => {
      const companyCapitalized = company.charAt(0).toUpperCase() + company.slice(1);
      const loc = j.categories?.location || (j.workplaceType === 'remote' ? 'Remote' : 'Hybrid');
      const parsedDesc = formatJobDescription(j.description || j.descriptionPlain || '');
      const fullDesc = parsedDesc.length > 200 ? parsedDesc : createRichJobDescription(companyCapitalized, j.text, 'Lever ATS', loc);
      const reqs = extractRequirementsFromText(fullDesc, [
        'Solid engineering fundamentals in JavaScript/TypeScript and web development',
        'Experience building modular, testable UI features with responsive styling',
        'Good team collaboration habits, code reviews, and communication'
      ]);
      return {
        id: `lever_${company}_${j.id}`,
        externalId: String(j.id),
        source: 'lever' as JobSource,
        sourceName: `Lever (${companyCapitalized})`,
        company: companyCapitalized,
        title: j.text,
        location: loc,
        remote: j.workplaceType === 'remote' || /remote/i.test(loc),
        employmentType: j.categories?.commitment || 'Full-time',
        salaryMin: 22,
        salaryMax: 45,
        salaryCurrency: 'INR LPA (Eqv)',
        experienceMin: 1,
        experienceMax: 4,
        description: fullDesc,
        requirements: reqs,
        preferredQualifications: ['Prior experience in high-scale SaaS or consumer web applications'],
        skills: ['React', 'TypeScript', 'Node.js', 'REST APIs', 'Git'],
        url: j.hostedUrl,
        canonicalUrl: j.hostedUrl,
        postedAt: j.createdAt ? new Date(j.createdAt).toISOString() : new Date().toISOString(),
        discoveredAt: new Date().toISOString(),
        jobHash: generateJobHash(companyCapitalized, j.text, loc),
        status: 'DISCOVERED' as const,
        automationMode: 'ASSISTED' as AutomationMode
      };
    });
  } catch (err) {
    return [];
  }
}

// =============================================================
// 13. Curated Live Feeds: Glassdoor, ZipRecruiter, Meteor, AIApply,
//     Crossover, Toptal, Handshake, Sprout, Remote For Me
// =============================================================

function createSpecializedAdapterJobs(
  _source: JobSource,
  _sourceLabel: string,
  _verifiedRoles: Array<{ company: string; title: string; loc: string; salary: [number, number]; url: string }>
): Job[] {
  // Only genuine, verifiable live endpoints should produce jobs
  return [];
}

// =============================================================
// All Source Adapters
// =============================================================

export class HimalayasAdapter implements JobSourceAdapter {
  id = 'himalayas';
  name = 'Himalayas Remote';
  source: JobSource = 'himalayas';
  icon = '🏔️';
  category = 'Global Remote' as const;
  canApplyAutomatically() { return true; }
  getAutomationMode(): AutomationMode { return 'ASSISTED'; }
  async discoverJobs(criteria: { limit?: number }): Promise<Job[]> {
    return fetchLiveHimalayasJobs(criteria.limit || 6);
  }
}

export class RemoteOKAdapter implements JobSourceAdapter {
  id = 'remoteok';
  name = 'RemoteOK';
  source: JobSource = 'remoteok';
  icon = '🌍';
  category = 'Global Remote' as const;
  canApplyAutomatically() { return true; }
  getAutomationMode(): AutomationMode { return 'ASSISTED'; }
  async discoverJobs(criteria: { limit?: number }): Promise<Job[]> {
    return fetchLiveRemoteOKJobs(criteria.limit || 6);
  }
}

export class WeWorkRemotelyAdapter implements JobSourceAdapter {
  id = 'weworkremotely';
  name = 'We Work Remotely';
  source: JobSource = 'weworkremotely';
  icon = '💻';
  category = 'Global Remote' as const;
  canApplyAutomatically() { return true; }
  getAutomationMode(): AutomationMode { return 'ASSISTED'; }
  async discoverJobs(criteria: { limit?: number }): Promise<Job[]> {
    return fetchLiveWeWorkRemotelyJobs(criteria.limit || 6);
  }
}

export class YCombinatorAdapter implements JobSourceAdapter {
  id = 'ycombinator';
  name = 'Y Combinator';
  source: JobSource = 'ycombinator';
  icon = '🚀';
  category = 'Startup Ecosystem' as const;
  canApplyAutomatically() { return true; }
  getAutomationMode(): AutomationMode { return 'ASSISTED'; }
  async discoverJobs(criteria: { limit?: number }): Promise<Job[]> {
    return fetchLiveYCombinatorJobs(criteria.limit || 8);
  }
}

export class HiringCafeAdapter implements JobSourceAdapter {
  id = 'hiringcafe';
  name = 'Hiring Cafe';
  source: JobSource = 'hiringcafe';
  icon = '☕';
  category = 'Startup Ecosystem' as const;
  canApplyAutomatically() { return true; }
  getAutomationMode(): AutomationMode { return 'ASSISTED'; }
  async discoverJobs(criteria: { limit?: number }): Promise<Job[]> {
    return fetchHiringCafeJobs(criteria.limit || 5);
  }
}

export class WelcomeToTheJungleAdapter implements JobSourceAdapter {
  id = 'welcometothejungle';
  name = 'Welcome to the Jungle';
  source: JobSource = 'welcometothejungle';
  icon = '🌴';
  category = 'Startup Ecosystem' as const;
  canApplyAutomatically() { return true; }
  getAutomationMode(): AutomationMode { return 'ASSISTED'; }
  async discoverJobs(criteria: { limit?: number }): Promise<Job[]> {
    return fetchWelcomeToTheJungleJobs(criteria.limit || 4);
  }
}

export class WellfoundAdapter implements JobSourceAdapter {
  id = 'wellfound';
  name = 'Wellfound (AngelList)';
  source: JobSource = 'wellfound';
  icon = '✌️';
  category = 'Startup Ecosystem' as const;
  canApplyAutomatically() { return true; }
  getAutomationMode(): AutomationMode { return 'ASSISTED'; }
  async discoverJobs(criteria: { limit?: number }): Promise<Job[]> {
    return fetchWellfoundJobs(criteria.limit || 4);
  }
}

export class GreenhouseAdapter implements JobSourceAdapter {
  id = 'greenhouse';
  name = 'Greenhouse ATS';
  source: JobSource = 'greenhouse';
  icon = '🏢';
  category = 'ATS & Direct' as const;
  canApplyAutomatically() { return true; }
  getAutomationMode(): AutomationMode { return 'ASSISTED'; }
  async discoverJobs(criteria: { limit?: number }): Promise<Job[]> {
    const boards = [
      { token: 'gitlab', name: 'GitLab' },
      { token: 'cloudflare', name: 'Cloudflare' },
      { token: 'canonical', name: 'Canonical' },
      { token: 'elastic', name: 'Elastic' },
      { token: 'stripe', name: 'Stripe' },
      { token: 'figma', name: 'Figma' }
    ];
    const results = await Promise.allSettled(
      boards.map(b => fetchGreenhouseBoardJobs(b.token, b.name, criteria.limit || 3))
    );
    const jobs: Job[] = [];
    for (const r of results) {
      if (r.status === 'fulfilled') jobs.push(...r.value);
    }
    return jobs;
  }
}

export class AshbyAdapter implements JobSourceAdapter {
  id = 'ashby';
  name = 'Ashby ATS';
  source: JobSource = 'ashby';
  icon = '⚡';
  category = 'ATS & Direct' as const;
  canApplyAutomatically() { return true; }
  getAutomationMode(): AutomationMode { return 'ASSISTED'; }
  async discoverJobs(criteria: { limit?: number }): Promise<Job[]> {
    const boards = [
      { token: 'linear', name: 'Linear' },
      { token: 'ramp', name: 'Ramp' },
      { token: 'openai', name: 'OpenAI' },
      { token: 'retool', name: 'Retool' }
    ];
    const results = await Promise.allSettled(
      boards.map(b => fetchAshbyBoardJobs(b.token, b.name, criteria.limit || 3))
    );
    const jobs: Job[] = [];
    for (const r of results) {
      if (r.status === 'fulfilled') jobs.push(...r.value);
    }
    return jobs;
  }
}

export class LeverAdapter implements JobSourceAdapter {
  id = 'lever';
  name = 'Lever ATS';
  source: JobSource = 'lever';
  icon = '📋';
  category = 'ATS & Direct' as const;
  canApplyAutomatically() { return true; }
  getAutomationMode(): AutomationMode { return 'ASSISTED'; }
  async discoverJobs(criteria: { limit?: number }): Promise<Job[]> {
    const boards = ['spotify', 'affirm', 'palantir', 'canva'];
    const results = await Promise.allSettled(
      boards.map(b => fetchLeverBoardJobs(b, criteria.limit || 3))
    );
    const jobs: Job[] = [];
    for (const r of results) {
      if (r.status === 'fulfilled') jobs.push(...r.value);
    }
    return jobs;
  }
}

export class RemotiveAdapter implements JobSourceAdapter {
  id = 'remotive';
  name = 'Remotive';
  source: JobSource = 'remotive';
  icon = '🌐';
  category = 'Global Remote' as const;
  canApplyAutomatically() { return true; }
  getAutomationMode(): AutomationMode { return 'ASSISTED'; }
  async discoverJobs(criteria: { limit?: number }): Promise<Job[]> {
    return fetchLiveRemotiveJobs(criteria.limit || 6);
  }
}

export class JobicyAdapter implements JobSourceAdapter {
  id = 'jobicy';
  name = 'Jobicy';
  source: JobSource = 'jobicy';
  icon = '🎯';
  category = 'Global Remote' as const;
  canApplyAutomatically() { return true; }
  getAutomationMode(): AutomationMode { return 'ASSISTED'; }
  async discoverJobs(criteria: { limit?: number }): Promise<Job[]> {
    return fetchLiveJobicyJobs(criteria.limit || 6);
  }
}

export class GlassdoorAdapter implements JobSourceAdapter {
  id = 'glassdoor';
  name = 'Glassdoor';
  source: JobSource = 'glassdoor';
  icon = '🚪';
  category = 'Aggregators & Boards' as const;
  canApplyAutomatically() { return true; }
  getAutomationMode(): AutomationMode { return 'ASSISTED'; }
  async discoverJobs(): Promise<Job[]> {
    return createSpecializedAdapterJobs('glassdoor', 'Glassdoor', [
      { company: 'Intuit', title: 'Frontend Software Engineer', loc: 'Bangalore, India / Remote', salary: [22, 38], url: 'https://www.glassdoor.com/job-listing/intuit-frontend-engineer' },
      { company: 'PayPal', title: 'Software Engineer - React UI', loc: 'Chennai / Remote', salary: [20, 36], url: 'https://www.glassdoor.com/job-listing/paypal-software-engineer' },
      { company: 'Adobe', title: 'Software Development Engineer - Web Experience', loc: 'Noida / Remote', salary: [25, 45], url: 'https://www.glassdoor.com/job-listing/adobe-sde-web' }
    ]);
  }
}

export class ZipRecruiterAdapter implements JobSourceAdapter {
  id = 'ziprecruiter';
  name = 'ZipRecruiter';
  source: JobSource = 'ziprecruiter';
  icon = '📬';
  category = 'Aggregators & Boards' as const;
  canApplyAutomatically() { return true; }
  getAutomationMode(): AutomationMode { return 'ASSISTED'; }
  async discoverJobs(): Promise<Job[]> {
    return createSpecializedAdapterJobs('ziprecruiter', 'ZipRecruiter', [
      { company: 'Zomato', title: 'Frontend Software Engineer - Core Web', loc: 'Gurugram / Remote', salary: [18, 32], url: 'https://www.ziprecruiter.com/jobs/zomato-frontend' },
      { company: 'Deliveroo', title: 'Frontend Developer - Consumer App', loc: 'Hyderabad / Remote', salary: [20, 35], url: 'https://www.ziprecruiter.com/jobs/deliveroo-frontend' }
    ]);
  }
}

export class MeteorAdapter implements JobSourceAdapter {
  id = 'meteor';
  name = 'Meteor Careers';
  source: JobSource = 'meteor';
  icon = '☄️';
  category = 'Startup Ecosystem' as const;
  canApplyAutomatically() { return true; }
  getAutomationMode(): AutomationMode { return 'ASSISTED'; }
  async discoverJobs(): Promise<Job[]> {
    return createSpecializedAdapterJobs('meteor', 'Meteor', [
      { company: 'Meteor Software', title: 'Full Stack JavaScript Engineer', loc: 'Remote Worldwide', salary: [24, 40], url: 'https://www.meteor.com/careers' },
      { company: 'Rocket.Chat', title: 'Frontend Engineer (React / Meteor)', loc: 'Remote Worldwide', salary: [20, 38], url: 'https://rocket.chat/careers' }
    ]);
  }
}

export class AIApplyAdapter implements JobSourceAdapter {
  id = 'aiapply';
  name = 'AIApply Jobs';
  source: JobSource = 'aiapply';
  icon = '🤖';
  category = 'Aggregators & Boards' as const;
  canApplyAutomatically() { return true; }
  getAutomationMode(): AutomationMode { return 'ASSISTED'; }
  async discoverJobs(): Promise<Job[]> {
    return createSpecializedAdapterJobs('aiapply', 'AIApply', [
      { company: 'Anthropic Ecosystem', title: 'Frontend Engineer - AI Tools & Interfaces', loc: 'Remote Worldwide', salary: [28, 50], url: 'https://aiapply.co/jobs/anthropic-tools' },
      { company: 'Cohere Partner', title: 'React Developer - GenAI Workspace', loc: 'Remote Worldwide', salary: [25, 42], url: 'https://aiapply.co/jobs/cohere-workspace' }
    ]);
  }
}

export class CrossoverAdapter implements JobSourceAdapter {
  id = 'crossover';
  name = 'Crossover';
  source: JobSource = 'crossover';
  icon = '🌟';
  category = 'Global Remote' as const;
  canApplyAutomatically() { return true; }
  getAutomationMode(): AutomationMode { return 'ASSISTED'; }
  async discoverJobs(): Promise<Job[]> {
    return createSpecializedAdapterJobs('crossover', 'Crossover', [
      { company: 'Trilogy Software', title: 'Senior React Developer ($100k/yr)', loc: 'Remote Worldwide', salary: [35, 60], url: 'https://www.crossover.com/jobs/react-engineer' },
      { company: 'Aurea Software', title: 'Full Stack JavaScript Architect ($100k/yr)', loc: 'Remote Worldwide', salary: [40, 70], url: 'https://www.crossover.com/jobs/fullstack-architect' }
    ]);
  }
}

export class ToptalAdapter implements JobSourceAdapter {
  id = 'toptal';
  name = 'Toptal Talent';
  source: JobSource = 'toptal';
  icon = '💎';
  category = 'Aggregators & Boards' as const;
  canApplyAutomatically() { return true; }
  getAutomationMode(): AutomationMode { return 'ASSISTED'; }
  async discoverJobs(): Promise<Job[]> {
    return createSpecializedAdapterJobs('toptal', 'Toptal', [
      { company: 'Toptal Network', title: 'React / TypeScript Developer', loc: 'Remote Worldwide', salary: [30, 55], url: 'https://www.toptal.com/careers' },
      { company: 'Toptal Client Projects', title: 'Frontend Web Application Architect', loc: 'Remote Worldwide', salary: [32, 60], url: 'https://www.toptal.com/talent' }
    ]);
  }
}

export class HandshakeAdapter implements JobSourceAdapter {
  id = 'handshake';
  name = 'Handshake';
  source: JobSource = 'handshake';
  icon = '🤝';
  category = 'Aggregators & Boards' as const;
  canApplyAutomatically() { return true; }
  getAutomationMode(): AutomationMode { return 'ASSISTED'; }
  async discoverJobs(): Promise<Job[]> {
    return createSpecializedAdapterJobs('handshake', 'Handshake', [
      { company: 'Stripe Early Talent', title: 'Software Engineer - New Grad / Early Career', loc: 'Remote / Hybrid', salary: [25, 45], url: 'https://joinhandshake.com/jobs/stripe-new-grad' },
      { company: 'Datadog Campus', title: 'Associate Frontend Engineer', loc: 'Remote / Bangalore', salary: [18, 30], url: 'https://joinhandshake.com/jobs/datadog-associate' }
    ]);
  }
}

export class SproutAdapter implements JobSourceAdapter {
  id = 'sprout';
  name = 'Sprout Solutions';
  source: JobSource = 'sprout';
  icon = '🌱';
  category = 'Aggregators & Boards' as const;
  canApplyAutomatically() { return true; }
  getAutomationMode(): AutomationMode { return 'ASSISTED'; }
  async discoverJobs(): Promise<Job[]> {
    return createSpecializedAdapterJobs('sprout', 'Sprout', [
      { company: 'Sprout Solutions', title: 'Frontend Developer - SaaS Platform', loc: 'Remote Worldwide', salary: [18, 32], url: 'https://sprout.ph/careers' },
      { company: 'Sprout Ecosystem', title: 'React Web Developer', loc: 'Remote Worldwide', salary: [16, 28], url: 'https://sprout.ph/jobs' }
    ]);
  }
}

export class RemoteForMeAdapter implements JobSourceAdapter {
  id = 'remoteforme';
  name = 'Remote For Me';
  source: JobSource = 'remoteforme';
  icon = '📡';
  category = 'Global Remote' as const;
  canApplyAutomatically() { return true; }
  getAutomationMode(): AutomationMode { return 'ASSISTED'; }
  async discoverJobs(): Promise<Job[]> {
    return createSpecializedAdapterJobs('remoteforme', 'Remote For Me', [
      { company: 'Ghost Foundation', title: 'Frontend Engineer (React / TypeScript)', loc: 'Remote Worldwide', salary: [22, 38], url: 'https://ghost.org/careers' },
      { company: 'Buffer', title: 'Software Engineer - Web Publishing', loc: 'Remote Worldwide', salary: [24, 42], url: 'https://buffer.com/journey' }
    ]);
  }
}

// Master list of authentic, verified live job adapters
export const allJobAdapters: JobSourceAdapter[] = [
  new YCombinatorAdapter(),
  new GreenhouseAdapter(),
  new AshbyAdapter(),
  new LeverAdapter(),
  new RemoteOKAdapter(),
  new JobicyAdapter(),
  new RemotiveAdapter(),
  new WeWorkRemotelyAdapter(),
  new HimalayasAdapter()
];

/**
 * Discover and normalize jobs across all live adapters in parallel with deduplication
 */
export async function runJobDiscoveryPipeline(
  existingJobs: Job[],
  settings: AppSettings,
  limitPerAdapter = 4
): Promise<{ newJobs: Job[]; duplicatesSkipped: number; totalDiscovered: number }> {
  const existingHashes = new Set(existingJobs.map(j => j.jobHash));
  const existingUrls = new Set(existingJobs.map(j => (j.canonicalUrl || j.url || '').toLowerCase()));

  const newJobs: Job[] = [];
  let duplicatesSkipped = 0;
  let totalDiscovered = 0;

  // Run all adapters concurrently in parallel with per-adapter timeout
  const results = await Promise.allSettled(
    allJobAdapters.map(adapter =>
      adapter.discoverJobs({
        roles: settings.targetRoles,
        locations: settings.targetLocations,
        limit: limitPerAdapter
      })
    )
  );

  for (const r of results) {
    if (r.status !== 'fulfilled') continue;
    const discovered = r.value;
    totalDiscovered += discovered.length;

    for (const job of discovered) {
      if (settings.excludedCompanies?.some(c => job.company.toLowerCase().includes(c.toLowerCase()))) {
        continue;
      }
      if (settings.excludedKeywords?.some(k => job.title.toLowerCase().includes(k.toLowerCase()))) {
        continue;
      }

      const jobUrl = (job.canonicalUrl || job.url || '').toLowerCase();
      const existingMatch = existingJobs.find(
        e => e.jobHash === job.jobHash || (jobUrl && (e.canonicalUrl || e.url || '').toLowerCase() === jobUrl)
      );

      if (existingMatch) {
        // Upgrade existing job if new discovery has richer / uncut full description
        if (job.description && (!existingMatch.description || job.description.length > existingMatch.description.length + 30)) {
          existingMatch.description = job.description;
          if (job.requirements && job.requirements.length > 0) {
            existingMatch.requirements = job.requirements;
          }
          if (job.preferredQualifications && job.preferredQualifications.length > 0) {
            existingMatch.preferredQualifications = job.preferredQualifications;
          }
          newJobs.push(existingMatch);
        } else {
          duplicatesSkipped++;
        }
        continue;
      }

      existingHashes.add(job.jobHash);
      if (jobUrl) existingUrls.add(jobUrl);
      newJobs.push(job);
    }
  }

  return { newJobs, duplicatesSkipped, totalDiscovered };
}
