import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { execFile, spawnSync } from 'child_process';
import { promisify } from 'util';
import { UserProfile, Job, TailoredResume } from '../../src/types';
import { generateLatexResumeCode, saveResumeLatexFile } from './latexGenerator';

const execFileAsync = promisify(execFile);
const STORAGE_RESUMES_DIR = path.join(process.cwd(), 'storage', 'resumes');

// Ensure directory exists
if (!fs.existsSync(STORAGE_RESUMES_DIR)) {
  fs.mkdirSync(STORAGE_RESUMES_DIR, { recursive: true });
}

export interface GeneratedResumeFile {
  versionId: string;
  fileName: string;
  filePath: string;
  fileSize: number;
  generatedAt: string;
}

/**
 * Finds the tectonic binary executable (bundled locally in ./bin or in PATH)
 */
function findTectonicExecutable(): string | null {
  const localBin = path.join(process.cwd(), 'bin', process.platform === 'win32' ? 'tectonic.exe' : 'tectonic');
  if (fs.existsSync(localBin)) {
    return localBin;
  }

  try {
    const cmd = process.platform === 'win32' ? 'where.exe' : 'which';
    const res = spawnSync(cmd, ['tectonic'], { encoding: 'utf-8' });
    if (res.stdout && res.stdout.trim()) {
      return res.stdout.trim().split(/\r?\n/)[0];
    }
  } catch {}

  return null;
}

/**
 * Compiles a .tex file directly into a PDF using tectonic or online fallback
 * Produces pixel-perfect output identical to Overleaf
 */
export async function compileLatexToPdf(texFilePath: string, outputDir: string): Promise<boolean> {
  const tectonicPath = findTectonicExecutable();
  if (tectonicPath) {
    try {
      await execFileAsync(tectonicPath, [texFilePath, '--outdir', outputDir], {
        timeout: 45000,
        windowsHide: true
      });
      const expectedPdf = path.join(outputDir, path.basename(texFilePath, '.tex') + '.pdf');
      if (fs.existsSync(expectedPdf)) {
        return true;
      }
    } catch (err: any) {
      console.warn('[LaTeX] Local Tectonic compilation warning:', err?.message || err);
    }
  }

  // Secondary cloud fallback via LaTeX.Online
  try {
    const texContent = fs.readFileSync(texFilePath, 'utf-8');
    const compileUrl = `https://latexonline.cc/compile?text=${encodeURIComponent(texContent)}`;
    const response = await fetch(compileUrl, { method: 'GET', signal: AbortSignal.timeout(20000) });
    if (response.ok) {
      const buffer = Buffer.from(await response.arrayBuffer());
      const pdfBase = path.basename(texFilePath, '.tex') + '.pdf';
      const pdfOutPath = path.join(outputDir, pdfBase);
      fs.writeFileSync(pdfOutPath, buffer);
      return true;
    }
  } catch (onlineErr: any) {
    console.warn('[LaTeX] Online compiler fallback warning:', onlineErr?.message || onlineErr);
  }

  return false;
}

/**
 * Generates an ATS-compliant PDF resume compiled directly from LaTeX to match Overleaf
 */
export async function generateResumePdf(
  profile: UserProfile,
  job?: Job,
  tailored?: TailoredResume
): Promise<GeneratedResumeFile> {
  const versionId = tailored?.versionId || `${job?.company ? job.company.replace(/[^a-zA-Z0-9]/g, '_') : 'Master'}_v${Date.now()}`;
  const fileName = `${versionId}.pdf`;
  const filePath = path.join(STORAGE_RESUMES_DIR, fileName);

  // 1. Generate canonical LaTeX code strictly matching Atul's template
  const latexCode = generateLatexResumeCode(profile, job, tailored);
  if (tailored) {
    tailored.latexCode = latexCode;
  }
  const texFilePath = saveResumeLatexFile(versionId, latexCode);

  // 2. Compile directly with LaTeX engine (Tectonic / XeTeX) so it looks 100% like Overleaf
  const compiled = await compileLatexToPdf(texFilePath, STORAGE_RESUMES_DIR);
  if (compiled && fs.existsSync(filePath)) {
    const stats = fs.statSync(filePath);
    return {
      versionId,
      fileName,
      filePath,
      fileSize: stats.size,
      generatedAt: new Date().toISOString()
    };
  }

  // 3. Fallback to secondary PDFKit renderer if compiler is completely unavailable
  console.warn('[PDF] Falling back to secondary PDFKit renderer for', versionId);
  return renderFallbackPdfKit(profile, job, tailored, versionId, fileName, filePath);
}

/**
 * Secondary fallback using PDFKit when no LaTeX compiler is available
 */
function renderFallbackPdfKit(
  profile: UserProfile,
  job?: Job,
  tailored?: TailoredResume,
  versionId?: string,
  fileName?: string,
  filePath?: string
): Promise<GeneratedResumeFile> {
  const vId = versionId || `v_${Date.now()}`;
  const fName = fileName || `${vId}.pdf`;
  const fPath = filePath || path.join(STORAGE_RESUMES_DIR, fName);

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: 'A4',
      margins: { top: 40, bottom: 40, left: 45, right: 45 }
    });

    const writeStream = fs.createWriteStream(fPath);
    doc.pipe(writeStream);

    const primaryColor = '#0f172a';
    const accentColor = '#2563eb';
    const darkGray = '#334155';
    const mutedGray = '#64748b';

    // 1. Header
    doc.font('Helvetica-Bold').fontSize(22).fillColor(primaryColor).text(profile.fullName, { align: 'center' });
    doc.moveDown(0.2);

    const contactParts = [
      profile.email,
      profile.phone,
      profile.location,
      profile.linkedinUrl ? 'LinkedIn' : null,
      profile.githubUrl ? 'GitHub' : null,
      profile.portfolioUrl ? 'Portfolio' : null
    ].filter(Boolean).join('  |  ');

    doc.font('Helvetica').fontSize(9).fillColor(darkGray).text(contactParts, { align: 'center' });
    doc.moveDown(0.8);

    const renderSectionHeader = (title: string) => {
      doc.moveDown(0.5);
      doc.font('Helvetica-Bold').fontSize(11).fillColor(accentColor).text(title.toUpperCase());
      const currentY = doc.y;
      doc.strokeColor('#cbd5e1').lineWidth(0.75).moveTo(45, currentY + 2).lineTo(550, currentY + 2).stroke();
      doc.moveDown(0.5);
    };

    // 2. Professional Summary
    renderSectionHeader('Professional Summary');
    const summaryText = tailored?.tailoredSummary || profile.summary || 
      `${profile.currentRole} with ${profile.yearsOfExperience}+ years of experience.`;
    doc.font('Helvetica').fontSize(9.5).fillColor(darkGray).text(summaryText, {
      align: 'justify',
      lineGap: 2.5
    });

    // 3. Technical Skills
    renderSectionHeader('Technical Skills');
    if (tailored?.orderedSkills && tailored.orderedSkills.length > 0) {
      for (const cat of tailored.orderedSkills) {
        doc.font('Helvetica-Bold').fontSize(9).fillColor(primaryColor).text(`${cat.category}: `, { continued: true });
        doc.font('Helvetica').fontSize(9).fillColor(darkGray).text(cat.skills.join(', '));
      }
    }

    // 4. Experience
    renderSectionHeader('Experience');
    const experiences = profile.experience || [];
    experiences.forEach((exp, idx) => {
      doc.font('Helvetica-Bold').fontSize(10).fillColor(primaryColor).text(exp.role, { continued: true });
      doc.font('Helvetica-Bold').fontSize(10).fillColor(accentColor).text(` — ${exp.company}`, { continued: true });
      doc.font('Helvetica-Oblique').fontSize(8.5).fillColor(mutedGray).text(` (${exp.startDate} - ${exp.endDate})`, { align: 'right' });

      const bullets = exp.responsibilities || [];
      bullets.slice(0, 3).forEach(bullet => {
        doc.font('Helvetica').fontSize(9).fillColor(darkGray).text(`•  ${bullet}`, {
          indent: 10,
          lineGap: 2
        });
      });
      if (idx < experiences.length - 1) doc.moveDown(0.4);
    });

    // 5. Education
    renderSectionHeader('Education');
    (profile.education || []).forEach(edu => {
      doc.font('Helvetica-Bold').fontSize(9.5).fillColor(primaryColor).text(`${edu.degree} in ${edu.field}`, { continued: true });
      doc.font('Helvetica-Oblique').fontSize(8.5).fillColor(mutedGray).text(` (${edu.startYear} - ${edu.endYear})`, { align: 'right' });
      doc.font('Helvetica').fontSize(9).fillColor(darkGray).text(`${edu.institution}${edu.grade ? ` | Grade: ${edu.grade}` : ''}`);
    });

    doc.end();

    writeStream.on('finish', () => {
      const stats = fs.statSync(fPath);
      resolve({
        versionId: vId,
        fileName: fName,
        filePath: fPath,
        fileSize: stats.size,
        generatedAt: new Date().toISOString()
      });
    });

    writeStream.on('error', (err) => {
      reject(err);
    });
  });
}
