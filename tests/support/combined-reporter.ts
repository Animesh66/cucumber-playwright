import * as fs from 'fs-extra';
import * as path from 'path';

/**
 * Combined Reporter
 * Generates a master index.html that aggregates all browser-specific test reports
 */
export class CombinedReporter {
  private static reportDir = path.join(process.cwd(), 'reports');
  private static browsers = ['chromium', 'firefox', 'webkit'];

  /**
   * Generate combined HTML index page with links to all browser reports
   */
  static async generateCombinedReport(): Promise<void> {
    try {
      console.log('Generating combined test report index...');

      // Check which browsers have reports
      const availableBrowsers = this.browsers.filter(browser => {
        const browserReportPath = path.join(this.reportDir, browser, 'index.html');
        return fs.existsSync(browserReportPath);
      });

      if (availableBrowsers.length === 0) {
        console.error('No browser reports found. Make sure tests have run first.');
        return;
      }

      // Read stats from each browser report JSON
      const browserStats = await this.getBrowserStats(availableBrowsers);

      // Generate the combined HTML
      const html = this.generateHTML(availableBrowsers, browserStats);

      // Write the combined index.html
      const indexPath = path.join(this.reportDir, 'index.html');
      await fs.writeFile(indexPath, html);

      console.log('✓ Combined report index generated successfully!');
      console.log(`  Location: ${indexPath}`);
      console.log(`  Available browser reports: ${availableBrowsers.join(', ')}`);

    } catch (error) {
      console.error('Error generating combined report:', error);
      throw error;
    }
  }

  /**
   * Extract test statistics from browser JSON reports
   */
  private static async getBrowserStats(browsers: string[]): Promise<Map<string, any>> {
    const stats = new Map();

    for (const browser of browsers) {
      try {
        const jsonPath = path.join(this.reportDir, browser, 'cucumber-report.json');
        if (fs.existsSync(jsonPath)) {
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

          stats.set(browser, {
            passed,
            failed,
            skipped,
            total: passed + failed + skipped,
            duration: (totalDuration / 1000000000).toFixed(2) // Convert nanoseconds to seconds
          });
        }
      } catch (error) {
        console.warn(`Warning: Could not parse stats for ${browser}:`, error);
        stats.set(browser, { passed: 0, failed: 0, skipped: 0, total: 0, duration: '0' });
      }
    }

    return stats;
  }

  /**
   * Generate HTML content for the combined report
   */
  private static generateHTML(browsers: string[], stats: Map<string, any>): string {
    const timestamp = new Date().toLocaleString();
    
    // Calculate overall stats
    let totalPassed = 0;
    let totalFailed = 0;
    let totalSkipped = 0;
    let totalTests = 0;

    browsers.forEach(browser => {
      const browserStat = stats.get(browser) || { passed: 0, failed: 0, skipped: 0, total: 0 };
      totalPassed += browserStat.passed;
      totalFailed += browserStat.failed;
      totalSkipped += browserStat.skipped;
      totalTests += browserStat.total;
    });

    const overallStatus = totalFailed > 0 ? 'failed' : 'passed';
    const successRate = totalTests > 0 ? ((totalPassed / totalTests) * 100).toFixed(1) : '0';

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Cucumber Playwright Test Report - All Browsers</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      padding: 20px;
    }

    .container {
      max-width: 1200px;
      margin: 0 auto;
    }

    .header {
      background: white;
      border-radius: 12px;
      padding: 30px;
      margin-bottom: 30px;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
    }

    .header h1 {
      font-size: 32px;
      color: #2d3748;
      margin-bottom: 10px;
    }

    .header .subtitle {
      color: #718096;
      font-size: 16px;
    }

    .timestamp {
      color: #a0aec0;
      font-size: 14px;
      margin-top: 10px;
    }

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

    .summary-card .value {
      font-size: 36px;
      font-weight: bold;
      margin-bottom: 5px;
    }

    .summary-card.passed .value {
      color: #48bb78;
    }

    .summary-card.failed .value {
      color: #f56565;
    }

    .summary-card.skipped .value {
      color: #ecc94b;
    }

    .summary-card.total .value {
      color: #4299e1;
    }

    .summary-card.rate .value {
      color: ${overallStatus === 'passed' ? '#48bb78' : '#f56565'};
    }

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

    .browser-card:hover {
      transform: translateY(-5px);
      box-shadow: 0 15px 40px rgba(0, 0, 0, 0.3);
    }

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

    .browser-icon.chromium {
      background: linear-gradient(135deg, #4285f4, #34a853);
    }

    .browser-icon.firefox {
      background: linear-gradient(135deg, #ff7139, #e66000);
    }

    .browser-icon.webkit {
      background: linear-gradient(135deg, #147efb, #0d5fd9);
    }

    .status-badge {
      padding: 6px 16px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
    }

    .status-badge.passed {
      background: #c6f6d5;
      color: #22543d;
    }

    .status-badge.failed {
      background: #fed7d7;
      color: #742a2a;
    }

    .browser-stats {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 15px;
      margin-bottom: 20px;
    }

    .stat-item {
      padding: 12px;
      border-radius: 8px;
      background: #f7fafc;
    }

    .stat-label {
      font-size: 12px;
      color: #718096;
      margin-bottom: 5px;
      font-weight: 600;
    }

    .stat-value {
      font-size: 24px;
      font-weight: bold;
    }

    .stat-value.passed {
      color: #48bb78;
    }

    .stat-value.failed {
      color: #f56565;
    }

    .stat-value.skipped {
      color: #ecc94b;
    }

    .stat-value.duration {
      color: #667eea;
    }

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
      .browsers-grid {
        grid-template-columns: 1fr;
      }

      .summary {
        grid-template-columns: repeat(2, 1fr);
      }
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
${browsers.map(browser => {
  const browserStat = stats.get(browser) || { passed: 0, failed: 0, skipped: 0, total: 0, duration: '0' };
  const browserStatus = browserStat.failed > 0 ? 'failed' : 'passed';
  const browserIcon = browser === 'chromium' ? '🌐' : browser === 'firefox' ? '🦊' : '🧭';
  
  return `      <div class="browser-card">
        <div class="browser-header">
          <div class="browser-name">
            <div class="browser-icon ${browser}">${browserIcon}</div>
            <span>${browser.charAt(0).toUpperCase() + browser.slice(1)}</span>
          </div>
          <span class="status-badge ${browserStatus}">${browserStatus}</span>
        </div>
        <div class="browser-stats">
          <div class="stat-item">
            <div class="stat-label">Passed</div>
            <div class="stat-value passed">${browserStat.passed}</div>
          </div>
          <div class="stat-item">
            <div class="stat-label">Failed</div>
            <div class="stat-value failed">${browserStat.failed}</div>
          </div>
          <div class="stat-item">
            <div class="stat-label">Skipped</div>
            <div class="stat-value skipped">${browserStat.skipped}</div>
          </div>
          <div class="stat-item">
            <div class="stat-label">Duration</div>
            <div class="stat-value duration">${browserStat.duration}s</div>
          </div>
        </div>
        <a href="${browser}/index.html" class="view-report-btn">View Detailed Report</a>
      </div>`;
}).join('\n')}
    </div>

    <div class="footer">
      <p>Cucumber Playwright Framework | Cross-Browser Testing with Playwright</p>
      <p style="margin-top: 10px;">🚀 Generated by Cucumber Playwright Reporter</p>
    </div>
  </div>
</body>
</html>`;
  }
}

// If this file is run directly, generate the combined report
if (require.main === module) {
  CombinedReporter.generateCombinedReport()
    .then(() => {
      console.log('\nCombined report generation completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\nCombined report generation failed:', error);
      process.exit(1);
    });
}
