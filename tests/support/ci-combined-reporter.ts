import * as report from 'multiple-cucumber-html-reporter';
import * as fs from 'fs-extra';
import * as path from 'path';

/**
 * CI Combined Reporter
 * Merges all browser JSON reports and generates a unified HTML report using multiple-cucumber-html-reporter
 * Specifically designed for CI/CD environments where all browser tests run in parallel
 */
export class CICombinedReporter {
  private static reportDir = path.join(process.cwd(), 'reports');
  private static browsers = ['chromium', 'firefox', 'webkit'];

  /**
   * Merge all browser JSON reports and generate unified HTML using multiple-cucumber-html-reporter
   */
  static async generateMergedReport(): Promise<void> {
    try {
      console.log('Generating merged CI report from all browsers using multiple-cucumber-html-reporter...');

      // Ensure directories exist
      await fs.ensureDir(this.reportDir);

      // Create a separate directory for browser-specific JSON files
      const jsonDir = path.join(this.reportDir, 'json');
      await fs.ensureDir(jsonDir);

      // Collect and copy all JSON reports with proper naming
      const collectedBrowsers = await this.collectAndCopyJsonReports(jsonDir);
      
      if (collectedBrowsers.length === 0) {
        console.error('No test reports found to merge.');
        return;
      }

      // Get browser metadata
      const browserMetadata = await this.getBrowserMetadata();

      // Generate individual browser reports AND the combined overview
      // The generateIndividualBrowserReports method will handle everything
      await this.generateIndividualBrowserReports(collectedBrowsers, jsonDir, browserMetadata);

      console.log('✓ Combined HTML report generated successfully using multiple-cucumber-html-reporter!');
      console.log(`  Location: ${path.join(this.reportDir, 'index.html')}`);
      console.log(`  Browsers included: ${browserMetadata.tested.join(', ')}`);
      console.log(`  Total features tested: ${browserMetadata.totalFeatures}`);

      // Copy screenshots and traces to report directory
      await this.copyAttachmentsToReport();

    } catch (error) {
      console.error('Error generating merged CI report:', error);
      throw error;
    }
  }

  /**
   * Collect all JSON report files and organize them for multi-browser reporting
   * Creates separate browser-named JSON files that the library can process
   */
  private static async collectAndCopyJsonReports(jsonDir: string): Promise<string[]> {
    const collectedBrowsers: string[] = [];

    // Check in downloaded-reports directory (CI artifact structure)
    const downloadedDir = path.join(process.cwd(), 'downloaded-reports');
    
    for (const browser of this.browsers) {
      try {
        // Try different possible paths for JSON reports
        const possiblePaths = [
          path.join(downloadedDir, `json-report-${browser}`, 'cucumber-report.json'),
          path.join(downloadedDir, `${browser}-json-report`, 'cucumber-report.json'),
          path.join(this.reportDir, browser, 'cucumber-report.json'),
          path.join(this.reportDir, `${browser}`, 'cucumber-report.json')
        ];

        let sourceJsonPath = '';

        for (const jsonFile of possiblePaths) {
          if (fs.existsSync(jsonFile)) {
            sourceJsonPath = jsonFile;
            console.log(`  ✓ Found ${browser} report: ${jsonFile}`);
            break;
          }
        }

        if (sourceJsonPath) {
          // Copy JSON file - use simple naming pattern
          // The library will detect browser from filename pattern
          const targetPath = path.join(jsonDir, `${browser}.json`);
          await fs.copy(sourceJsonPath, targetPath);
          console.log(`  ✓ Copied ${browser} report to: ${targetPath}`);
          collectedBrowsers.push(browser);
        } else {
          console.warn(`  ⚠ No valid report found for ${browser}`);
        }
      } catch (error) {
        console.warn(`  ⚠ Could not process ${browser} report:`, error);
      }
    }

    return collectedBrowsers;
  }

  /**
   * Generate individual browser reports with proper metadata
   * This ensures each browser is correctly identified in the combined report
   */
  private static async generateIndividualBrowserReports(
    browsers: string[], 
    jsonDir: string, 
    browserMetadata: { tested: string[], totalFeatures: number }
  ): Promise<void> {
    console.log(`  ℹ Generating individual reports for ${browsers.length} browser(s)...`);
    
    for (const browser of browsers) {
      try {
        const browserJsonPath = path.join(jsonDir, `${browser}.json`);
        if (!fs.existsSync(browserJsonPath)) continue;

        // Create browser-specific subdirectory
        const browserSubDir = path.join(jsonDir, browser);
        await fs.ensureDir(browserSubDir);

        // Copy the JSON to the browser subdirectory
        const targetJsonPath = path.join(browserSubDir, 'cucumber-report.json');
        await fs.copy(browserJsonPath, targetJsonPath);

        // Generate report for this specific browser with metadata
        report.generate({
          jsonDir: browserSubDir,
          reportPath: path.join(this.reportDir, `browser-report-${browser}`),
          reportName: `${browser.charAt(0).toUpperCase() + browser.slice(1)} Test Report`,
          metadata: {
            browser: {
              name: browser.charAt(0).toUpperCase() + browser.slice(1),
              version: 'latest'
            },
            platform: {
              name: process.platform,
              version: process.version
            }
          }
        });

        console.log(`  ✓ Generated individual report for ${browser}`);
      } catch (error) {
        console.warn(`  ⚠ Could not generate report for ${browser}:`, error);
      }
    }

    // Now generate the combined overview report
    // Point to the root JSON directory which contains all browser-named JSON files
    const combinedJsonDir = path.join(this.reportDir, 'json-combined');
    await fs.ensureDir(combinedJsonDir);
    
    // Copy all browser JSON files to the combined directory
    for (const browser of browsers) {
      const sourceJson = path.join(jsonDir, `${browser}.json`);
      if (fs.existsSync(sourceJson)) {
        await fs.copy(sourceJson, path.join(combinedJsonDir, `${browser}.json`));
      }
    }

    // Generate the combined overview report
    report.generate({
      jsonDir: combinedJsonDir,
      reportPath: this.reportDir,
      reportName: 'Combined Cross-Browser Test Report',
      pageTitle: 'Cucumber Playwright - All Browsers Test Results',
      displayDuration: true,
      displayReportTime: true,
      customData: {
        title: 'Cross-Browser Test Execution Summary',
        data: [
          { label: 'Project', value: 'Cucumber Playwright Framework' },
          { label: 'Release', value: '1.0.0' },
          { label: 'Execution Date', value: new Date().toLocaleString() },
          { label: 'Browsers Tested', value: browserMetadata.tested.join(', ') },
          { label: 'Total Browsers', value: browserMetadata.tested.length.toString() },
          { label: 'Total Features', value: browserMetadata.totalFeatures.toString() },
          { label: 'CI Environment', value: 'GitHub Actions' },
          { label: 'Environment', value: process.env.BASE_URL || 'https://demowebshop.tricentis.com/' }
        ]
      }
    });

    console.log(`  ✓ Generated combined overview report`);
  }

  /**
   * Get metadata about tested browsers
   */
  private static async getBrowserMetadata(): Promise<{ tested: string[], totalFeatures: number }> {
    const tested: string[] = [];
    let totalFeatures = 0;

    const downloadedDir = path.join(process.cwd(), 'downloaded-reports');
    
    for (const browser of this.browsers) {
      const possiblePaths = [
        path.join(downloadedDir, `json-report-${browser}`, 'cucumber-report.json'),
        path.join(downloadedDir, `${browser}-json-report`, 'cucumber-report.json'),
        path.join(this.reportDir, browser, 'cucumber-report.json')
      ];

      for (const jsonFile of possiblePaths) {
        if (fs.existsSync(jsonFile)) {
          tested.push(browser);
          const data = await fs.readJson(jsonFile);
          if (Array.isArray(data)) {
            totalFeatures += data.length;
          }
          break;
        }
      }
    }

    return { tested, totalFeatures };
  }

  /**
   * Copy screenshots and traces to report directory for better access
   */
  private static async copyAttachmentsToReport(): Promise<void> {
    try {
      const screenshotsDir = path.join(process.cwd(), 'screenshots');
      const tracesDir = path.join(process.cwd(), 'traces');
      const reportScreenshotsDir = path.join(this.reportDir, 'screenshots');
      const reportTracesDir = path.join(this.reportDir, 'traces');

      // Copy screenshots from browser-specific directories
      for (const browser of this.browsers) {
        const browserScreenshotsDir = path.join(this.reportDir, browser, 'screenshots');
        if (fs.existsSync(browserScreenshotsDir)) {
          await fs.ensureDir(reportScreenshotsDir);
          await fs.copy(browserScreenshotsDir, path.join(reportScreenshotsDir, browser), { overwrite: true });
        }

        const browserTracesDir = path.join(this.reportDir, browser, 'traces');
        if (fs.existsSync(browserTracesDir)) {
          await fs.ensureDir(reportTracesDir);
          await fs.copy(browserTracesDir, path.join(reportTracesDir, browser), { overwrite: true });
        }
      }

      // Also copy from root directories if they exist
      if (fs.existsSync(screenshotsDir)) {
        await fs.ensureDir(reportScreenshotsDir);
        await fs.copy(screenshotsDir, reportScreenshotsDir, { overwrite: true });
        console.log('  ✓ Screenshots copied to report directory');
      }

      if (fs.existsSync(tracesDir)) {
        await fs.ensureDir(reportTracesDir);
        await fs.copy(tracesDir, reportTracesDir, { overwrite: true });
        console.log('  ✓ Trace files copied to report directory');
      }
    } catch (error) {
      console.warn('  ⚠ Warning: Could not copy attachments:', error);
    }
  }
}

// If this file is run directly, generate the merged report
if (require.main === module) {
  CICombinedReporter.generateMergedReport()
    .then(() => {
      console.log('\n✅ CI merged report generation completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ CI merged report generation failed:', error);
      process.exit(1);
    });
}
