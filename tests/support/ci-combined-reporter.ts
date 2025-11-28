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
   * Generate individual browser reports first, then combined
   * Each browser gets its own report with proper metadata
   */
  private static async generateIndividualBrowserReports(
    browsers: string[], 
    jsonDir: string, 
    browserMetadata: { tested: string[], totalFeatures: number }
  ): Promise<void> {
    console.log(`  ℹ Generating individual browser reports...`);
    
    // Map playwright browser names to standard display names
    const browserNameMap: any = {
      'chromium': 'chrome',
      'firefox': 'firefox',
      'webkit': 'safari'
    };
    
    // Generate individual reports for each browser with proper metadata
    for (const browser of browsers) {
      try {
        const browserJsonPath = path.join(jsonDir, `${browser}.json`);
        if (!fs.existsSync(browserJsonPath)) continue;

        const displayName = browserNameMap[browser] || browser;
        
        // Create browser-specific directory for individual report
        const browserReportDir = path.join(jsonDir, browser);
        await fs.ensureDir(browserReportDir);
        
        // Copy JSON to browser directory
        await fs.copy(browserJsonPath, path.join(browserReportDir, 'cucumber-report.json'));
        
        // Generate individual browser report with metadata
        report.generate({
          jsonDir: browserReportDir,
          reportPath: path.join(this.reportDir, `browser-report-${browser}`),
          reportName: `${displayName.charAt(0).toUpperCase() + displayName.slice(1)} Test Report`,
          pageTitle: `Test Results - ${displayName.toUpperCase()}`,
          displayDuration: true,
          displayReportTime: true,
          metadata: {
            browser: {
              name: displayName,
              version: 'latest'
            },
            device: 'CI/CD Pipeline',
            platform: {
              name: process.platform === 'darwin' ? 'macOS' : process.platform === 'win32' ? 'Windows' : 'Linux',
              version: process.version
            }
          }
        });
        
        console.log(`  ✓ Generated individual report for ${browser}`);
      } catch (error) {
        console.warn(`  ⚠ Could not generate ${browser} report:`, error);
      }
    }

    // Generate custom landing page that links to individual browser reports
    await this.generateCustomCombinedIndex(browsers, browserMetadata);
    console.log(`  ✓ Generated combined landing page`);
  }

  /**
   * Generate a custom combined index page with links to individual browser reports
   * This avoids the metadata issues with multiple-cucumber-html-reporter
   */
  private static async generateCustomCombinedIndex(
    browsers: string[], 
    browserMetadata: { tested: string[], totalFeatures: number }
  ): Promise<void> {
    // Get statistics from each browser report
    const browserStats = await this.getBrowserStats(browsers);
    
    // Calculate totals
    let totalPassed = 0;
    let totalFailed = 0;
    let totalSkipped = 0;
    
    browserStats.forEach(stat => {
      totalPassed += stat.passed;
      totalFailed += stat.failed;
      totalSkipped += stat.skipped;
    });
    
    const totalTests = totalPassed + totalFailed + totalSkipped;
    const successRate = totalTests > 0 ? ((totalPassed / totalTests) * 100).toFixed(1) : '0';
    const overallStatus = totalFailed > 0 ? 'failed' : 'passed';
    const timestamp = new Date().toLocaleString();

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Cucumber Playwright Test Report - All Browsers</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      padding: 20px;
    }
    .container { max-width: 1200px; margin: 0 auto; }
    .header {
      background: white;
      border-radius: 12px;
      padding: 30px;
      margin-bottom: 30px;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
    }
    .header h1 { font-size: 32px; color: #2d3748; margin-bottom: 10px; }
    .header .subtitle { color: #718096; font-size: 16px; }
    .timestamp { color: #a0aec0; font-size: 14px; margin-top: 10px; }
    .summary {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 20px;
      margin-bottom: 30px;
    }
    .summary-card {
      background: white;
      border-radius: 12px;
      padding: 25px;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
      text-align: center;
    }
    .summary-card .label {
      color: #718096;
      font-size: 14px;
      text-transform: uppercase;
      font-weight: 600;
      margin-bottom: 10px;
    }
    .summary-card .value { font-size: 36px; font-weight: bold; margin-bottom: 5px; }
    .summary-card.passed .value { color: #48bb78; }
    .summary-card.failed .value { color: #f56565; }
    .summary-card.skipped .value { color: #ecc94b; }
    .summary-card.total .value { color: #4299e1; }
    .summary-card.rate .value { color: ${overallStatus === 'passed' ? '#48bb78' : '#f56565'}; }
    .browsers-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
      gap: 25px;
      margin-bottom: 30px;
    }
    .browser-card {
      background: white;
      border-radius: 12px;
      padding: 25px;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
      transition: transform 0.3s ease, box-shadow 0.3s ease;
    }
    .browser-card:hover { transform: translateY(-5px); box-shadow: 0 15px 40px rgba(0, 0, 0, 0.3); }
    .browser-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 20px;
      padding-bottom: 15px;
      border-bottom: 2px solid #e2e8f0;
    }
    .browser-name {
      display: flex;
      align-items: center;
      gap: 12px;
      font-size: 24px;
      font-weight: bold;
      color: #2d3748;
    }
    .browser-icon {
      width: 40px;
      height: 40px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 24px;
    }
    .browser-icon.chromium { background: linear-gradient(135deg, #4285f4, #34a853); }
    .browser-icon.firefox { background: linear-gradient(135deg, #ff7139, #e66000); }
    .browser-icon.webkit { background: linear-gradient(135deg, #147efb, #0d5fd9); }
    .status-badge {
      padding: 6px 16px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
    }
    .status-badge.passed { background: #c6f6d5; color: #22543d; }
    .status-badge.failed { background: #fed7d7; color: #742a2a; }
    .browser-stats {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 15px;
      margin-bottom: 20px;
    }
    .stat-item { padding: 12px; border-radius: 8px; background: #f7fafc; }
    .stat-label { font-size: 12px; color: #718096; margin-bottom: 5px; font-weight: 600; }
    .stat-value { font-size: 24px; font-weight: bold; }
    .stat-value.passed { color: #48bb78; }
    .stat-value.failed { color: #f56565; }
    .stat-value.skipped { color: #ecc94b; }
    .stat-value.duration { color: #667eea; }
    .view-report-btn {
      display: block;
      width: 100%;
      padding: 14px;
      background: linear-gradient(135deg, #667eea, #764ba2);
      color: white;
      text-align: center;
      text-decoration: none;
      border-radius: 8px;
      font-weight: 600;
      font-size: 14px;
      transition: all 0.3s ease;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .view-report-btn:hover {
      background: linear-gradient(135deg, #764ba2, #667eea);
      box-shadow: 0 5px 15px rgba(102, 126, 234, 0.4);
    }
    .footer {
      background: white;
      border-radius: 12px;
      padding: 20px;
      text-align: center;
      color: #718096;
      font-size: 14px;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
    }
    @media (max-width: 768px) {
      .browsers-grid { grid-template-columns: 1fr; }
      .summary { grid-template-columns: repeat(2, 1fr); }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🧪 Cucumber Playwright Test Report</h1>
      <div class="subtitle">Cross-Browser Test Execution Results</div>
      <div class="timestamp">Generated on ${timestamp}</div>
    </div>
    <div class="summary">
      <div class="summary-card passed">
        <div class="label">Passed</div>
        <div class="value">${totalPassed}</div>
      </div>
      <div class="summary-card failed">
        <div class="label">Failed</div>
        <div class="value">${totalFailed}</div>
      </div>
      <div class="summary-card skipped">
        <div class="label">Skipped</div>
        <div class="value">${totalSkipped}</div>
      </div>
      <div class="summary-card total">
        <div class="label">Total Tests</div>
        <div class="value">${totalTests}</div>
      </div>
      <div class="summary-card rate">
        <div class="label">Success Rate</div>
        <div class="value">${successRate}%</div>
      </div>
    </div>
    <div class="browsers-grid">
${browserStats.map(stat => {
  const browserIcon = stat.browser === 'chromium' ? '🌐' : stat.browser === 'firefox' ? '🦊' : '🧭';
  const browserStatus = stat.failed > 0 ? 'failed' : 'passed';
  return `      <div class="browser-card">
        <div class="browser-header">
          <div class="browser-name">
            <div class="browser-icon ${stat.browser}">${browserIcon}</div>
            <span>${stat.browser.charAt(0).toUpperCase() + stat.browser.slice(1)}</span>
          </div>
          <span class="status-badge ${browserStatus}">${browserStatus}</span>
        </div>
        <div class="browser-stats">
          <div class="stat-item">
            <div class="stat-label">Passed</div>
            <div class="stat-value passed">${stat.passed}</div>
          </div>
          <div class="stat-item">
            <div class="stat-label">Failed</div>
            <div class="stat-value failed">${stat.failed}</div>
          </div>
          <div class="stat-item">
            <div class="stat-label">Skipped</div>
            <div class="stat-value skipped">${stat.skipped}</div>
          </div>
          <div class="stat-item">
            <div class="stat-label">Duration</div>
            <div class="stat-value duration">${stat.duration}s</div>
          </div>
        </div>
        <a href="browser-report-${stat.browser}/index.html" class="view-report-btn">View Detailed Report</a>
      </div>`;
}).join('\n')}
    </div>
    <div class="footer">
      <p>Cucumber Playwright Framework | Cross-Browser Testing with Playwright</p>
      <p style="margin-top: 10px;">🚀 Generated by CI Combined Reporter</p>
    </div>
  </div>
</body>
</html>`;

    // Write the custom index.html
    const indexPath = path.join(this.reportDir, 'index.html');
    await fs.writeFile(indexPath, html);
    console.log(`  ✓ Generated custom combined index at: ${indexPath}`);
  }

  /**
   * Get detailed statistics from each browser's JSON report
   */
  private static async getBrowserStats(browsers: string[]): Promise<Array<{
    browser: string;
    passed: number;
    failed: number;
    skipped: number;
    total: number;
    duration: string;
  }>> {
    const stats: Array<any> = [];

    for (const browser of browsers) {
      try {
        const jsonPath = path.join(this.reportDir, 'json', `${browser}.json`);
        if (!fs.existsSync(jsonPath)) continue;

        const reportData = await fs.readJson(jsonPath);
        let passed = 0;
        let failed = 0;
        let skipped = 0;
        let totalDuration = 0;

        // Iterate through features and scenarios
        reportData.forEach((feature: any) => {
          feature.elements?.forEach((scenario: any) => {
            let scenarioFailed = false;
            let scenarioSkipped = false;
            
            scenario.steps?.forEach((step: any) => {
              const stepResult = step.result?.status || 'undefined';
              const duration = step.result?.duration || 0;
              totalDuration += duration;

              if (stepResult === 'failed') {
                scenarioFailed = true;
              } else if (stepResult === 'skipped' || stepResult === 'undefined') {
                scenarioSkipped = true;
              }
            });

            if (scenarioFailed) {
              failed++;
            } else if (scenarioSkipped) {
              skipped++;
            } else {
              passed++;
            }
          });
        });

        stats.push({
          browser,
          passed,
          failed,
          skipped,
          total: passed + failed + skipped,
          duration: (totalDuration / 1000000000).toFixed(2)
        });
      } catch (error) {
        console.warn(`  ⚠ Could not get stats for ${browser}:`, error);
      }
    }

    return stats;
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
