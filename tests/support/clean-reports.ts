import { CustomReporter } from './reporter';

/**
 * Clean old reports before starting new test execution
 */
CustomReporter.cleanReports()
  .then(() => {
    console.log('✓ Reports cleaned successfully\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Error cleaning reports:', error);
    process.exit(1);
  });
