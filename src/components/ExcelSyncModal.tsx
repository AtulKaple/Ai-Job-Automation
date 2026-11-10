import React, { useState, useEffect } from 'react';
import { 
  X, 
  FileSpreadsheet, 
  Download, 
  ExternalLink, 
  Check, 
  Copy,
  Table as TableIcon,
  Sparkles,
  Search,
  CheckCircle2
} from 'lucide-react';
import { motion } from 'motion/react';
import { Job } from '../types';
import { apiFetch, apiUrl } from '../utils/api';

interface ExcelSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  jobs: Job[];
}

export default function ExcelSyncModal({
  isOpen,
  onClose,
  jobs,
}: ExcelSyncModalProps) {
  const [excelRows, setExcelRows] = useState<any[]>([]);
  const [copiedCsv, setCopiedCsv] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (isOpen) {
      apiFetch('/api/excel/data')
        .then(r => r.json())
        .then(d => {
          if (d.success) setExcelRows(d.rows);
        })
        .catch(err => console.error('Failed to fetch Excel rows:', err));
    }
  }, [isOpen, jobs]);

  if (!isOpen) return null;

  const handleDownloadXlsx = () => {
    window.location.href = apiUrl('/api/excel/export-xlsx');
  };

  const handleDownloadCsv = () => {
    window.location.href = apiUrl('/api/excel/export');
  };

  const handleCopyTsv = () => {
    if (excelRows.length === 0) return;
    const headers = Object.keys(excelRows[0]).join('\t');
    const rows = excelRows.map(r => Object.values(r).join('\t')).join('\n');
    navigator.clipboard.writeText(`${headers}\n${rows}`);
    setCopiedCsv(true);
    setTimeout(() => setCopiedCsv(false), 2500);
  };

  const filteredRows = excelRows.filter(r => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      String(r.Company || '').toLowerCase().includes(term) ||
      String(r['Job Title'] || '').toLowerCase().includes(term) ||
      String(r.Status || '').toLowerCase().includes(term) ||
      String(r.Source || '').toLowerCase().includes(term)
    );
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <motion.div 
        initial={{ opacity: 0, scale: 0.97, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.97, y: 8 }}
        transition={{ duration: 0.15 }}
        className="relative w-full max-w-6xl bg-slate-900 border border-slate-750 rounded-2xl shadow-2xl overflow-hidden my-6 flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 bg-slate-900/95 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center text-emerald-400">
              <FileSpreadsheet className="h-4 w-4" />
            </div>
            <div>
              <h2 className="font-semibold text-sm text-white flex items-center gap-2">
                <span>Excel & Google Sheets Application Ledger</span>
                <span className="text-[10px] font-mono px-2 py-0.2 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                  LIVE SYNC
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Bidirectional synchronization: Every application logged includes Company, Role, URL, ATS Score, Resume Version, and Timestamps.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4 overflow-y-auto flex-1 text-xs">
          {/* Action Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-xl bg-emerald-950/30 border border-emerald-800/40 text-emerald-200">
            <div>
              <span className="font-bold text-xs flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                <span>Live Ledger Database: {excelRows.length} Rows Synced</span>
              </span>
              <p className="text-[11px] text-slate-300">
                Formatted with 22 ATS attributes, formula columns, and custom tracking headers.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={handleDownloadXlsx}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-md shadow-emerald-600/20 transition-all active:scale-95"
                id="excel-download-xlsx-btn"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Download .XLSX (Excel)</span>
              </button>

              <button
                onClick={handleDownloadCsv}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs border border-slate-700 transition-all active:scale-95"
                id="excel-download-csv-btn"
              >
                <Download className="h-3.5 w-3.5 text-slate-400" />
                <span>Download .CSV</span>
              </button>

              <button
                onClick={handleCopyTsv}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-xs border border-slate-700 transition-all"
              >
                {copiedCsv ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                <span>{copiedCsv ? 'Copied TSV!' : 'Copy to Sheets'}</span>
              </button>
            </div>
          </div>

          {/* Search Bar inside Excel */}
          <div className="flex items-center justify-between gap-3">
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-500" />
              <input
                type="text"
                placeholder="Filter Excel rows by company, role, or status..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-slate-850 border border-slate-700/80 rounded-lg text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div className="text-slate-400 text-[11px]">
              Showing <strong>{filteredRows.length}</strong> of {excelRows.length} records
            </div>
          </div>

          {/* Spreadsheet Table Preview */}
          <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950 shadow-inner max-h-96">
            <table className="w-full text-left text-[11px] font-mono text-slate-300">
              <thead className="bg-slate-850 text-slate-400 uppercase text-[10px] sticky top-0 border-b border-slate-800">
                <tr>
                  <th className="px-3 py-2.5">Company</th>
                  <th className="px-3 py-2.5">Job Title</th>
                  <th className="px-3 py-2.5">Location</th>
                  <th className="px-2 py-2.5">Match %</th>
                  <th className="px-3 py-2.5">Source</th>
                  <th className="px-3 py-2.5">Status</th>
                  <th className="px-3 py-2.5">Resume Version</th>
                  <th className="px-3 py-2.5">Applied Date</th>
                  <th className="px-3 py-2.5">Job Link</th>
                  <th className="px-3 py-2.5">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850">
                {filteredRows.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="px-4 py-8 text-center text-slate-500">
                      No matching records found.
                    </td>
                  </tr>
                ) : (
                  filteredRows.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-900/60 transition-colors">
                      <td className="px-3 py-2 font-semibold text-white">{row.Company}</td>
                      <td className="px-3 py-2 text-slate-300 truncate max-w-xs">{row['Job Title']}</td>
                      <td className="px-3 py-2 text-slate-400">{row.Location}</td>
                      <td className="px-2 py-2 text-indigo-400 font-bold">{row['Match Score']}</td>
                      <td className="px-3 py-2 text-slate-400">{row.Source}</td>
                      <td className="px-3 py-2">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          row.Status === 'APPLIED' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                          row.Status === 'INTERVIEW' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                          row.Status === 'SHORTLISTED' ? 'bg-indigo-500/20 text-indigo-300' :
                          'bg-slate-800 text-slate-400'
                        }`}>
                          {row.Status}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-purple-400 font-mono text-[10px]">{row['Tailored Resume Version']}</td>
                      <td className="px-3 py-2 text-emerald-400 font-semibold">{row['Applied Date']}</td>
                      <td className="px-3 py-2 text-indigo-400 underline truncate max-w-[120px]">
                        <a href={row['Job URL']} target="_blank" rel="noopener noreferrer">
                          {row['Job URL']}
                        </a>
                      </td>
                      <td className="px-3 py-2 text-slate-400 truncate max-w-xs">{row.Notes}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900 flex items-center justify-between">
          <span className="text-[11px] text-slate-500">
            Compatible with Microsoft Excel 2016+, Google Sheets, LibreOffice Calc, and Apple Numbers.
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700"
          >
            Close
          </button>
        </div>
      </motion.div>
    </div>
  );
}
