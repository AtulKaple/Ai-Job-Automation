import React, { useState } from 'react';
import { 
  Settings as SettingsIcon, 
  Sliders, 
  ShieldCheck, 
  Save, 
  Check, 
  Plus, 
  X,
  Lock,
  Compass, 
  FileSpreadsheet,
  Clock,
  Trash2,
  RefreshCw
} from 'lucide-react';
import { motion } from 'motion/react';
import { AppSettings, UserProfile } from '../types';

interface SettingsViewProps {
  settings: AppSettings;
  profile: UserProfile;
  onSaveSettings: (updated: Partial<AppSettings>) => Promise<void>;
  onPruneJobs?: (days?: number) => Promise<{ deletedCount: number; remainingCount: number }>;
  isLoading: boolean;
}

export default function SettingsView({
  settings,
  profile,
  onSaveSettings,
  onPruneJobs,
  isLoading,
}: SettingsViewProps) {
  const [formData, setFormData] = useState<AppSettings>(settings);
  const [newRole, setNewRole] = useState('');
  const [newLocation, setNewLocation] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isPruning, setIsPruning] = useState(false);
  const [pruneResult, setPruneResult] = useState<string | null>(null);

  const handleSave = async () => {
    await onSaveSettings(formData);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  const handlePrune = async () => {
    if (!onPruneJobs) return;
    setIsPruning(true);
    setPruneResult(null);
    try {
      const res = await onPruneJobs(formData.staleJobRetentionDays || 20);
      setPruneResult(
        res.deletedCount > 0
          ? `Cleaned ${res.deletedCount} unacted jobs older than ${formData.staleJobRetentionDays || 20} days. ${res.remainingCount} active jobs remaining.`
          : `No stale unacted jobs found older than ${formData.staleJobRetentionDays || 20} days.`
      );
      setTimeout(() => setPruneResult(null), 5000);
    } catch (err: any) {
      setPruneResult(`Error pruning jobs: ${err?.message || 'Failed'}`);
    } finally {
      setIsPruning(false);
    }
  };

  const handleAddRole = () => {
    if (newRole.trim() && !formData.targetRoles.includes(newRole.trim())) {
      setFormData({ ...formData, targetRoles: [...formData.targetRoles, newRole.trim()] });
      setNewRole('');
    }
  };

  const handleRemoveRole = (role: string) => {
    setFormData({ ...formData, targetRoles: formData.targetRoles.filter(r => r !== role) });
  };

  const handleAddLocation = () => {
    if (newLocation.trim() && !formData.preferredLocations.includes(newLocation.trim())) {
      setFormData({ ...formData, preferredLocations: [...formData.preferredLocations, newLocation.trim()] });
      setNewLocation('');
    }
  };

  const handleRemoveLocation = (loc: string) => {
    setFormData({ ...formData, preferredLocations: formData.preferredLocations.filter(l => l !== loc) });
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.15 }}
      className="space-y-6 pb-12"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-lg font-semibold text-white tracking-tight flex items-center gap-2">
            <SettingsIcon className="h-5 w-5 text-indigo-400" />
            <span>Agent Governance & Discovery Parameters</span>
          </h1>
          <p className="text-xs text-slate-400">
            Safety thresholds, rate limits, targeting criteria, and platform adapter configuration.
          </p>
        </div>

        <button
          onClick={handleSave}
          disabled={isLoading}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium shadow-sm transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
          id="settings-save-btn"
        >
          {saveSuccess ? <Check className="h-3.5 w-3.5 text-emerald-300" /> : <Save className="h-3.5 w-3.5" />}
          <span>{saveSuccess ? 'Saved' : 'Save Configuration'}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Safety & Rate Limits Card */}
        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4">
          <h3 className="font-bold text-sm text-white flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
            <span>Safety, Throttling & Limits</span>
          </h3>

          <div className="space-y-3 text-xs">
            <div className="space-y-1">
              <label className="text-slate-300 font-medium flex justify-between">
                <span>Daily Application Cap</span>
                <span className="text-indigo-400 font-bold">{formData.dailyApplicationLimit} / day</span>
              </label>
              <input
                type="range"
                min={5}
                max={50}
                step={5}
                value={formData.dailyApplicationLimit}
                onChange={(e) => setFormData({ ...formData, dailyApplicationLimit: Number(e.target.value) })}
                className="w-full accent-indigo-500"
              />
              <p className="text-[11px] text-slate-500">Prevents account bans and spamming across employer ATS systems.</p>
            </div>

            <div className="space-y-1 pt-2 border-t border-slate-800">
              <label className="text-slate-300 font-medium flex justify-between">
                <span>Minimum Match Score for Auto-Shortlist</span>
                <span className="text-indigo-400 font-bold">{formData.minimumScoreThreshold}%</span>
              </label>
              <input
                type="range"
                min={50}
                max={95}
                step={5}
                value={formData.minimumScoreThreshold}
                onChange={(e) => setFormData({ ...formData, minimumScoreThreshold: Number(e.target.value) })}
                className="w-full accent-indigo-500"
              />
              <p className="text-[11px] text-slate-500">Roles below this score will not be automatically tailored.</p>
            </div>

            <div className="space-y-1 pt-2 border-t border-slate-800">
              <label className="text-slate-300 font-medium">Application Mode</label>
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, automationMode: 'ASSISTED' })}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    formData.automationMode === 'ASSISTED'
                      ? 'bg-indigo-600/20 border-indigo-500/50 text-white'
                      : 'bg-slate-850 border-slate-700/60 text-slate-400'
                  }`}
                >
                  <div className="font-bold text-xs text-indigo-300">Assisted (Recommended)</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">Prepares tailored artifacts and stages for one-click human confirmation.</div>
                </button>

                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, automationMode: 'AUTONOMOUS' })}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    formData.automationMode === 'AUTONOMOUS'
                      ? 'bg-indigo-600/20 border-indigo-500/50 text-white'
                      : 'bg-slate-850 border-slate-700/60 text-slate-400'
                  }`}
                >
                  <div className="font-bold text-xs text-indigo-300">Autonomous (Direct)</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">Directly logs & prepares applications matching 90%+ confidence.</div>
                </button>
              </div>
            </div>

            {/* Auto-Prune Stale Jobs */}
            <div className="space-y-2 pt-3 border-t border-slate-800">
              <label className="text-slate-300 font-medium flex justify-between">
                <span className="flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-amber-400" />
                  <span>Auto-Prune Unacted Jobs</span>
                </span>
                <span className="text-amber-400 font-bold">{formData.staleJobRetentionDays ?? 20} days</span>
              </label>
              <input
                type="range"
                min={7}
                max={45}
                step={1}
                value={formData.staleJobRetentionDays ?? 20}
                onChange={(e) => setFormData({ ...formData, staleJobRetentionDays: Number(e.target.value) })}
                className="w-full accent-amber-500"
              />
              <p className="text-[11px] text-slate-400">
                Automatically purges listings in <code className="text-indigo-300">DISCOVERED</code> or <code className="text-indigo-300">SKIPPED</code> status older than this cutoff. Applied, interview, and shortlisted records are permanently protected.
              </p>

              {onPruneJobs && (
                <div className="pt-2 flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={handlePrune}
                    disabled={isPruning || isLoading}
                    className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-medium transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                  >
                    {isPruning ? (
                      <>
                        <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                        <span>Pruning database...</span>
                      </>
                    ) : (
                      <>
                        <Trash2 className="h-3.5 w-3.5 text-amber-400" />
                        <span>Clean Stale Jobs Now ({formData.staleJobRetentionDays ?? 20}d threshold)</span>
                      </>
                    )}
                  </button>

                  {pruneResult && (
                    <div className="p-2 rounded bg-slate-800/90 border border-slate-700 text-[11px] text-amber-200">
                      {pruneResult}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Target Roles & Search Keywords */}
        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4">
          <h3 className="font-bold text-sm text-white flex items-center gap-2">
            <Compass className="h-4 w-4 text-indigo-400" />
            <span>Target Roles & Geographic Preferences</span>
          </h3>

          <div className="space-y-3 text-xs">
            {/* Roles */}
            <div className="space-y-1.5">
              <label className="text-slate-300 font-medium">Target Job Titles</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. Senior Frontend Engineer"
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddRole())}
                  className="flex-1 p-2 bg-slate-850 border border-slate-700/80 rounded-lg text-slate-200 focus:outline-none focus:border-indigo-500"
                />
                <button
                  type="button"
                  onClick={handleAddRole}
                  className="px-3 py-1.5 rounded-lg bg-indigo-600 text-white font-medium hover:bg-indigo-500"
                >
                  Add
                </button>
              </div>

              <div className="flex flex-wrap gap-1.5 pt-1">
                {formData.targetRoles.map((role) => (
                  <span
                    key={role}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs"
                  >
                    <span>{role}</span>
                    <button onClick={() => handleRemoveRole(role)} className="hover:text-red-400">
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* Locations */}
            <div className="space-y-1.5 pt-3 border-t border-slate-800">
              <label className="text-slate-300 font-medium">Target Locations & Preferences</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. Bengaluru, Remote, Pune"
                  value={newLocation}
                  onChange={(e) => setNewLocation(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddLocation())}
                  className="flex-1 p-2 bg-slate-850 border border-slate-700/80 rounded-lg text-slate-200 focus:outline-none focus:border-indigo-500"
                />
                <button
                  type="button"
                  onClick={handleAddLocation}
                  className="px-3 py-1.5 rounded-lg bg-indigo-600 text-white font-medium hover:bg-indigo-500"
                >
                  Add
                </button>
              </div>

              <div className="flex flex-wrap gap-1.5 pt-1">
                {formData.preferredLocations.map((loc) => (
                  <span
                    key={loc}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-800 border border-slate-700 text-slate-300 text-xs"
                  >
                    <span>{loc}</span>
                    <button onClick={() => handleRemoveLocation(loc)} className="hover:text-red-400">
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
