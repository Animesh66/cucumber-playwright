import { chromium, firefox, webkit, Browser, BrowserType } from 'playwright';

export class BrowserManager {
  private static browser: Browser;

  /**
   * Launches the browser based on the BROWSER environment variable
   * Supported values: chromium, firefox, webkit
   * Default: chromium
   * Headless mode can be controlled via HEADLESS environment variable
   */
  static async launchBrowser(headless?: boolean): Promise<Browser> {
    const browserType = (process.env.BROWSER || 'chromium').toLowerCase();
    const isHeadless = headless !== undefined ? headless : process.env.HEADLESS === 'true';
    let browserEngine: BrowserType;

    switch (browserType) {
      case 'firefox':
        browserEngine = firefox;
        break;
      case 'webkit':
        browserEngine = webkit;
        break;
      case 'chromium':
      default:
        browserEngine = chromium;
        break;
    }

    console.log(`Launching ${browserType} browser in ${isHeadless ? 'headless' : 'headed'} mode...`);
    this.browser = await browserEngine.launch({ headless: isHeadless });
    return this.browser;
  }

  static getBrowser(): Browser {
    if (!this.browser) {
      throw new Error('Browser not initialized. Call launchBrowser() first.');
    }
    return this.browser;
  }

  static async closeBrowser(): Promise<void> {
    if (this.browser) {
      console.log(`Closing browser...`);
      await this.browser.close();
    }
  }
}
