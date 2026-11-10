import fs from 'fs';
import path from 'path';
import { ProjectDoc } from '../src/types';

export function loadProjectDocsFromStorage(): ProjectDoc[] {
  const docsDir = path.join(process.cwd(), 'storage', 'projectDocs');
  if (!fs.existsSync(docsDir)) {
    return [];
  }

  const files = fs.readdirSync(docsDir).filter(f => f.endsWith('.md'));
  const projectDocs: ProjectDoc[] = [];

  for (const file of files) {
    try {
      const filePath = path.join(docsDir, file);
      const content = fs.readFileSync(filePath, 'utf-8');

      // 1. Extract Project Name
      const nameMatch = content.match(/-\s*\*\*Project Name\*\*:\s*([^\r\n]+)/i);
      let rawTitle = nameMatch ? nameMatch[1].trim() : file.replace('.md', '');
      rawTitle = rawTitle.replace(/^(VisionMap:\s*|Defence\+\s*AI:\s*|LexAid\s*AI:\s*|WinSights\s*[^:]*:\s*)/i, '').trim();

      // Clean canonical title
      let title = rawTitle;
      if (title.toLowerCase().includes('legal case')) title = 'Legal Case Automation';
      else if (title.toLowerCase().includes('patient community')) title = 'Patient Community Network';
      else if (title.toLowerCase().includes('healthcare research') || title.toLowerCase().includes('patienthub')) title = 'Healthcare Research Application';
      else if (title.toLowerCase().includes('forest') || title.toLowerCase().includes('environmental') || title.toLowerCase().includes('deforestation')) title = 'Environmental Monitoring Dashboard';
      else if (title.toLowerCase().includes('financial') || title.toLowerCase().includes('cma') || title.toLowerCase().includes('report generator')) title = 'Financial Projection Tool';
      else if (title.toLowerCase().includes('multi-tenant') || title.toLowerCase().includes('management system')) title = 'Multi-Tenant Enterprise Platform';
      else if (title.toLowerCase().includes('whiteboard') || title.toLowerCase().includes('visionmap')) title = 'Collaborative Whiteboard Application';

      // ID
      const id = `doc_${title.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;

      // Role
      const roleMatch = content.match(/-\s*\*\*Role\s*(?:\/\s*Title)?\*\*:\s*([^\r\n]+)/i);
      const role = roleMatch ? roleMatch[1].trim() : 'Full Stack Developer';

      // Context
      const contextMatch = content.match(/-\s*\*\*Context\s*(?:\/\s*Company)?\*\*:\s*([^\r\n]+)/i);
      const companyOrContext = contextMatch ? contextMatch[1].trim() : (file.toLowerCase().includes('personal') ? 'Personal Project' : 'SidLabs LLP');
      const category = companyOrContext.toLowerCase().includes('personal') ? 'Personal Project' : 'Work Experience';

      // Technologies
      const techSectionMatch = content.match(/(?:####|###)\s*2\.\s*Technical Stack Taxonomy([\s\S]*?)(?:####\s*3|###\s*3|---)/i);
      const technologies: string[] = [];
      if (techSectionMatch) {
        const lines = techSectionMatch[1].split('\n');
        for (const line of lines) {
          const match = line.match(/-\s*\*\*[^*]+\*\*:\s*([^\r\n]+)/);
          if (match) {
            const items = match[1].split(/[,|]/).map(s => s.trim().replace(/\([^)]*\)/g, '').trim()).filter(Boolean);
            for (const item of items) {
              if (item.length > 1 && item.length < 35 && !technologies.includes(item)) {
                technologies.push(item);
              }
            }
          }
        }
      }

      // Summary
      const summaryMatch = content.match(/-\s*\*\*Technical Solution\*\*:\s*([\s\S]*?)(?:---|\n\n#|####\s*4|###\s*4)/i);
      const summary = summaryMatch ? summaryMatch[1].trim().replace(/\n+/g, ' ').slice(0, 450) : 'Full-stack production application built with modern architecture.';

      // Problem Solved
      const problemMatch = content.match(/-\s*\*\*Problem Statement\*\*:\s*([\s\S]*?)(?:-\s*\*\*Technical Solution\*\*|---)/i);
      const problemSolved = problemMatch ? problemMatch[1].trim().replace(/\n+/g, ' ').slice(0, 450) : 'Engineered scalable solution addressing enterprise bottlenecks.';

      // Bullet Points Pool
      const bulletsSectionMatch = content.match(/(?:####\s*6|###\s*6)\.\s*Ready-to-Use ATS Resume Bullet Points Pool[^\n]*\n([\s\S]*?)(?:---|###\s*7|$)/i);
      const bulletPointsPool: string[] = [];
      if (bulletsSectionMatch) {
        const bulletLines = bulletsSectionMatch[1].split('\n');
        for (const bl of bulletLines) {
          const clean = bl.trim().replace(/^[*•-]\s*/, '').trim();
          if (clean.length > 25 && !clean.startsWith('(') && !clean.startsWith('#')) {
            bulletPointsPool.push(clean);
          }
        }
      }

      // Key Achievements
      const metricsSectionMatch = content.match(/(?:####\s*5|###\s*5)\.\s*Quantified Performance & Business Metrics([\s\S]*?)(?:---|####\s*6|###\s*6)/i);
      const keyAchievements: string[] = [];
      if (metricsSectionMatch) {
        const metricLines = metricsSectionMatch[1].split('\n');
        for (const ml of metricLines) {
          const clean = ml.trim().replace(/^[*•-]\s*/, '').trim();
          if (clean.length > 15) {
            keyAchievements.push(clean);
          }
        }
      }

      // URLs if personal project
      let liveUrl = undefined;
      let demoUrl = undefined;
      let githubUrl = undefined;
      if (category === 'Personal Project' || title.includes('Whiteboard')) {
        liveUrl = 'https://vision-map-psi.vercel.app/';
        demoUrl = 'https://drive.google.com/file/d/1ns4KWCwO-QIQ7Ji2xOfByeqClSMt-WEo/view?usp=sharing';
        githubUrl = 'https://github.com/AtulKaple';
      }

      projectDocs.push({
        id,
        title,
        category,
        companyOrContext,
        role,
        technologies: technologies.slice(0, 16),
        summary,
        problemSolved,
        architectureOverview: `Modular production architecture leveraging ${technologies.slice(0, 6).join(', ')} with resilient data pipeline and performance optimizations.`,
        keyAchievements: keyAchievements.slice(0, 6),
        bulletPointsPool: bulletPointsPool.length > 0 ? bulletPointsPool : [summary],
        fullMarkdown: content,
        liveUrl,
        demoUrl,
        githubUrl,
        updatedAt: new Date().toISOString()
      });
    } catch (err) {
      console.warn(`Error parsing project doc ${file}:`, err);
    }
  }

  return projectDocs;
}
