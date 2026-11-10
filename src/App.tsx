import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import DashboardView from './components/DashboardView';
import JobDiscoveryView from './components/JobDiscoveryView';
import HumanReviewQueueView from './components/HumanReviewQueueView';
import ApplicationsTrackerView from './components/ApplicationsTrackerView';
import ResumeStudioView from './components/ResumeStudioView';
import AnalyticsView from './components/AnalyticsView';
import SettingsView from './components/SettingsView';
import ApplicationCopilotView from './components/ApplicationCopilotView';
import JobDetailModal from './components/JobDetailModal';
import PipelineRunnerModal from './components/PipelineRunnerModal';
import ExcelSyncModal from './components/ExcelSyncModal';
import ManualJobModal from './components/ManualJobModal';
import { defaultUserProfile, defaultSettings } from './data/defaultProfile';
import { initialSeedJobs } from './data/seedJobs';
import { UserProfile, AppSettings, Job, AgentExecutionRun } from './types';
import { apiFetch } from './utils/api';

export default function App() {
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [profile, setProfile] = useState<UserProfile>(defaultUserProfile);
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [runs, setRuns] = useState<AgentExecutionRun[]>([]);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [copilotInitialJob, setCopilotInitialJob] = useState<Job | null>(null);

  // Modals state
  const [isPipelineOpen, setIsPipelineOpen] = useState<boolean>(false);
  const [isManualJobOpen, setIsManualJobOpen] = useState<boolean>(false);
  const [isExcelSyncOpen, setIsExcelSyncOpen] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isLiveSyncing, setIsLiveSyncing] = useState<boolean>(false);
  const [liveSyncMessage, setLiveSyncMessage] = useState<string | null>(null);

  // Auto-sync real live jobs from Greenhouse, Ashby, Remotive, Jobicy
  const syncLiveJobs = async (showLoadingSpinner = false) => {
    if (showLoadingSpinner) setIsLoading(true);
    setIsLiveSyncing(true);
    try {
      const res = await apiFetch('/api/jobs/sync-real', { method: 'POST' });
      const data = await res.json();
      if (data.success && data.jobs) {
        setJobs(data.jobs);
        if (data.newJobsCount && data.newJobsCount > 0) {
          setLiveSyncMessage(`Synced ${data.newJobsCount} fresh live positions`);
        } else {
          setLiveSyncMessage(`Live feeds up to date (${data.count} positions)`);
        }
        setTimeout(() => setLiveSyncMessage(null), 4000);
      }
    } catch (err) {
      console.warn('Live auto-sync error:', err);
    } finally {
      setIsLiveSyncing(false);
      if (showLoadingSpinner) setIsLoading(false);
    }
  };

  // Load initial backend state
  const loadData = async () => {
    try {
      const [profRes, settRes, jobsRes, runsRes] = await Promise.all([
        apiFetch('/api/profile').then(r => r.json()).catch(() => null),
        apiFetch('/api/settings').then(r => r.json()).catch(() => null),
        apiFetch('/api/jobs').then(r => r.json()).catch(() => null),
        apiFetch('/api/runs').then(r => r.json()).catch(() => null),
      ]);

      if (profRes && profRes.fullName) setProfile(profRes);
      if (settRes && settRes.targetRoles) setSettings(settRes);
      if (jobsRes && Array.isArray(jobsRes)) setJobs(jobsRes);
      if (runsRes && Array.isArray(runsRes)) setRuns(runsRes);
    } catch (err) {
      console.warn('Backend data load error:', err);
    }
  };

  useEffect(() => {
    // Load existing database state on mount (if database has no jobs, shows 0 jobs)
    loadData();
  }, []);

  // Update selected job when jobs list updates
  useEffect(() => {
    if (selectedJob) {
      const updated = jobs.find(j => j.id === selectedJob.id);
      if (updated) setSelectedJob(updated);
    }
  }, [jobs]);

  // Handler: Trigger Discovery
  const handleTriggerDiscovery = async () => {
    setIsLoading(true);
    try {
      const res = await apiFetch('/api/jobs/discover', { method: 'POST' });
      const data = await res.json();
      if (data.success && data.jobs) {
        setJobs(data.jobs);
      }
    } catch (err) {
      console.error('Discovery error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Handler: Sync 100% Real Live Jobs (Manual trigger)
  const handleSyncRealJobs = async () => {
    await syncLiveJobs(true);
  };

  // Handler: Batch AI Analysis
  const handleBatchAnalyze = async () => {
    setIsLoading(true);
    try {
      const res = await apiFetch('/api/jobs/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });
      const data = await res.json();
      if (data.success && data.jobs) {
        setJobs(data.jobs);
      }
    } catch (err) {
      console.error('Batch analysis error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Handler: Tailor Resume for Single Job
  const handleTailorResume = async (jobId: string) => {
    setIsLoading(true);
    try {
      const res = await apiFetch('/api/jobs/tailor-resume', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId })
      });
      const data = await res.json();
      if (data.success) {
        setJobs(prev => prev.map(j => (j.id === jobId ? data.job : j)));
        if (selectedJob?.id === jobId) {
          setSelectedJob(data.job);
        }
      }
    } catch (err) {
      console.error('Resume tailor error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Handler: Generate Cover Letter
  const handleGenerateCoverLetter = async (jobId: string) => {
    setIsLoading(true);
    try {
      const res = await apiFetch('/api/jobs/cover-letter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId })
      });
      const data = await res.json();
      if (data.success) {
        setJobs(prev => prev.map(j => (j.id === jobId ? data.job : j)));
        if (selectedJob?.id === jobId) {
          setSelectedJob(data.job);
        }
      }
    } catch (err) {
      console.error('Cover letter error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Handler: Prepare Questions
  const handlePrepareQuestions = async (jobId: string) => {
    setIsLoading(true);
    try {
      const res = await apiFetch('/api/jobs/prepare-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId })
      });
      const data = await res.json();
      if (data.success) {
        setJobs(prev => prev.map(j => (j.id === jobId ? data.job : j)));
        if (selectedJob?.id === jobId) {
          setSelectedJob(data.job);
        }
      }
    } catch (err) {
      console.error('Questions error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Handler: Update Job Status
  const handleUpdateStatus = async (
    jobId: string,
    status: any,
    notes?: string,
    interviewDate?: string
  ) => {
    try {
      const res = await apiFetch('/api/jobs/update-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId, status, notes, interviewDate })
      });
      const data = await res.json();
      if (data.success) {
        setJobs(prev => prev.map(j => (j.id === jobId ? data.job : j)));
        if (selectedJob?.id === jobId) {
          setSelectedJob(data.job);
        }
      }
    } catch (err) {
      console.error('Status update error:', err);
    }
  };

  // Handler: Run Full Automated Pipeline
  const handleRunPipeline = async (): Promise<AgentExecutionRun> => {
    const res = await apiFetch('/api/pipeline/run', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    const data = await res.json();
    if (data.success) {
      setJobs(data.jobs);
      setRuns(prev => [data.run, ...prev]);
      return data.run;
    }
    throw new Error(data.error || 'Pipeline run failed');
  };

  // Handler: Save Profile
  const handleSaveProfile = async (updated: Partial<UserProfile>) => {
    setIsLoading(true);
    try {
      const res = await apiFetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated)
      });
      const data = await res.json();
      if (data.success) {
        setProfile(data.profile);
      }
    } catch (err) {
      console.error('Profile save error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Handler: Prune Stale Jobs
  const handlePruneJobs = async (days?: number) => {
    setIsLoading(true);
    try {
      const res = await apiFetch('/api/jobs/prune', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ days: days || settings.staleJobRetentionDays || 20 })
      });
      const data = await res.json();
      if (data.success && data.jobs) {
        setJobs(data.jobs);
      }
      return data;
    } catch (err) {
      console.error('Prune jobs error:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Handler: Save Settings
  const handleSaveSettings = async (updated: Partial<AppSettings>) => {
    setIsLoading(true);
    try {
      const res = await apiFetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated)
      });
      const data = await res.json();
      if (data.success) {
        setSettings(data.settings);
      }
    } catch (err) {
      console.error('Settings save error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Handler: Add Manual Job
  const handleAddJob = async (jobData: any): Promise<Job> => {
    setIsLoading(true);
    try {
      const res = await apiFetch('/api/jobs/manual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(jobData)
      });
      const data = await res.json();
      if (data.success) {
        setJobs(prev => [data.job, ...prev]);
        return data.job;
      }
      throw new Error(data.error || 'Failed to add job');
    } finally {
      setIsLoading(false);
    }
  };

  // Handler: Open in Copilot
  const handleOpenCopilot = (targetJob?: Job) => {
    if (targetJob) {
      setCopilotInitialJob(targetJob);
    }
    setCurrentTab('copilot');
    if (selectedJob) setSelectedJob(null);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Top Header */}
      <Header
        profile={profile}
        jobs={jobs}
        onOpenPipeline={() => setIsPipelineOpen(true)}
        onOpenManualJob={() => setIsManualJobOpen(true)}
        onOpenExcelSync={() => setIsExcelSyncOpen(true)}
        onNavigate={(tab) => setCurrentTab(tab)}
        isLiveSyncing={isLiveSyncing}
        liveSyncMessage={liveSyncMessage}
      />

      {/* Main Layout */}
      <div className="flex-1 flex flex-col md:flex-row max-w-7xl w-full mx-auto">
        {/* Navigation Sidebar */}
        <Sidebar
          currentTab={currentTab}
          onTabChange={(tab) => setCurrentTab(tab)}
          jobs={jobs}
          profile={profile}
        />

        {/* Dynamic View Content */}
        <main className="flex-1 p-4 sm:p-6 md:p-8 min-w-0 overflow-y-auto">
          {currentTab === 'dashboard' && (
            <DashboardView
              jobs={jobs}
              profile={profile}
              runs={runs}
              onSelectJob={(job) => setSelectedJob(job)}
              onOpenPipeline={() => setIsPipelineOpen(true)}
              onOpenExcelSync={() => setIsExcelSyncOpen(true)}
              onNavigate={(tab) => setCurrentTab(tab)}
            />
          )}

          {currentTab === 'copilot' && (
            <ApplicationCopilotView
              profile={profile}
              jobs={jobs}
              initialJob={copilotInitialJob}
              onSelectJob={(job) => setSelectedJob(job)}
              onNavigate={(tab) => setCurrentTab(tab)}
              onJobCreated={(newJob) => setJobs(prev => [newJob, ...prev.filter(j => j.id !== newJob.id)])}
            />
          )}

          {currentTab === 'discovery' && (
            <JobDiscoveryView
              jobs={jobs}
              onSelectJob={(job) => setSelectedJob(job)}
              onOpenManualJob={() => setIsManualJobOpen(true)}
              onTriggerDiscovery={handleTriggerDiscovery}
              onSyncRealJobs={handleSyncRealJobs}
              onBatchAnalyze={handleBatchAnalyze}
              onOpenCopilot={handleOpenCopilot}
              isLoading={isLoading}
              isLiveSyncing={isLiveSyncing}
              liveSyncMessage={liveSyncMessage}
            />
          )}

          {currentTab === 'review' && (
            <HumanReviewQueueView
              jobs={jobs}
              profile={profile}
              onSelectJob={(job) => setSelectedJob(job)}
              onUpdateStatus={handleUpdateStatus}
              onTailorResume={handleTailorResume}
            />
          )}

          {currentTab === 'applications' && (
            <ApplicationsTrackerView
              jobs={jobs}
              onSelectJob={(job) => setSelectedJob(job)}
              onUpdateStatus={handleUpdateStatus}
              onOpenExcelSync={() => setIsExcelSyncOpen(true)}
            />
          )}

          {currentTab === 'resume' && (
            <ResumeStudioView
              profile={profile}
              jobs={jobs}
              onSaveProfile={handleSaveProfile}
              onSelectJob={(job) => setSelectedJob(job)}
              isLoading={isLoading}
            />
          )}

          {currentTab === 'analytics' && (
            <AnalyticsView
              jobs={jobs}
              profile={profile}
            />
          )}

          {currentTab === 'settings' && (
            <SettingsView
              settings={settings}
              profile={profile}
              onSaveSettings={handleSaveSettings}
              onPruneJobs={handlePruneJobs}
              isLoading={isLoading}
            />
          )}
        </main>
      </div>

      {/* Global Modals */}
      <JobDetailModal
        job={selectedJob}
        profile={profile}
        onClose={() => setSelectedJob(null)}
        onTailorResume={handleTailorResume}
        onGenerateCoverLetter={handleGenerateCoverLetter}
        onPrepareQuestions={handlePrepareQuestions}
        onUpdateStatus={handleUpdateStatus}
        onOpenCopilot={handleOpenCopilot}
        isLoading={isLoading}
      />

      <PipelineRunnerModal
        isOpen={isPipelineOpen}
        onClose={() => setIsPipelineOpen(false)}
        onRunPipeline={handleRunPipeline}
      />

      <ExcelSyncModal
        isOpen={isExcelSyncOpen}
        onClose={() => setIsExcelSyncOpen(false)}
        jobs={jobs}
      />

      <ManualJobModal
        isOpen={isManualJobOpen}
        onClose={() => setIsManualJobOpen(false)}
        onAddJob={handleAddJob}
        isLoading={isLoading}
      />
    </div>
  );
}
