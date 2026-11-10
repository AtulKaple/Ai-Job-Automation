import React, { useState, useEffect } from 'react';
import { 
  X, 
  Sparkles, 
  Play, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  FileSpreadsheet, 
  Check, 
  Layers,
  ArrowRight
} from 'lucide-react';
import { motion } from 'motion/react';
import confetti from 'canvas-confetti';
import { AgentExecutionRun } from '../types';

interface PipelineRunnerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRunPipeline: () => Promise<AgentExecutionRun>;
}

export default function PipelineRunnerModal({
  isOpen,
  onClose,
  onRunPipeline,
}: PipelineRunnerModalProps) {
  const [isRunning, setIsRunning] = useState(false);
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [logs, setLogs] = useState<string[]>([]);
  const [executionRun, setExecutionRun] = useState<AgentExecutionRun | null>(null);

  const steps = [
    { title: 'Job Discovery & Deduplication', desc: 'Scan Greenhouse, Lever, Wellfound & Direct portals' },
    { title: 'Gemini Multi-Factor Fit Scoring', desc: 'Score skills, experience alignment, and seniority match' },
    { title: 'Automated Resume Tailoring', desc: 'Synthesize verified ATS-optimized bullet points' },
    { title: 'Cover Letter & Question Formulation', desc: 'Draft 150-250 word letters & classify fields' },
    { title: 'Safety Review & Ledger Synchronization', desc: 'Stage sensitive questions & write to Excel ledger' }
  ];

  const handleStart = async () => {
    setIsRunning(true);
    setCurrentStep(1);
    setLogs(['🚀 Pipeline initiated by user...']);

    const timer1 = setTimeout(() => {
      setCurrentStep(2);
      setLogs(l => [...l, '🔍 Scanning adapter feeds: Discovered active matching positions', '🧠 Running Gemini Multi-Factor Analysis...']);
    }, 1200);

    const timer2 = setTimeout(() => {
      setCurrentStep(3);
      setLogs(l => [...l, '📊 Candidate scoring complete: Shortlisted roles matching profile', '📄 Tailoring versioned resumes and generating ATS keywords...']);
    }, 2800);

    const timer3 = setTimeout(() => {
      setCurrentStep(4);
      setLogs(l => [...l, '✍️ Formulating targeted cover letters and application answers...']);
    }, 4200);

    try {
      const result = await onRunPipeline();
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      setCurrentStep(5);
      setExecutionRun(result);
      if (result.logs && result.logs.length > 0) {
        setLogs(result.logs);
      }
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.5 }
      });
    } catch (err: any) {
      setLogs(l => [...l, `❌ Error: ${err.message || 'Pipeline failed'}`]);
    } finally {
      setIsRunning(false);
    }
  };

  if (!isOpen) return null;

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
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <h2 className="font-semibold text-sm text-white">Automated Pipeline Orchestrator</h2>
              <p className="text-xs text-slate-400">Discovery → Scoring → ATS Tailoring → Ledger Sync</p>
            </div>
          </div>

          <button
            onClick={onClose}
            disabled={isRunning}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-400 hover:text-white transition-colors disabled:opacity-50 cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1 text-xs">
          {/* Visual Step Progress */}
          <div className="space-y-3">
            {steps.map((step, idx) => {
              const stepNumber = idx + 1;
              const isDone = currentStep > stepNumber || (currentStep === 5 && !isRunning);
              const isCurrent = currentStep === stepNumber && isRunning;

              return (
                <div
                  key={idx}
                  className={`p-3.5 rounded-xl border flex items-center gap-3 transition-all ${
                    isCurrent
                      ? 'bg-indigo-950/40 border-indigo-500/50 shadow-md ring-1 ring-indigo-500/30'
                      : isDone
                      ? 'bg-emerald-950/20 border-emerald-800/40'
                      : 'bg-slate-850/60 border-slate-800 opacity-60'
                  }`}
                >
                  <div className={`h-7 w-7 rounded-full flex items-center justify-center shrink-0 font-bold text-xs ${
                    isDone
                      ? 'bg-emerald-500 text-white'
                      : isCurrent
                      ? 'bg-indigo-600 text-white animate-pulse'
                      : 'bg-slate-800 text-slate-400'
                  }`}>
                    {isDone ? <Check className="h-4 w-4" /> : stepNumber}
                  </div>

                  <div className="flex-1 min-w-0">
                    <h4 className={`font-semibold text-xs ${isCurrent ? 'text-indigo-300' : isDone ? 'text-emerald-300' : 'text-slate-300'}`}>
                      {step.title}
                    </h4>
                    <p className="text-[11px] text-slate-400 truncate">{step.desc}</p>
                  </div>

                  {isCurrent && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 animate-pulse">
                      Processing
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Real-time Execution Console */}
          <div className="space-y-1.5">
            <h4 className="font-bold text-slate-300 text-xs">Live Engine Telemetry Logs</h4>
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-[11px] font-mono text-slate-300 space-y-1 max-h-36 overflow-y-auto">
              {logs.length === 0 ? (
                <span className="text-slate-600">Ready to execute. Click "Execute Automated Pipeline" below.</span>
              ) : (
                logs.map((log, i) => <div key={i}>{log}</div>)
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-slate-800 bg-slate-900 flex items-center justify-between gap-3">
          <button
            onClick={onClose}
            disabled={isRunning}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 disabled:opacity-50"
          >
            Close
          </button>

          <button
            onClick={handleStart}
            disabled={isRunning}
            className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold text-xs shadow-lg shadow-indigo-600/30 transition-all active:scale-95 disabled:opacity-50"
            id="modal-run-pipeline-submit"
          >
            {isRunning ? (
              <>
                <Clock className="h-4 w-4 animate-spin" />
                <span>Running Pipeline...</span>
              </>
            ) : (
              <>
                <Play className="h-4 w-4 fill-current" />
                <span>Execute Automated Pipeline</span>
              </>
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
