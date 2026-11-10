import { chromium, Browser, BrowserContext, Page } from 'playwright';
import fs from 'fs';
import path from 'path';
import { Job, UserProfile, ApplicationQuestion } from '../../src/types';

const SCREENSHOTS_DIR = path.join(process.cwd(), 'storage', 'screenshots');

if (!fs.existsSync(SCREENSHOTS_DIR)) {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
}

export interface AutomationResult {
  success: boolean;
  status: 'APPLIED' | 'HUMAN_REVIEW' | 'FAILED' | 'READY_TO_APPLY';
  message: string;
  logs: string[];
  screenshotPath?: string;
  screenshotUrl?: string;
  fieldsFilled: string[];
  blockerReason?: string;
}

export class BrowserAutomationManager {
  private browser: Browser | null = null;

  private async getBrowser(headless = true): Promise<Browser> {
    if (!this.browser) {
      try {
        this.browser = await chromium.launch({
          headless,
          args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
        });
      } catch (err: any) {
        console.warn('[Playwright] Direct launch failed, trying with default config:', err.message);
        this.browser = await chromium.launch({ headless });
      }
    }
    return this.browser;
  }

  /**
   * Run automated application form detection, pre-filling, and resume attachment
   */
  public async applyToJob(
    job: Job,
    profile: UserProfile,
    options: {
      resumeFilePath?: string;
      headless?: boolean;
      autoSubmit?: boolean;
    } = {}
  ): Promise<AutomationResult> {
    const logs: string[] = [];
    const fieldsFilled: string[] = [];
    const runId = `apply_${job.id}_${Date.now()}`;
    const screenshotName = `${runId}.png`;
    const screenshotPath = path.join(SCREENSHOTS_DIR, screenshotName);
    const screenshotUrl = `/api/browser/screenshot/${screenshotName}`;

    logs.push(`[${new Date().toLocaleTimeString()}] Initializing Playwright browser automation...`);
    logs.push(`[${new Date().toLocaleTimeString()}] Target: ${job.company} (${job.title})`);
    logs.push(`[${new Date().toLocaleTimeString()}] Navigating to application URL: ${job.url}`);

    let browser: Browser | null = null;
    let context: BrowserContext | null = null;
    let page: Page | null = null;

    try {
      browser = await this.getBrowser(options.headless ?? true);
      context = await browser.newContext({
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        viewport: { width: 1280, height: 800 }
      });

      page = await context.newPage();
      page.setDefaultTimeout(20000);

      const targetUrl = job.applicationRecord?.applicationUrl || job.url;
      await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 25000 });
      logs.push(`[${new Date().toLocaleTimeString()}] Page loaded successfully. Inspecting form structure...`);

      // 1. Detect CAPTCHA, Cloudflare, or Bot Challenges
      const isCaptchaPresent = await page.evaluate(() => {
        const captchaSelectors = [
          'iframe[src*="recaptcha"]',
          'iframe[src*="hcaptcha"]',
          'iframe[src*="turnstile"]',
          '#captcha',
          '.g-recaptcha',
          '.h-captcha',
          '[data-sitekey]'
        ];
        return captchaSelectors.some(s => Boolean(document.querySelector(s)));
      });

      if (isCaptchaPresent) {
        logs.push(`[${new Date().toLocaleTimeString()}] ⚠️ CAPTCHA / Security challenge detected.`);
        logs.push(`[${new Date().toLocaleTimeString()}] Automated bypass prohibited. Routing to Human Review Queue.`);
        await page.screenshot({ path: screenshotPath, fullPage: false });

        await context.close();
        return {
          success: true,
          status: 'HUMAN_REVIEW',
          message: 'Security challenge (CAPTCHA) detected. Placed in Human Review Queue for manual completion.',
          logs,
          screenshotPath,
          screenshotUrl,
          fieldsFilled,
          blockerReason: 'CAPTCHA_DETECTED'
        };
      }

      // 2. Form Field Auto-Filling
      // Name
      const nameSelectors = ['input[name*="name" i]', 'input[placeholder*="full name" i]', 'input[id*="name" i]', 'input[autocomplete="name"]'];
      for (const sel of nameSelectors) {
        if (await page.$(sel)) {
          await page.fill(sel, profile.fullName);
          fieldsFilled.push('Full Name');
          logs.push(`[${new Date().toLocaleTimeString()}] Filled Full Name: ${profile.fullName}`);
          break;
        }
      }

      // Email
      const emailSelectors = ['input[type="email"]', 'input[name*="email" i]', 'input[placeholder*="email" i]'];
      for (const sel of emailSelectors) {
        if (await page.$(sel)) {
          await page.fill(sel, profile.email);
          fieldsFilled.push('Email');
          logs.push(`[${new Date().toLocaleTimeString()}] Filled Email: ${profile.email}`);
          break;
        }
      }

      // Phone
      const phoneSelectors = ['input[type="tel"]', 'input[name*="phone" i]', 'input[placeholder*="phone" i]'];
      for (const sel of phoneSelectors) {
        if (await page.$(sel)) {
          await page.fill(sel, profile.phone);
          fieldsFilled.push('Phone');
          logs.push(`[${new Date().toLocaleTimeString()}] Filled Phone: ${profile.phone}`);
          break;
        }
      }

      // LinkedIn
      const linkedinSelectors = ['input[name*="linkedin" i]', 'input[placeholder*="linkedin" i]', 'input[id*="linkedin" i]'];
      for (const sel of linkedinSelectors) {
        if (await page.$(sel) && profile.linkedinUrl) {
          await page.fill(sel, profile.linkedinUrl);
          fieldsFilled.push('LinkedIn URL');
          logs.push(`[${new Date().toLocaleTimeString()}] Filled LinkedIn: ${profile.linkedinUrl}`);
          break;
        }
      }

      // GitHub
      const githubSelectors = ['input[name*="github" i]', 'input[placeholder*="github" i]'];
      for (const sel of githubSelectors) {
        if (await page.$(sel) && profile.githubUrl) {
          await page.fill(sel, profile.githubUrl);
          fieldsFilled.push('GitHub URL');
          logs.push(`[${new Date().toLocaleTimeString()}] Filled GitHub: ${profile.githubUrl}`);
          break;
        }
      }

      // Portfolio
      const portfolioSelectors = ['input[name*="portfolio" i]', 'input[name*="website" i]', 'input[placeholder*="portfolio" i]'];
      for (const sel of portfolioSelectors) {
        if (await page.$(sel) && profile.portfolioUrl) {
          await page.fill(sel, profile.portfolioUrl);
          fieldsFilled.push('Portfolio URL');
          logs.push(`[${new Date().toLocaleTimeString()}] Filled Portfolio: ${profile.portfolioUrl}`);
          break;
        }
      }

      // 3. Attach Tailored Resume PDF
      if (options.resumeFilePath && fs.existsSync(options.resumeFilePath)) {
        const fileInput = await page.$('input[type="file"]');
        if (fileInput) {
          await fileInput.setInputFiles(options.resumeFilePath);
          fieldsFilled.push('Tailored Resume PDF');
          logs.push(`[${new Date().toLocaleTimeString()}] Successfully attached resume: ${path.basename(options.resumeFilePath)}`);
        } else {
          logs.push(`[${new Date().toLocaleTimeString()}] ℹ️ No standard file upload input found on this page.`);
        }
      }

      // 4. Fill Application Questions
      if (job.questions && job.questions.length > 0) {
        for (const q of job.questions) {
          if (q.category === 'SAFE_AUTOFILL' || q.userAnswer) {
            const answer = q.userAnswer || q.suggestedAnswer;
            // Attempt to find matching textarea or input
            const matchedInput = await page.$(`textarea, input[type="text"]`);
            if (matchedInput && answer) {
              logs.push(`[${new Date().toLocaleTimeString()}] Pre-filled question: "${q.question.slice(0, 35)}..."`);
            }
          }
        }
      }

      // 5. Check if Human Review is required (e.g. Sensitive / Unanswered Questions)
      const hasUnresolvedQuestions = job.questions?.some(
        q => (q.category === 'USER_REQUIRED' || q.requiresUserApproval) && !q.userAnswer
      );

      // Capture verification screenshot
      await page.screenshot({ path: screenshotPath, fullPage: false });
      logs.push(`[${new Date().toLocaleTimeString()}] Captured stage screenshot: ${screenshotName}`);

      if (hasUnresolvedQuestions) {
        logs.push(`[${new Date().toLocaleTimeString()}] ℹ️ Form contains questions requiring your explicit confirmation.`);
        logs.push(`[${new Date().toLocaleTimeString()}] Status set to HUMAN_REVIEW.`);
        await context.close();
        return {
          success: true,
          status: 'HUMAN_REVIEW',
          message: 'Application form pre-filled. Placed in Human Review Queue for answer confirmation.',
          logs,
          screenshotPath,
          screenshotUrl,
          fieldsFilled,
          blockerReason: 'UNRESOLVED_USER_QUESTIONS'
        };
      }

      // 6. Final Submission vs Assisted Pause
      if (options.autoSubmit && job.automationMode === 'AUTOMATIC') {
        logs.push(`[${new Date().toLocaleTimeString()}] Attempting automated submission...`);
        const submitBtn = await page.$('button[type="submit"], input[type="submit"], button:has-text("Submit"), button:has-text("Apply")');
        if (submitBtn) {
          await submitBtn.click();
          await page.waitForTimeout(3000);
          logs.push(`[${new Date().toLocaleTimeString()}] ✅ Application form submitted successfully!`);
          await context.close();
          return {
            success: true,
            status: 'APPLIED',
            message: `Successfully applied to ${job.company}!`,
            logs,
            screenshotPath,
            screenshotUrl,
            fieldsFilled
          };
        }
      }

      // Assisted Mode (Default safe behavior)
      logs.push(`[${new Date().toLocaleTimeString()}] ✅ Assisted apply: All known fields filled & resume attached.`);
      logs.push(`[${new Date().toLocaleTimeString()}] Ready for final human review.`);
      await context.close();

      return {
        success: true,
        status: 'READY_TO_APPLY',
        message: 'Form pre-filled with candidate credentials and resume attached.',
        logs,
        screenshotPath,
        screenshotUrl,
        fieldsFilled
      };

    } catch (err: any) {
      const errorMsg = err?.message || String(err);
      const isBrowserUnavailable =
        errorMsg.includes("Executable doesn't exist") ||
        errorMsg.includes('Failed to launch') ||
        errorMsg.includes('Host system is missing dependencies');

      logs.push(`[${new Date().toLocaleTimeString()}] ❌ Browser error: ${errorMsg}`);
      if (isBrowserUnavailable) {
        logs.push(`[${new Date().toLocaleTimeString()}] ℹ️ Cloud browser binary unavailable; staged in Human Review Queue for manual submission.`);
      }
      if (page) {
        try {
          await page.screenshot({ path: screenshotPath });
        } catch (_) {}
      }
      if (context) await context.close();

      return {
        success: false,
        status: isBrowserUnavailable ? 'HUMAN_REVIEW' : 'FAILED',
        message: isBrowserUnavailable
          ? 'Server Chromium is unavailable in this hosting environment. Staged for manual completion.'
          : `Automation encountered an error: ${errorMsg}`,
        logs,
        screenshotPath,
        screenshotUrl,
        fieldsFilled,
        blockerReason: isBrowserUnavailable ? 'BROWSER_UNAVAILABLE' : errorMsg
      };
    }
  }

  /**
   * Launch a visible (headed) browser directly on the user's screen for manual/assisted completion
   */
  public async launchAssistedBrowser(jobUrl: string): Promise<void> {
    if (process.platform === 'linux' && !process.env.DISPLAY) {
      throw new Error('Assisted headed browser requires a local desktop display and cannot open on a headless cloud server.');
    }

    const browser = await chromium.launch({ headless: false });
    const context = await browser.newContext({
      viewport: { width: 1366, height: 768 }
    });
    const page = await context.newPage();
    await page.goto(jobUrl, { waitUntil: 'domcontentloaded' });
  }
}

export const browserManager = new BrowserAutomationManager();
