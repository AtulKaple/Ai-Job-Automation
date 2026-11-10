import ExcelJS from 'exceljs';
import { Job } from '../src/types';

export interface ExcelApplicationRow {
  id: string;
  company: string;
  role: string;
  source: string;
  jobUrl: string;
  applicationUrl: string;
  location: string;
  remote: string;
  salary: string;
  matchScore: number | string;
  technicalScore: number | string;
  experienceScore: number | string;
  matchedSkills: string;
  missingSkills: string;
  resumeVersion: string;
  dateDiscovered: string;
  dateShortlisted: string;
  dateApplied: string;
  status: string;
  interviewDate: string;
  followUpDate: string;
  notes: string;
}

export function formatJobsToExcelRows(jobs: Job[]): ExcelApplicationRow[] {
  return jobs.map(job => {
    const analysis = job.analysis;
    const appRecord = job.applicationRecord;

    return {
      id: job.id,
      company: job.company,
      role: job.title,
      source: job.sourceName || job.source,
      jobUrl: job.url,
      applicationUrl: appRecord?.applicationUrl || job.url,
      location: job.location,
      remote: job.remote ? 'Yes' : 'No',
      salary: job.salaryMin ? `${job.salaryMin} - ${job.salaryMax} ${job.salaryCurrency || 'LPA'}` : 'N/A',
      matchScore: analysis?.overallScore ? `${analysis.overallScore}%` : 'Pending',
      technicalScore: analysis?.technicalSkillScore ? `${analysis.technicalSkillScore}%` : 'Pending',
      experienceScore: analysis?.experienceScore ? `${analysis.experienceScore}%` : 'Pending',
      matchedSkills: analysis?.matchedSkills?.join(', ') || job.skills?.join(', ') || 'React, TypeScript',
      missingSkills: analysis?.missingSkills?.join(', ') || 'None',
      resumeVersion: job.tailoredResume?.versionId || appRecord?.resumeVersionId || 'Master (v1.0)',
      dateDiscovered: job.discoveredAt ? new Date(job.discoveredAt).toLocaleDateString() : 'N/A',
      dateShortlisted: job.status === 'SHORTLISTED' || job.status === 'READY_TO_APPLY' || job.status === 'APPLIED' || job.status === 'INTERVIEW'
        ? (job.discoveredAt ? new Date(job.discoveredAt).toLocaleDateString() : 'N/A')
        : 'N/A',
      dateApplied: appRecord?.appliedAt ? new Date(appRecord.appliedAt).toLocaleDateString() : (job.status === 'APPLIED' || job.status === 'INTERVIEW' ? new Date().toLocaleDateString() : 'Not Applied'),
      status: job.status,
      interviewDate: appRecord?.interviewDate ? new Date(appRecord.interviewDate).toLocaleString() : 'N/A',
      followUpDate: appRecord?.followUpDate ? new Date(appRecord.followUpDate).toLocaleDateString() : 'N/A',
      notes: appRecord?.notes || analysis?.reasoning || 'Automated by JobPilot AI'
    };
  });
}

/**
 * Generate standard CSV formatted content suitable for Excel (.csv / .xlsx compatible)
 */
export function generateApplicationsCsv(jobs: Job[]): string {
  const rows = formatJobsToExcelRows(jobs);

  const headers = [
    'ID',
    'Company',
    'Role',
    'Source',
    'Job URL',
    'Application URL',
    'Location',
    'Remote',
    'Salary',
    'Match Score',
    'Technical Score',
    'Experience Score',
    'Matched Skills',
    'Missing Skills',
    'Resume Version',
    'Date Discovered',
    'Date Shortlisted',
    'Date Applied',
    'Status',
    'Interview Date',
    'Follow-up Date',
    'Notes'
  ];

  const escapeCsv = (str: string | number) => {
    const stringVal = String(str ?? '');
    if (stringVal.includes(',') || stringVal.includes('"') || stringVal.includes('\n')) {
      return `"${stringVal.replace(/"/g, '""')}"`;
    }
    return stringVal;
  };

  const csvLines = [
    headers.map(escapeCsv).join(','),
    ...rows.map(r => [
      r.id,
      r.company,
      r.role,
      r.source,
      r.jobUrl,
      r.applicationUrl,
      r.location,
      r.remote,
      r.salary,
      r.matchScore,
      r.technicalScore,
      r.experienceScore,
      r.matchedSkills,
      r.missingSkills,
      r.resumeVersion,
      r.dateDiscovered,
      r.dateShortlisted,
      r.dateApplied,
      r.status,
      r.interviewDate,
      r.followUpDate,
      r.notes
    ].map(escapeCsv).join(','))
  ];

  return csvLines.join('\n');
}

/**
 * Generate a styled Excel Workbook (.xlsx) using ExcelJS
 */
export async function generateApplicationsXlsxBuffer(jobs: Job[]): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'JobPilot AI Agent';
  workbook.created = new Date();

  const worksheet = workbook.addWorksheet('Job Applications Tracker', {
    views: [{ state: 'frozen', ySplit: 1 }]
  });

  worksheet.columns = [
    { header: 'Job ID', key: 'id', width: 22 },
    { header: 'Company', key: 'company', width: 20 },
    { header: 'Role Title', key: 'role', width: 28 },
    { header: 'Source Platform', key: 'source', width: 22 },
    { header: 'Job URL', key: 'jobUrl', width: 35 },
    { header: 'Location', key: 'location', width: 22 },
    { header: 'Remote', key: 'remote', width: 12 },
    { header: 'Salary (LPA)', key: 'salary', width: 18 },
    { header: 'Match Score', key: 'matchScore', width: 15 },
    { header: 'Technical %', key: 'technicalScore', width: 15 },
    { header: 'Matched Skills', key: 'matchedSkills', width: 35 },
    { header: 'Missing Skills', key: 'missingSkills', width: 20 },
    { header: 'Tailored Resume Version', key: 'resumeVersion', width: 28 },
    { header: 'Date Discovered', key: 'dateDiscovered', width: 18 },
    { header: 'Date Applied', key: 'dateApplied', width: 18 },
    { header: 'Application Status', key: 'status', width: 20 },
    { header: 'Interview Date', key: 'interviewDate', width: 20 },
    { header: 'Notes & AI Reasoning', key: 'notes', width: 45 }
  ];

  // Header row styling
  const headerRow = worksheet.getRow(1);
  headerRow.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF1E293B' } // Dark Slate
  };
  headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
  headerRow.height = 28;

  const rows = formatJobsToExcelRows(jobs);

  rows.forEach((r, idx) => {
    const row = worksheet.addRow({
      id: r.id,
      company: r.company,
      role: r.role,
      source: r.source,
      jobUrl: r.jobUrl,
      location: r.location,
      remote: r.remote,
      salary: r.salary,
      matchScore: r.matchScore,
      technicalScore: r.technicalScore,
      matchedSkills: r.matchedSkills,
      missingSkills: r.missingSkills,
      resumeVersion: r.resumeVersion,
      dateDiscovered: r.dateDiscovered,
      dateApplied: r.dateApplied,
      status: r.status,
      interviewDate: r.interviewDate,
      notes: r.notes
    });

    // Zebra striping
    if (idx % 2 === 1) {
      row.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFF8FAFC' }
      };
    }

    // Status highlighting
    const statusCell = row.getCell('status');
    if (r.status === 'APPLIED') {
      statusCell.font = { bold: true, color: { argb: 'FF0D9488' } };
    } else if (r.status === 'INTERVIEW') {
      statusCell.font = { bold: true, color: { argb: 'FF16A34A' } };
    } else if (r.status === 'READY_TO_APPLY' || r.status === 'SHORTLISTED') {
      statusCell.font = { bold: true, color: { argb: 'FF6366F1' } };
    }

    row.alignment = { vertical: 'middle' };
  });

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}
