import * as report from 'multiple-cucumber-html-reporter';
import * as fs from 'fs-extra';
import * as path from 'path';

/**
 * Custom HTML Reporter Configuration
 * Generates an enhanced HTML report with screenshots and trace attachments for failed tests
 */
export class CustomReporter {
  private static getBrowserName(): string {
    return (process.env.BROWSER || 'chromium').toLowerCase();
  }

  private static getBrowserReportDir(): string {
    const browser = this.getBrowserName();
    return path.join(process.cwd(), 'reports', browser);
  }

  private static reportDir = path.join(process.cwd(), 'reports');
  private static jsonReportPath = path.join(process.cwd(), 'reports/cucumber-report.json');

  /**
   * Generate enhanced HTML report with screenshots and traces embedded
   */
  static async generateReport(): Promise<void> {
    try {
      // Ensure report directory exists
      if (!fs.existsSync(this.reportDir)) {
        console.error('Reports directory not found. Make sure tests have run first.');
        return;
      }

      // Check if JSON report exists
      if (!fs.existsSync(this.jsonReportPath)) {
        console.error('JSON report not found. Make sure tests have run first.');
        return;
      }

      console.log('Generating enhanced HTML report...');

      // Get browser name from environment
      const browserName = this.getBrowserName();
      const browserReportDir = this.getBrowserReportDir();

      // Ensure browser-specific report directory exists
      await fs.ensureDir(browserReportDir);

      // Copy JSON report to browser-specific directory
      const browserJsonPath = path.join(browserReportDir, 'cucumber-report.json');
      await fs.copy(this.jsonReportPath, browserJsonPath);

      // Generate the report in browser-specific directory
      report.generate({
        jsonDir: browserReportDir,
        reportPath: browserReportDir,
        reportName: `Cucumber Test Execution Report - ${browserName.toUpperCase()}`,
        pageTitle: `Cucumber Playwright Test Report - ${browserName.toUpperCase()}`,
        displayDuration: true,
        displayReportTime: true,
        metadata: {
          browser: {
            name: browserName,
            version: 'Latest'
          },
          device: 'Local Machine',
          platform: {
            name: process.platform,
            version: process.version
          }
        },
        customData: {
          title: 'Test Run Information',
          data: [
            { label: 'Project', value: 'Cucumber Playwright Framework' },
            { label: 'Release', value: '1.0.0' },
            { label: 'Execution Date', value: new Date().toLocaleString() },
            { label: 'Browser', value: browserName.toUpperCase() },
            { label: 'Environment', value: process.env.BASE_URL || 'https://demowebshop.tricentis.com/' }
          ]
        }
      });

      console.log(`✓ HTML report generated successfully for ${browserName}!`);
      console.log(`  Location: ${path.join(browserReportDir, 'index.html')}`);
      
      // Copy screenshots and traces to browser-specific report directory
      await this.copyAttachmentsToReport(browserReportDir);
      
    } catch (error) {
      console.error('Error generating report:', error);
      throw error;
    }
  }

  /**
   * Copy screenshots and traces to reports directory for easier access
   */
  private static async copyAttachmentsToReport(targetReportDir: string): Promise<void> {
    try {
      const screenshotsDir = path.join(process.cwd(), 'screenshots');
      const tracesDir = path.join(process.cwd(), 'traces');
      const reportScreenshotsDir = path.join(targetReportDir, 'screenshots');
      const reportTracesDir = path.join(targetReportDir, 'traces');

      // Copy screenshots
      if (fs.existsSync(screenshotsDir)) {
        await fs.ensureDir(reportScreenshotsDir);
        await fs.copy(screenshotsDir, reportScreenshotsDir, { overwrite: true });
        console.log('✓ Screenshots copied to report directory');
      }

      // Copy traces
      if (fs.existsSync(tracesDir)) {
        await fs.ensureDir(reportTracesDir);
        await fs.copy(tracesDir, reportTracesDir, { overwrite: true });
        console.log('✓ Trace files copied to report directory');
      }
    } catch (error) {
      console.warn('Warning: Could not copy attachments:', error);
    }
  }

  /**
   * Clean old reports before new test run
   */
  static async cleanReports(): Promise<void> {
    try {
      const dirsToClean = [
        path.join(process.cwd(), 'reports'),
        path.join(process.cwd(), 'screenshots'),
        path.join(process.cwd(), 'traces')
      ];

      for (const dir of dirsToClean) {
        if (fs.existsSync(dir)) {
          await fs.emptyDir(dir);
          console.log(`✓ Cleaned ${path.basename(dir)} directory`);
        }
      }
    } catch (error) {
      console.warn('Warning: Could not clean directories:', error);
    }
  }
}

// If this file is run directly, generate the report
if (require.main === module) {
  CustomReporter.generateReport()
    .then(() => {
      console.log('\nReport generation completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\nReport generation failed:', error);
      process.exit(1);
    });
}
