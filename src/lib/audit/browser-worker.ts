import type { Browser, BrowserContext, Page } from "playwright";
import { chromium } from "playwright";

export interface BrowserPageResult {
  html: string;
  title: string | null;
  statusCode: number | null;
  screenshot: Buffer;
  url: string;
}

export interface BrowserOptions {
  viewportWidth?: number;
  viewportHeight?: number;
  timeoutMs?: number;
}

export class BrowserWorker {
  private browser: Browser | null = null;

  async init(): Promise<void> {
    if (!this.browser) {
      this.browser = await chromium.launch({
        headless: true,
        args: ["--disable-dev-shm-usage", "--disable-gpu"],
      });
    }
  }

  async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }

  async capturePage(
    targetUrl: string,
    options: BrowserOptions = {}
  ): Promise<BrowserPageResult> {
    const {
      viewportWidth = 1280,
      viewportHeight = 720,
      timeoutMs = 30000,
    } = options;

    await this.init();

    const context: BrowserContext = await this.browser!.newContext({
      viewport: { width: viewportWidth, height: viewportHeight },
      userAgent:
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      javaScriptEnabled: true,
      ignoreHTTPSErrors: true,
    });

    const page: Page = await context.newPage();
    let statusCode: number | null = null;

    try {
      page.on("response", (response) => {
        if (response.url() === targetUrl || response.request().redirectedFrom()?.url() === targetUrl) {
          statusCode = response.status();
        }
      });

      await page.goto(targetUrl, {
        waitUntil: "domcontentloaded",
        timeout: timeoutMs,
      });

      await page.waitForTimeout(1000);

      const html = await page.content();
      const title = await page.title();

      const screenshot = await page.screenshot({
        type: "png",
        fullPage: false,
      });

      await context.close();

      return {
        html,
        title: title || null,
        statusCode,
        screenshot,
        url: page.url(),
      };
    } catch (error) {
      await context.close();
      throw error;
    }
  }
}
