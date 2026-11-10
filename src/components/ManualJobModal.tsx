import React, { useState } from 'react';
import { 
  X, 
  Plus, 
  Building2, 
  MapPin, 
  Link as LinkIcon, 
  DollarSign, 
  FileText, 
  Sparkles 
} from 'lucide-react';
import { motion } from 'motion/react';
import { Job } from '../types';

interface ManualJobModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddJob: (jobData: any) => Promise<Job>;
  isLoading: boolean;
}

export default function ManualJobModal({
  isOpen,
  onClose,
  onAddJob,
  isLoading,
}: ManualJobModalProps) {
  const [company, setCompany] = useState('');
  const [title, setTitle] = useState('');
  const [location, setLocation] = useState('Remote');
  const [url, setUrl] = useState('');
  const [salaryMin, setSalaryMin] = useState('18');
  const [salaryMax, setSalaryMax] = useState('28');
  const [skills, setSkills] = useState('React, TypeScript, Next.js, Tailwind CSS');
  const [description, setDescription] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!company.trim() || !title.trim() || !description.trim()) {
      alert('Please fill in Company, Job Title, and Description');
      return;
    }

    try {
      await onAddJob({
        company: company.trim(),
        title: title.trim(),
        location: location.trim(),
        url: url.trim(),
        salaryMin: Number(salaryMin) || undefined,
        salaryMax: Number(salaryMax) || undefined,
        skills: skills.split(',').map(s => s.trim()).filter(Boolean),
        description: description.trim(),
        remote: location.toLowerCase().includes('remote')
      });
      onClose();
    } catch (err: any) {
      alert(`Failed to add job: ${err.message}`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <motion.div 
        initial={{ opacity: 0, scale: 0.97, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.97, y: 8 }}
        transition={{ duration: 0.15 }}
        className="relative w-full max-w-2xl bg-slate-900 border border-slate-750 rounded-2xl shadow-2xl overflow-hidden my-6 flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 bg-slate-900/95 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-indigo-500/10 border border-indigo-500/25 flex items-center justify-center text-indigo-400">
              <Plus className="h-4 w-4" />
            </div>
            <div>
              <h2 className="font-semibold text-sm text-white">Manual Opportunity Intake</h2>
              <p className="text-xs text-slate-400">Ingest roles from LinkedIn, direct correspondence, or custom listings</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto flex-1 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-slate-300 font-medium">Company Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Swiggy, Uber, Stripe"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                className="w-full p-2.5 bg-slate-850 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-slate-300 font-medium">Role Title *</label>
              <input
                type="text"
                required
                placeholder="e.g. Senior Frontend Engineer"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full p-2.5 bg-slate-850 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-slate-300 font-medium">Location</label>
              <input
                type="text"
                placeholder="e.g. Bengaluru / Remote"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full p-2.5 bg-slate-850 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-slate-300 font-medium">Application URL</label>
              <input
                type="url"
                placeholder="https://jobs.company.com/apply/..."
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="w-full p-2.5 bg-slate-850 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-slate-300 font-medium">Salary Range (LPA INR)</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  placeholder="Min"
                  value={salaryMin}
                  onChange={(e) => setSalaryMin(e.target.value)}
                  className="w-full p-2.5 bg-slate-850 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-indigo-500"
                />
                <span className="text-slate-500">-</span>
                <input
                  type="number"
                  placeholder="Max"
                  value={salaryMax}
                  onChange={(e) => setSalaryMax(e.target.value)}
                  className="w-full p-2.5 bg-slate-850 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-slate-300 font-medium">Required Skills (Comma separated)</label>
              <input
                type="text"
                placeholder="React, TypeScript, Redux, Node.js"
                value={skills}
                onChange={(e) => setSkills(e.target.value)}
                className="w-full p-2.5 bg-slate-850 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="space-y-1 pt-1">
            <label className="text-slate-300 font-medium">Job Description & Requirements *</label>
            <textarea
              required
              rows={6}
              placeholder="Paste full job description, qualifications, and role expectations here..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-3 bg-slate-850 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-indigo-500 font-mono text-[11px] leading-relaxed"
            />
          </div>

          <div className="p-3 border-t border-slate-800 bg-slate-900 flex items-center justify-between">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isLoading}
              className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold shadow-md shadow-indigo-600/20 disabled:opacity-50"
            >
              <Sparkles className="h-4 w-4" />
              <span>Add & Analyze with Gemini</span>
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
