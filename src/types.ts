export type JobSource = 
  | 'greenhouse' 
  | 'lever' 
  | 'ashby'
  | 'hiringcafe'
  | 'welcometothejungle'
  | 'himalayas'
  | 'ycombinator'
  | 'wellfound' 
  | 'remoteok'
  | 'weworkremotely'
  | 'remotive'
  | 'jobicy'
  | 'remoteforme'
  | 'glassdoor'
  | 'ziprecruiter'
  | 'meteor'
  | 'aiapply'
  | 'crossover'
  | 'toptal'
  | 'handshake'
  | 'sprout'
  | 'cutshort'
  | 'instahyre'
  | 'naukri' 
  | 'indeed' 
  | 'linkedin_manual' 
  | 'company';

export type JobStatus =
  | 'DISCOVERED'
  | 'ANALYZING'
  | 'SHORTLISTED'
  | 'RESUME_GENERATED'
  | 'READY_TO_APPLY'
  | 'HUMAN_REVIEW'
  | 'APPLIED'
  | 'INTERVIEW'
  | 'REJECTED_APPLICATION'
  | 'WITHDRAWN'
  | 'SKIPPED';

export type AutomationMode = 'AUTOMATIC' | 'ASSISTED' | 'MANUAL';

export type QuestionCategory = 'SAFE_AUTOFILL' | 'AI_DRAFT' | 'USER_REQUIRED' | 'UNKNOWN';

export interface SkillItem {
  id: string;
  name: string;
  category: 'Frontend' | 'Backend' | 'Databases' | 'Database' | 'DevOps' | 'Languages' | 'Tools' | 'AI and LLM' | 'Cloud and Tools' | 'Data Viz & Geo' | 'Other Tools' | 'Soft Skills' | string;
  proficiency: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';
  yearsExperience: number;
  verified: boolean;
}

export interface ProjectItem {
  id: string;
  name: string;
  role: string;
  description: string;
  technologies: string[];
  achievements: string[];
  githubUrl?: string;
  liveUrl?: string;
  featured?: boolean;
}

export interface ExperienceItem {
  id: string;
  company: string;
  role: string;
  location: string;
  employmentType: 'Full-time' | 'Internship' | 'Contract' | 'Part-time';
  startDate: string;
  endDate: string; // 'Present' or date
  current: boolean;
  responsibilities: string[];
  technologies: string[];
  metrics?: string[];
}

export interface EducationItem {
  id: string;
  institution: string;
  degree: string;
  field: string;
  startYear: string;
  endYear: string;
  grade?: string;
}

export interface ProjectDoc {
  id: string;
  title: string;
  category: 'Work Experience' | 'Personal Project' | 'Open Source' | 'Other';
  companyOrContext?: string; // e.g. "SidLabs LLP"
  role: string;
  technologies: string[];
  summary: string;
  problemSolved: string;
  architectureOverview: string;
  keyAchievements: string[]; // with metrics
  bulletPointsPool: string[]; // ready-to-use bullet points
  fullMarkdown?: string;
  liveUrl?: string;
  demoUrl?: string;
  githubUrl?: string;
  updatedAt: string;
}

export interface UserProfile {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  location: string;
  linkedinUrl: string;
  githubUrl: string;
  portfolioUrl: string;
  currentRole: string;
  yearsOfExperience: number;
  education: EducationItem[];
  skills: SkillItem[];
  projects: ProjectItem[];
  projectDocs?: ProjectDoc[];
  experience: ExperienceItem[];
  targetRoles: string[];
  preferredLocations: string[];
  remotePreference: 'Remote Only' | 'Hybrid' | 'On-site' | 'Any';
  minimumSalary: number; // e.g. in LPA or USD
  preferredSalary: number;
  noticePeriod: string; // e.g. "Immediate", "15 days", "1 month"
  workAuthorization: string; // e.g. "Authorized to work in India", "US Citizen", etc.
  requiresSponsorship: boolean;
  summary: string;
  customBio?: string;
}

export interface JobAnalysisResult {
  overallScore: number;
  technicalSkillScore: number;
  experienceScore: number;
  educationScore: number;
  locationScore: number;
  roleScore: number;
  salaryScore: number;
  matchedSkills: string[];
  missingSkills: string[];
  requiredSkills: string[];
  preferredSkills: string[];
  strongMatches: string[];
  concerns: string[];
  recommendation: 'APPLY' | 'REVIEW' | 'SKIP';
  reasoning: string;
  analyzedAt: string;
}

export interface TailoredResume {
  id: string;
  versionId: string;
  jobId: string;
  tailoredSummary: string;
  orderedSkills: {
    category: string;
    skills: string[];
  }[];
  targetedExperiences: {
    experienceId: string;
    company: string;
    role: string;
    duration: string;
    highlightedResponsibilities: string[];
    emphasizedTech: string[];
  }[];
  selectedProjects: {
    projectId: string;
    name: string;
    role: string;
    highlightDescription: string;
    technologies: string[];
    relevantBullets: string[];
  }[];
  atsMatchScore: number;
  keywordsPresent: string[];
  validatedFactual: boolean;
  generatedAt: string;
  latexCode?: string;
  selectedProjectTitles?: string[];
}

export interface CoverLetter {
  id: string;
  jobId: string;
  company: string;
  role: string;
  subject: string;
  content: string;
  wordCount: number;
  generatedAt: string;
}

export interface ApplicationQuestion {
  id: string;
  question: string;
  category: QuestionCategory;
  suggestedAnswer: string;
  confidence: number;
  requiresUserApproval: boolean;
  fieldType: 'text' | 'textarea' | 'select' | 'radio' | 'file' | 'date';
  options?: string[];
  userAnswer?: string;
  notes?: string;
}

export interface ApplicationRecord {
  id: string;
  jobId: string;
  status: JobStatus;
  appliedAt?: string;
  interviewDate?: string;
  followUpDate?: string;
  rejectionDate?: string;
  offerDate?: string;
  applicationUrl?: string;
  resumeVersionId?: string;
  coverLetterId?: string;
  notes: string;
  submissionLog?: string[];
}

export interface Job {
  id: string;
  externalId: string;
  source: JobSource;
  sourceName: string;
  company: string;
  title: string;
  location: string;
  remote: boolean;
  employmentType: 'Full-time' | 'Contract' | 'Internship' | 'Part-time';
  salaryMin?: number;
  salaryMax?: number;
  salaryCurrency?: string;
  experienceMin: number;
  experienceMax: number;
  description: string;
  requirements: string[];
  preferredQualifications?: string[];
  skills: string[];
  url: string;
  canonicalUrl: string;
  postedAt: string;
  discoveredAt: string;
  jobHash: string;
  status: JobStatus;
  automationMode: AutomationMode;
  analysis?: JobAnalysisResult;
  tailoredResume?: TailoredResume;
  coverLetter?: CoverLetter;
  questions?: ApplicationQuestion[];
  applicationRecord?: ApplicationRecord;
}

export interface AgentExecutionRun {
  id: string;
  type: 'DISCOVER' | 'ANALYZE' | 'TAILOR' | 'PREPARE' | 'SYNC_EXCEL' | 'FULL_PIPELINE';
  startedAt: string;
  completedAt?: string;
  status: 'RUNNING' | 'COMPLETED' | 'FAILED' | 'PARTIAL';
  jobsProcessed: number;
  jobsSucceeded: number;
  jobsFailed: number;
  logs: string[];
  error?: string;
}

export interface AppSettings {
  targetRoles: string[];
  targetLocations: string[];
  minimumScoreThreshold: number; // e.g. 80
  dailyApplicationLimit: number; // e.g. 10
  dailyDiscoveryLimit: number; // e.g. 100
  dailyAnalysisLimit: number; // e.g. 50
  autoApplyMode: 'OFF' | 'ASSISTED_ONLY' | 'PERMITTED_AUTO';
  excludedCompanies: string[];
  excludedKeywords: string[];
  scoringWeights: {
    technicalSkills: number; // e.g. 40
    experience: number; // 20
    education: number; // 10
    location: number; // 10
    roleRelevance: number; // 10
    salary: number; // 5
    preferences: number; // 5
  };
  enableDemoMode: boolean;
  syncToExcelOnApply: boolean;
  telegramNotifications: boolean;
  telegramChatId?: string;
  staleJobRetentionDays: number; // auto-delete unacted jobs after N days (default: 20)
}
