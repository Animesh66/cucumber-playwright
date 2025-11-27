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

      // Collect and merge all JSON reports with browser metadata
      const mergedData = await this.collectAndMergeJsonReports();
      
      if (mergedData.length === 0) {
        console.error('No test reports found to merge.');
        return;
      }

      // Write enriched JSON reports for each browser
      await this.writeEnrichedJsonReports(mergedData);

      // Get browser metadata
      const browserMetadata = await this.getBrowserMetadata();

      // Generate the combined HTML report using multiple-cucumber-html-reporter
      report.generate({
        jsonDir: this.reportDir,
        reportPath: this.reportDir,
        reportName: 'Combined Cross-Browser Test Report',
        pageTitle: 'Cucumber Playwright - All Browsers Test Results',
        displayDuration: true,
        displayReportTime: true,
        metadata: {
          browser: {
            name: 'multi',
            version: 'all'
          },
          device: 'CI/CD Pipeline',
          platform: {
            name: process.platform,
            version: process.version
          }
        },
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
   * Collect all JSON report files from downloaded artifacts and merge them
   */
  private static async collectAndMergeJsonReports(): Promise<any[]> {
    const mergedData: any[] = [];
    const processedFeatures = new Set<string>();

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

        let jsonData = null;
        let jsonPath = '';

        for (const jsonFile of possiblePaths) {
          if (fs.existsSync(jsonFile)) {
            jsonPath = jsonFile;
            jsonData = await fs.readJson(jsonFile);
            console.log(`  ✓ Found ${browser} report: ${jsonFile}`);
            break;
          }
        }

        if (jsonData && Array.isArray(jsonData)) {
          // Add browser metadata to each feature
          jsonData.forEach((feature: any) => {
            // Create unique feature identifier
            const featureId = `${browser}-${feature.id || feature.name}`;
            
            if (!processedFeatures.has(featureId)) {
              // Enrich feature with browser metadata
              const enrichedFeature = {
                ...feature,
                metadata: [
                  { name: 'Browser', value: browser.toUpperCase() },
                  { name: 'Platform', value: process.platform },
                  { name: 'Node Version', value: process.version }
                ]
              };
              
              mergedData.push(enrichedFeature);
              processedFeatures.add(featureId);
            }
          });
        } else {
          console.warn(`  ⚠ No valid report found for ${browser}`);
        }
      } catch (error) {
        console.warn(`  ⚠ Could not process ${browser} report:`, error);
      }
    }

    return mergedData;
  }

  /**
   * Write enriched JSON reports for multiple-cucumber-html-reporter
   */
  private static async writeEnrichedJsonReports(mergedData: any[]): Promise<void> {
    // Group features by browser
    const browserGroups = new Map<string, any[]>();

    mergedData.forEach(feature => {
      const browser = feature.metadata?.find((m: any) => m.name === 'Browser')?.value?.toLowerCase() || 'unknown';
      if (!browserGroups.has(browser)) {
        browserGroups.set(browser, []);
      }
      browserGroups.get(browser)?.push(feature);
    });

    // Write separate JSON files for each browser with enriched metadata
    for (const [browser, features] of browserGroups.entries()) {
      const browserJsonPath = path.join(this.reportDir, `${browser}-enriched.json`);
      await fs.writeJson(browserJsonPath, features, { spaces: 2 });
      console.log(`  ✓ Created enriched ${browser} report: ${browserJsonPath}`);
    }

    // Also write a combined JSON for reference
    const combinedJsonPath = path.join(this.reportDir, 'all-browsers-combined.json');
    await fs.writeJson(combinedJsonPath, mergedData, { spaces: 2 });
    console.log(`  ✓ Created combined report: ${combinedJsonPath}`);
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
