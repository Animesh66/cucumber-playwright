# Cucumber-Playwright Test Automation Framework

A comprehensive BDD (Behavior-Driven Development) test automation framework built with Cucumber.js and Playwright, implementing the Page Object Model (POM) design pattern.

## 📋 Table of Contents

- [Framework Overview](#framework-overview)
- [Features](#features)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Running Tests](#running-tests)
- [Test Reports](#test-reports)
- [Framework Architecture](#framework-architecture)

## 🎯 Framework Overview

This framework combines the power of:
- **Cucumber.js** - BDD testing framework for writing human-readable test scenarios
- **Playwright** - Modern web automation library supporting Chromium, Firefox, and WebKit
- **TypeScript** - Type-safe programming language for better code quality
- **Page Object Model** - Design pattern for maintainable and reusable test code

## ✨ Features

- ✅ **Multi-Browser Support** - Execute tests on Chromium, Firefox, or WebKit
- ✅ **Parallel Execution** - Run tests concurrently for faster execution
- ✅ **Page Object Model** - Organized, maintainable page objects with inheritance
- ✅ **Environment Configuration** - Flexible configuration via `.env` file
- ✅ **Comprehensive Reporting** - HTML and JSON reports with detailed test results
- ✅ **Retry Mechanism** - Automatic retry for flaky tests
- ✅ **Rerun Failed Tests** - Track and rerun failed scenarios
- ✅ **Type Safety** - Full TypeScript support
- ✅ **Detailed Logging** - Console logs for debugging and monitoring

## 📁 Project Structure

```
cucumber-playwright/
├── tests/
│   ├── features/              # Feature files (Gherkin scenarios)
│   │   ├── login/
│   │   │   └── login.feature
│   │   └── registration/
│   │       └── registration.feature
│   ├── steps/                 # Step definitions
│   │   ├── login_steps.ts
│   │   └── registration_steps.ts
│   ├── pages/                 # Page Object Model classes
│   │   ├── BasePage.ts        # Base page with common functionality
│   │   ├── LoginPage.ts       # Login page object
│   │   └── RegistrationPage.ts # Registration page object
│   └── support/
│       ├── helpers/
│       │   └── browserManager.ts  # Browser lifecycle management
│       └── hooks/
│           └── hooks.ts       # Cucumber hooks (Before/After)
├── reports/                   # Test execution reports
│   ├── cucumber-report.html
│   └── cucumber-report.json
├── .env                       # Environment variables (local config)
├── cucumber.json              # Cucumber configuration
├── tsconfig.json              # TypeScript configuration
├── package.json               # Dependencies and scripts
└── playwright.config.ts       # Playwright configuration
```

## 🔧 Prerequisites

- **Node.js** - Version 16.x or higher
- **npm** - Version 7.x or higher
- **Git** - For cloning the repository

## 📦 Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd cucumber-playwright
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Install Playwright browsers** (if not already installed)
   ```bash
   npx playwright install
   ```

## ⚙️ Configuration

### Environment Variables (.env)

Configure your test execution by editing the `.env` file:

```env
# Browser Configuration
# Supported values: chromium, firefox, webkit
BROWSER=chromium

# Parallel Thread Configuration
# Number of parallel threads for test execution
THREADS=2

# Headless Mode
# Set to true for headless browser execution
HEADLESS=false
```

### Cucumber Configuration (cucumber.json)

- **Parallel Execution**: Controlled via `THREADS` environment variable (default: 2)
- **Retry Mechanism**: Failed tests retry once by default
- **Report Formats**: HTML, JSON, and rerun tracking
- **Test Paths**: Features located in `tests/features/**/*.feature`

**Note**: The parallel execution count is not hardcoded in `cucumber.json`. It's dynamically set via the `--parallel` flag using the `THREADS` environment variable.

## 🚀 Running Tests

### Basic Execution

```bash
# Run all tests with default configuration (Chromium, 2 threads)
npm test
```

### Browser-Specific Execution

```bash
# Run tests on Chromium
npm run test:chromium

# Run tests on Firefox
npm run test:firefox

# Run tests on WebKit (Safari)
npm run test:webkit
```

### Custom Configuration via CLI

The framework reads configuration from the `.env` file. To override:

1. **Edit the `.env` file** to change default values:
   ```env
   BROWSER=firefox
   THREADS=3
   HEADLESS=false
   ```

2. **Override from command line**:
   ```bash
   # Run with specific browser
   BROWSER=webkit npm test

   # Run with custom thread count
   THREADS=5 npm test

   # Run in headless mode
   HEADLESS=true npm test

   # Combine multiple configurations
   BROWSER=chromium THREADS=4 HEADLESS=true npm test
   ```

**Note**: The `--parallel` flag is automatically applied using the `THREADS` value from `.env` or CLI.

### Rerun Failed Tests

After a test run, failed scenarios are saved to `@rerun.txt`. To rerun only failed tests:

```bash
npx cucumber-js @rerun.txt
```

## 📊 Test Reports

After test execution, comprehensive reports with screenshots and traces are automatically generated.

### Enhanced HTML Report 🎨
- **Location**: `reports/index.html` (Main report dashboard)
- **Features**: 
  - Interactive dashboard with pass/fail statistics
  - Embedded screenshots for failed scenarios
  - Downloadable Playwright trace files
  - Browser and platform metadata
  - Execution duration and timestamps
- **View**: Open `reports/index.html` in any browser or run `npm run report:open`

### Legacy Reports
- **HTML**: `reports/cucumber-report.html`
- **JSON**: `reports/cucumber-report.json`

### Screenshots & Traces 📸
For failed scenarios, the framework automatically captures:
- **Screenshots**: Full-page screenshots saved to `screenshots/` and `reports/screenshots/`
- **Traces**: Playwright trace files saved to `traces/` and `reports/traces/`
- **Trace Viewer**: View traces with `npx playwright show-trace traces/filename.zip`

### Report Commands
```bash
# Run tests and generate report (automatic)
npm test

# Generate report from existing results
npm run report

# Generate and open report in browser
npm run report:open

# Clean old reports before testing
npm run clean
```

📖 **For detailed reporting documentation, see [REPORTING.md](./REPORTING.md)**

## 🏗️ Framework Architecture

### Page Object Model (POM)

The framework implements a hierarchical Page Object Model:

#### BasePage Class
```typescript
// tests/pages/BasePage.ts
export class BasePage {
  protected page: Page;  // Shared page instance
  constructor(page: Page) {
    this.page = page;
  }
}
```

All page classes extend `BasePage` to inherit common functionality.

#### Page Classes
- **LoginPage**: Handles login page interactions and verifications
- **RegistrationPage**: Manages registration form and validations

Each page class contains:
- Locator methods
- Action methods (click, type, etc.)
- Verification methods (assertions)

### Step Definitions

Step definitions connect Gherkin scenarios to automation code:

```typescript
Given('I click the login link', async function () {
  const loginPage = new LoginPage(this.page);
  await loginPage.clickLoginLink();
});
```

### Browser Management

The `BrowserManager` class handles:
- Browser selection (Chromium/Firefox/WebKit)
- Browser lifecycle (launch/close)
- Headless/headed mode configuration
- Environment-based configuration

### Hooks

Cucumber hooks manage test lifecycle:

- **BeforeAll**: Launch browser before test suite
- **Before**: Create new page context for each scenario
- **After**: Close page after each scenario
- **AfterAll**: Close browser after test suite

## 🔍 Test Execution Flow

1. **BeforeAll Hook**: Browser is launched based on `BROWSER` environment variable
2. **Before Hook**: New page context created and navigates to base URL
3. **Scenario Execution**: Steps execute using page objects
4. **After Hook**: Page context closed
5. **AfterAll Hook**: Browser instance closed
6. **Reports Generated**: HTML and JSON reports created

## 🐛 Debugging

### Headed Mode
Run tests with visible browser:
```bash
HEADLESS=false npm test
```

### Console Logs
All step definitions include detailed console logging for debugging:
- Action being performed
- Data being used (emails, usernames, etc.)
- Verification results

### Retry Mechanism
Failed tests automatically retry once (configurable in `cucumber.json`).

## 🤝 Contributing

1. Create feature files in `tests/features/`
2. Implement page objects in `tests/pages/`
3. Write step definitions in `tests/steps/`
4. Follow existing naming conventions and patterns

## 📝 Best Practices

- ✅ Keep feature files readable and business-focused
- ✅ Maintain single responsibility in page objects
- ✅ Use meaningful step definitions
- ✅ Implement proper wait strategies
- ✅ Add comprehensive logging
- ✅ Follow POM principles
- ✅ Write reusable page methods

## 📞 Support

For issues or questions, please create an issue in the repository.

---

**Happy Testing! 🎉**
