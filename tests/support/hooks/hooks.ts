import { Before, After, BeforeAll, AfterAll } from "@cucumber/cucumber";
import { expect } from "@playwright/test";
import { BrowserManager } from "../helpers/browserManager";
import { getLogger, Logger } from "../helpers/logger";
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Get BASE_URL from environment or CLI, with fallback
const BASE_URL = process.env.BASE_URL || 'https://demowebshop.tricentis.com/';

BeforeAll(async () => {
  await BrowserManager.launchBrowser();
  const logger = getLogger();
  logger.info(`Tests will run against: ${BASE_URL}`);
  logger.info(`Log file location: ${logger.getLogFilePath()}`);
});

AfterAll(async () => {
  await BrowserManager.closeBrowser();
  const logger = getLogger();
  logger.info('Test execution completed');
  Logger.closeAll();
});

Before(async function (scenario) {
  // Get logger instance for this worker
  const logger = getLogger();
  
  // Get browser type from environment
  const browserType = (process.env.BROWSER || 'chromium').toLowerCase();
  
  // Log scenario start with browser info
  logger.scenarioStart(scenario.pickle.name, browserType);
  const browser = BrowserManager.getBrowser();
  const context = await browser.newContext();
  
  // Start tracing for this scenario
  await context.tracing.start({ screenshots: true, snapshots: true });
  
  this.page = await context.newPage();
  this.context = context;
  this.logger = logger;
  
  logger.info('Navigating to home page');
  this.log('Navigating to home page');
  await this.page.goto(BASE_URL);
  await expect(this.page).toHaveTitle('Demo Web Shop');
  logger.info('Successfully navigated to home page');
  this.log('On home page');
});

After(async function (scenario) {
  // Get logger from context
  const logger = this.logger;
  
  // Get browser type from environment
  const browserType = (process.env.BROWSER || 'chromium').toLowerCase();
  
  // Check if scenario failed
  const isFailed = scenario.result?.status === 'FAILED';
  
  if (isFailed) {
    // Create screenshots directory if it doesn't exist
    const fs = require('fs');
    const path = require('path');
    const screenshotDir = path.join(process.cwd(), 'screenshots');
    const traceDir = path.join(process.cwd(), 'traces');
    
    if (!fs.existsSync(screenshotDir)) {
      fs.mkdirSync(screenshotDir, { recursive: true });
    }
    if (!fs.existsSync(traceDir)) {
      fs.mkdirSync(traceDir, { recursive: true });
    }
    
    // Capture screenshot for failed scenario
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const sanitizedScenarioName = scenario.pickle.name.replace(/[^a-zA-Z0-9]/g, '_');
    const screenshotPath = path.join(screenshotDir, `${sanitizedScenarioName}_${browserType}_${timestamp}.png`);
    
    await this.page.screenshot({ path: screenshotPath, fullPage: true });
    logger.error(`Screenshot captured for failed scenario: ${screenshotPath}`);
    
    // Attach screenshot to Cucumber report
    const screenshot = fs.readFileSync(screenshotPath);
    this.attach(screenshot, 'image/png');
    
    // Stop tracing and save trace file
    const tracePath = path.join(traceDir, `${sanitizedScenarioName}_${browserType}_${timestamp}.zip`);
    await this.context.tracing.stop({ path: tracePath });
    logger.error(`Trace captured for failed scenario: ${tracePath}`);
  } else {
    // Stop tracing without saving for passed tests
    await this.context.tracing.stop();
  }
  
  logger.debug('Closing page after test');
  await this.page.close();
  await this.context.close();
  
  // Log scenario end with status and browser info
  const status = isFailed ? 'FAILED' : 'PASSED';
  logger.scenarioEnd(scenario.pickle.name, status, browserType);
});