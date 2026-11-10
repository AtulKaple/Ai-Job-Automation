import React from 'react';
import { 
  LayoutDashboard, 
  Compass, 
  AlertCircle, 
  Send, 
  FileText, 
  BarChart3, 
  Settings as SettingsIcon,
  UserCheck,
  CheckCircle,
  Briefcase,
  Sparkles
} from 'lucide-react';
import { motion } from 'motion/react';
import { Job, UserProfile } from '../types';

interface SidebarProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
  jobs: Job[];
  profile: UserProfile;
}

export default function Sidebar({ currentTab, onTabChange, jobs, profile }: SidebarProps) {
  const discoveredCount = jobs.filter(j => j.status === 'DISCOVERED').length;
  const reviewCount = jobs.filter(j => j.status === 'HUMAN_REVIEW').length;
  const appliedCount = jobs.filter(j => j.status === 'APPLIED' || j.status === 'INTERVIEW').length;
  const tailoredResumeCount = jobs.filter(j => j.tailoredResume).length;

  const navItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      badge: null
    },
    {
      id: 'copilot',
      label: 'Application Copilot',
      icon: Sparkles,
      badge: 'PRO',
      badgeColor: 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
    },
    {
      id: 'discovery',
      label: 'Job Discovery',
      icon: Compass,
      badge: discoveredCount > 0 ? discoveredCount : null,
      badgeColor: 'bg-indigo-500/15 text-indigo-300 border border-indigo-500/20'
    },
    {
      id: 'review',
      label: 'Human Review Queue',
      icon: AlertCircle,
      badge: reviewCount > 0 ? reviewCount : null,
      badgeColor: 'bg-amber-500/15 text-amber-300 border border-amber-500/20'
    },
    {
      id: 'applications',
      label: 'Applications Tracker',
      icon: Send,
      badge: appliedCount > 0 ? appliedCount : null,
      badgeColor: 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/20'
    },
    {
      id: 'resume',
      label: 'Master Resume & Tailor',
      icon: FileText,
      badge: tailoredResumeCount > 0 ? `${tailoredResumeCount}` : null,
      badgeColor: 'bg-purple-500/15 text-purple-300 border border-purple-500/20'
    },
    {
      id: 'analytics',
      label: 'Analytics & Insights',
      icon: BarChart3,
      badge: null
    },
    {
      id: 'settings',
      label: 'Agent Settings',
      icon: SettingsIcon,
      badge: null
    }
  ];

  return (
    <aside className="w-full md:w-64 bg-slate-900/40 border-r border-slate-800/80 p-3 lg:p-4 flex flex-col justify-between shrink-0">
      <div className="space-y-5">
        {/* Candidate Mini Profile Card */}
        <div className="p-3 rounded-xl bg-slate-850/70 border border-slate-800/90 flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-indigo-600/20 border border-indigo-500/30 text-indigo-300 flex items-center justify-center font-bold text-xs tracking-wider">
            {profile.fullName.split(' ').map(n => n[0]).join('')}
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="text-xs font-semibold text-slate-100 truncate">{profile.fullName}</h4>
            <p className="text-[11px] text-slate-400 truncate font-normal">{profile.currentRole}</p>
          </div>
        </div>

        {/* Navigation items */}
        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <motion.button
                key={item.id}
                whileHover={{ x: 2 }}
                whileTap={{ scale: 0.99 }}
                onClick={() => onTabChange(item.id)}
                id={`sidebar-nav-${item.id}`}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
                  isActive
                    ? 'bg-indigo-600/15 text-indigo-300 border border-indigo-500/30 shadow-sm font-semibold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850/60 border border-transparent'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className={`h-4 w-4 ${isActive ? 'text-indigo-400' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className={`text-[10px] font-mono font-medium px-2 py-0.5 rounded-full ${item.badgeColor || 'bg-slate-800 text-slate-300'}`}>
                    {item.badge}
                  </span>
                )}
              </motion.button>
            );
          })}
        </nav>
      </div>

      {/* Footer System Status */}
      <div className="pt-4 border-t border-slate-800/80 space-y-2 text-[11px] text-slate-400">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <CheckCircle className="h-3 w-3 text-emerald-400" />
            <span>Auto-Sync Excel</span>
          </span>
          <span className="text-emerald-400 font-mono text-[10px] font-medium">Ready</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <Briefcase className="h-3 w-3 text-indigo-400" />
            <span>Target Roles</span>
          </span>
          <span className="text-slate-300 font-mono text-[10px]">{profile.targetRoles.length} Active</span>
        </div>
      </div>
    </aside>
  );
}

