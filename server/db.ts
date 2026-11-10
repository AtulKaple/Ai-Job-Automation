import 'dotenv/config';
import mongoose, { Schema, Document } from 'mongoose';
import fs from 'fs';
import path from 'path';
import { UserProfile, Job, AppSettings, AgentExecutionRun } from '../src/types';
import { defaultUserProfile, defaultSettings } from '../src/data/defaultProfile';
import { loadProjectDocsFromStorage } from './projectDocsLoader';

function getMongoUri(): string {
  return process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/jobpilot';
}

const STORAGE_DIR = path.join(process.cwd(), 'storage');

// Ensure storage directory exists
if (!fs.existsSync(STORAGE_DIR)) {
  fs.mkdirSync(STORAGE_DIR, { recursive: true });
}

// -------------------------------------------------------------
// MongoDB Mongoose Schemas
// -------------------------------------------------------------

const UserProfileSchema = new Schema({
  id: { type: String, required: true, unique: true },
  fullName: { type: String, required: true },
  email: { type: String, required: true },
  phone: String,
  location: String,
  linkedinUrl: String,
  githubUrl: String,
  portfolioUrl: String,
  currentRole: String,
  yearsOfExperience: Number,
  education: [Schema.Types.Mixed],
  skills: [Schema.Types.Mixed],
  projects: [Schema.Types.Mixed],
  projectDocs: [Schema.Types.Mixed],
  experience: [Schema.Types.Mixed],
  targetRoles: [String],
  preferredLocations: [String],
  remotePreference: String,
  minimumSalary: Number,
  preferredSalary: Number,
  noticePeriod: String,
  workAuthorization: String,
  requiresSponsorship: Boolean,
  summary: String,
  customBio: String
}, { timestamps: true });

const JobSchema = new Schema({
  id: { type: String, required: true, unique: true },
  externalId: String,
  source: String,
  sourceName: String,
  company: { type: String, required: true },
  title: { type: String, required: true },
  location: String,
  remote: Boolean,
  employmentType: String,
  salaryMin: Number,
  salaryMax: Number,
  salaryCurrency: String,
  experienceMin: Number,
  experienceMax: Number,
  description: String,
  requirements: [String],
  preferredQualifications: [String],
  skills: [String],
  url: String,
  canonicalUrl: String,
  postedAt: String,
  discoveredAt: String,
  jobHash: { type: String, index: true },
  status: { type: String, default: 'DISCOVERED', index: true },
  automationMode: { type: String, default: 'ASSISTED' },
  analysis: Schema.Types.Mixed,
  tailoredResume: Schema.Types.Mixed,
  coverLetter: Schema.Types.Mixed,
  questions: [Schema.Types.Mixed],
  applicationRecord: Schema.Types.Mixed
}, { timestamps: true });

const AppSettingsSchema = new Schema({
  targetRoles: [String],
  targetLocations: [String],
  minimumScoreThreshold: Number,
  dailyApplicationLimit: Number,
  dailyDiscoveryLimit: Number,
  dailyAnalysisLimit: Number,
  autoApplyMode: String,
  excludedCompanies: [String],
  excludedKeywords: [String],
  scoringWeights: Schema.Types.Mixed,
  enableDemoMode: Boolean,
  syncToExcelOnApply: Boolean,
  telegramNotifications: Boolean,
  telegramChatId: String,
  staleJobRetentionDays: Number
}, { timestamps: true });

const AgentExecutionRunSchema = new Schema({
  id: { type: String, required: true, unique: true },
  type: String,
  startedAt: String,
  completedAt: String,
  status: String,
  jobsProcessed: Number,
  jobsSucceeded: Number,
  jobsFailed: Number,
  logs: [String],
  error: String
}, { timestamps: true });

export const UserProfileModel = mongoose.model('UserProfile', UserProfileSchema);
export const JobModel = mongoose.model('Job', JobSchema);
export const AppSettingsModel = mongoose.model('AppSettings', AppSettingsSchema);
export const AgentExecutionRunModel = mongoose.model('AgentExecutionRun', AgentExecutionRunSchema);

// -------------------------------------------------------------
// Database Connection & Local Resilient Fallback Management
// -------------------------------------------------------------

let isMongoConnected = false;

// In-memory / JSON file fallback state
interface LocalStore {
  userProfile: UserProfile;
  appSettings: AppSettings;
  jobsStore: Job[];
  executionRuns: AgentExecutionRun[];
}

let localStore: LocalStore = {
  userProfile: { ...defaultUserProfile },
  appSettings: { ...defaultSettings },
  jobsStore: [],
  executionRuns: []
};

export async function connectDatabase(): Promise<boolean> {
  const mongoUri = getMongoUri();
  try {
    const maskedUri = mongoUri.replace(/:([^@]+)@/, ':****@');
    console.log(`[Database] Attempting connection to MongoDB at: ${maskedUri}...`);
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000,
    });
    isMongoConnected = true;
    console.log('✅ [Database] Successfully connected to MongoDB!');

    // Initialize user profile & settings in MongoDB if empty
    await seedMongoIfEmpty();
    return true;
  } catch (err: any) {
    isMongoConnected = false;
    console.warn(`⚠️ [Database] MongoDB connection failed (${err.message}).`);
    return false;
  }
}

async function seedMongoIfEmpty() {
  try {
    const storageDocs = loadProjectDocsFromStorage();
    if (storageDocs.length > 0) {
      localStore.userProfile.projectDocs = storageDocs;
    }

    const profileCount = await UserProfileModel.countDocuments();
    if (profileCount === 0) {
      await UserProfileModel.create(localStore.userProfile);
      console.log('[Database] Initialized default user profile in MongoDB.');
    } else {
      await UserProfileModel.findOneAndUpdate(
        {},
        { $set: localStore.userProfile },
        { upsert: true, returnDocument: 'after' }
      );
      console.log('[Database] Synchronized verified user profile to MongoDB.');
    }

    const settingsCount = await AppSettingsModel.countDocuments();
    if (settingsCount === 0) {
      await AppSettingsModel.create(localStore.appSettings);
      console.log('[Database] Initialized default app settings in MongoDB.');
    }
    // Do NOT automatically seed any jobs into MongoDB. If there are no jobs in database, show 0 jobs.
  } catch (e) {
    console.warn('[Database] Error while initializing profile/settings in MongoDB:', e);
  }
}

// -------------------------------------------------------------
// Unified Data Access Methods (MongoDB with seamless fallback)
// -------------------------------------------------------------

export async function getUserProfile(): Promise<UserProfile> {
  const storageDocs = loadProjectDocsFromStorage();
  if (isMongoConnected) {
    try {
      const doc = await UserProfileModel.findOne().lean();
      if (doc) {
        const profile = doc as unknown as UserProfile;
        if (storageDocs.length > 0) {
          profile.projectDocs = storageDocs;
        }
        return profile;
      }
    } catch (e) {
      console.warn('[Database] Error fetching user profile from Mongo, using fallback:', e);
    }
  }
  if (storageDocs.length > 0) {
    localStore.userProfile.projectDocs = storageDocs;
  }
  return localStore.userProfile;
}

export async function saveUserProfile(profile: Partial<UserProfile>): Promise<UserProfile> {
  localStore.userProfile = { ...localStore.userProfile, ...profile };

  if (isMongoConnected) {
    try {
      await UserProfileModel.findOneAndUpdate(
        { id: localStore.userProfile.id },
        { $set: localStore.userProfile },
        { upsert: true, returnDocument: 'after' }
      );
    } catch (e) {
      console.warn('[Database] Error saving profile to Mongo:', e);
    }
  }
  return localStore.userProfile;
}

export async function getAppSettings(): Promise<AppSettings> {
  if (isMongoConnected) {
    try {
      const doc = await AppSettingsModel.findOne().lean();
      if (doc) return doc as unknown as AppSettings;
    } catch (e) {
      console.warn('[Database] Error fetching settings from Mongo, using fallback:', e);
    }
  }
  return localStore.appSettings;
}

export async function saveAppSettings(settings: Partial<AppSettings>): Promise<AppSettings> {
  localStore.appSettings = { ...localStore.appSettings, ...settings };

  if (isMongoConnected) {
    try {
      await AppSettingsModel.findOneAndUpdate(
        {},
        { $set: localStore.appSettings },
        { upsert: true, returnDocument: 'after' }
      );
    } catch (e) {
      console.warn('[Database] Error saving settings to Mongo:', e);
    }
  }
  return localStore.appSettings;
}

export async function getJobs(): Promise<Job[]> {
  if (isMongoConnected) {
    try {
      const docs = await JobModel.find().sort({ discoveredAt: -1, postedAt: -1 }).lean();
      return (docs as unknown as Job[]).filter(j => !j.id.startsWith('seed_') && !j.id.startsWith('swiggy_') && !j.id.startsWith('groww_'));
    } catch (e) {
      console.warn('[Database] Error fetching jobs from Mongo:', e);
    }
  }
  return [...localStore.jobsStore]
    .filter(j => !j.id.startsWith('seed_') && !j.id.startsWith('swiggy_') && !j.id.startsWith('groww_'))
    .sort((a, b) => {
      const timeA = new Date(a.discoveredAt || a.postedAt || 0).getTime();
      const timeB = new Date(b.discoveredAt || b.postedAt || 0).getTime();
      return timeB - timeA;
    });
}

export async function getJobById(id: string): Promise<Job | null> {
  if (isMongoConnected) {
    try {
      const doc = await JobModel.findOne({ id }).lean();
      if (doc) return doc as unknown as Job;
    } catch (e) {
      console.warn('[Database] Error fetching job by id from Mongo:', e);
    }
  }
  return localStore.jobsStore.find(j => j.id === id) || null;
}

export async function saveJob(job: Job): Promise<Job> {
  const index = localStore.jobsStore.findIndex(j => j.id === job.id);
  if (index >= 0) {
    localStore.jobsStore[index] = job;
  } else {
    localStore.jobsStore.unshift(job);
  }

  if (isMongoConnected) {
    try {
      await JobModel.findOneAndUpdate(
        { id: job.id },
        { $set: job },
        { upsert: true, returnDocument: 'after' }
      );
    } catch (e) {
      console.warn('[Database] Error saving job to Mongo:', e);
    }
  }
  return job;
}

export async function saveJobsBatch(jobs: Job[]): Promise<void> {
  for (const job of jobs) {
    const idx = localStore.jobsStore.findIndex(j => j.id === job.id);
    if (idx >= 0) {
      localStore.jobsStore[idx] = job;
    } else {
      localStore.jobsStore.unshift(job);
    }
  }

  if (isMongoConnected) {
    try {
      const bulkOps = jobs.map(job => ({
        updateOne: {
          filter: { id: job.id },
          update: { $set: job },
          upsert: true
        }
      }));
      if (bulkOps.length > 0) {
        await JobModel.bulkWrite(bulkOps);
      }
    } catch (e) {
      console.warn('[Database] Error bulk saving jobs to Mongo:', e);
    }
  }
}

export async function deleteJobById(id: string): Promise<boolean> {
  localStore.jobsStore = localStore.jobsStore.filter(j => j.id !== id);

  if (isMongoConnected) {
    try {
      await JobModel.deleteOne({ id });
    } catch (e) {
      console.warn('[Database] Error deleting job from Mongo:', e);
    }
  }
  return true;
}

export async function getExecutionRuns(): Promise<AgentExecutionRun[]> {
  if (isMongoConnected) {
    try {
      const docs = await AgentExecutionRunModel.find().sort({ startedAt: -1 }).limit(20).lean();
      return docs as unknown as AgentExecutionRun[];
    } catch (e) {
      console.warn('[Database] Error fetching runs from Mongo:', e);
    }
  }
  return localStore.executionRuns;
}

export async function saveExecutionRun(run: AgentExecutionRun): Promise<AgentExecutionRun> {
  const index = localStore.executionRuns.findIndex(r => r.id === run.id);
  if (index >= 0) {
    localStore.executionRuns[index] = run;
  } else {
    localStore.executionRuns.unshift(run);
  }

  if (isMongoConnected) {
    try {
      await AgentExecutionRunModel.findOneAndUpdate(
        { id: run.id },
        { $set: run },
        { upsert: true, returnDocument: 'after' }
      );
    } catch (e) {
      console.warn('[Database] Error saving run to Mongo:', e);
    }
  }
  return run;
}

export async function pruneStaleJobs(retentionDays = 20): Promise<{ deletedCount: number; remainingCount: number }> {
  const cutoffTime = Date.now() - retentionDays * 24 * 60 * 60 * 1000;
  const cutoffDate = new Date(cutoffTime).toISOString();

  // In-memory / local fallback pruning (protects APPLIED, INTERVIEW, SHORTLISTED, RESUME_GENERATED, HUMAN_REVIEW)
  const initialCount = localStore.jobsStore.length;
  localStore.jobsStore = localStore.jobsStore.filter(job => {
    const isUnacted = job.status === 'DISCOVERED' || job.status === 'SKIPPED';
    const isStale = new Date(job.discoveredAt || job.postedAt).getTime() < cutoffTime;
    return !(isUnacted && isStale);
  });
  let deletedCount = initialCount - localStore.jobsStore.length;

  if (isMongoConnected) {
    try {
      const res = await JobModel.deleteMany({
        status: { $in: ['DISCOVERED', 'SKIPPED'] },
        discoveredAt: { $lt: cutoffDate }
      });
      if (res.deletedCount !== undefined && res.deletedCount > 0) {
        deletedCount = res.deletedCount;
      }
    } catch (e) {
      console.warn('[Database] Error pruning stale jobs from Mongo:', e);
    }
  }

  if (deletedCount > 0) {
    console.log(`🧹 [JobCleaner] Auto-pruned ${deletedCount} unacted jobs older than ${retentionDays} days.`);
  }

  return { deletedCount, remainingCount: localStore.jobsStore.length };
}

export function isDatabaseConnected(): boolean {
  return isMongoConnected;
}
