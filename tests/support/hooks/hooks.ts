import { Before, After, BeforeAll, AfterAll } from "@cucumber/cucumber";
import { expect } from "@playwright/test";
import { BrowserManager } from "../helpers/browserManager";
import { logger } from "../helpers/logger";
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Get BASE_URL from environment or CLI, with fallback
const BASE_URL = process.env.BASE_URL || 'https://demowebshop.tricentis.com/';

BeforeAll(async () => {
  await BrowserManager.launchBrowser();
  logger.info(`Tests will run against: ${BASE_URL}`);
  logger.info(`Log file location: ${logger.getLogFilePath()}`);
});

AfterAll(async () => {
  await BrowserManager.closeBrowser();
  logger.info('Test execution completed');
  logger.close();
});

Before(async function (scenario) {
  // Get browser type from environment
  const browserType = (process.env.BROWSER || 'chromium').toLowerCase();
  
  // Log scenario start with browser info
  logger.scenarioStart(scenario.pickle.name, browserType);
  const browser = BrowserManager.getBrowser();
  this.page = await browser.newPage();
  logger.info('Navigating to home page');
  this.log('Navigating to home page');
  await this.page.goto(BASE_URL);
  await expect(this.page).toHaveTitle('Demo Web Shop');
  logger.info('Successfully navigated to home page');
  this.log('On home page');
});

After(async function (scenario) {
  logger.debug('Closing page after test');
  await this.page.close();
  
  // Get browser type from environment
  const browserType = (process.env.BROWSER || 'chromium').toLowerCase();
  
  // Log scenario end with status and browser info
  const status = scenario.result?.status === 'PASSED' ? 'PASSED' : 'FAILED';
  logger.scenarioEnd(scenario.pickle.name, status, browserType);
});