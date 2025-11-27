# Docker Setup Guide

This guide provides detailed information about running the Cucumber-Playwright framework in Docker containers.

## Table of Contents

- [Overview](#overview)
- [Prerequisites](#prerequisites)
- [Docker Files](#docker-files)
- [Quick Start](#quick-start)
- [Configuration](#configuration)
- [Running Tests](#running-tests)
- [Troubleshooting](#troubleshooting)
- [CI/CD Integration](#cicd-integration)

## Overview

The framework is fully Dockerized to provide:
- **Consistent environment** across different machines and CI/CD platforms
- **Pre-installed browsers** (Chromium, Firefox, WebKit)
- **Isolated execution** without affecting your local system
- **Easy scaling** for parallel test execution
- **Simple CI/CD integration**

## Prerequisites

- Docker Engine 20.x or higher
- Docker Compose 2.x or higher

### Installation

**macOS:**
```bash
brew install --cask docker
```

**Linux:**
```bash
sudo apt-get update
sudo apt-get install docker-ce docker-ce-cli containerd.io docker-compose-plugin
```

**Windows:**
Download and install [Docker Desktop](https://www.docker.com/products/docker-desktop)

## Docker Files

### Dockerfile

The main Dockerfile includes:
- Node.js 20 LTS (Bookworm base)
- All system dependencies for Playwright browsers
- Playwright browsers (Chromium, Firefox, WebKit)
- Framework dependencies from package.json

**Image Size:** ~2.5GB (includes all three browsers)

### docker-compose.yml

Defines multiple services:
- `cucumber-playwright-tests`: Default service for running tests
- `test-chromium`: Chromium-specific tests
- `test-firefox`: Firefox-specific tests
- `test-webkit`: WebKit-specific tests

### .dockerignore

Excludes unnecessary files from the Docker build context:
- node_modules (installed fresh in container)
- reports and logs (created at runtime)
- IDE and OS-specific files
- Git and CI/CD files

## Quick Start

### 1. Build the Docker Image

```bash
# Using Docker Compose (recommended)
docker-compose build

# Using Docker directly
docker build -t cucumber-playwright .
```

### 2. Run Tests

```bash
# Run with default configuration
docker-compose up cucumber-playwright-tests

# Run on specific browser
docker-compose up test-chromium
```

### 3. View Reports

Reports are automatically saved to your local `./reports` directory:

```bash
open reports/index.html
```

## Configuration

### Environment Variables

Override default configuration using environment variables:

```bash
# In docker-compose.yml
environment:
  - BROWSER=chromium
  - HEADLESS=true
  - CI=true
```

### Volume Mounts

By default, two directories are mounted:

```yaml
volumes:
  - ./reports:/app/reports    # Test reports
  - ./logs:/app/logs          # Execution logs
```

### Custom Configuration

Create a `.env` file in the project root:

```env
BROWSER=chromium
THREADS=3
HEADLESS=true
CI=true
```

Then run:

```bash
docker-compose --env-file .env up
```

## Running Tests

### Using Docker Compose

**Basic Execution:**
```bash
# Run default tests
docker-compose up cucumber-playwright-tests

# Run and auto-remove container
docker-compose run --rm cucumber-playwright-tests

# Run in background
docker-compose up -d cucumber-playwright-tests
```

**Browser-Specific:**
```bash
docker-compose up test-chromium
docker-compose up test-firefox
docker-compose up test-webkit
```

**Custom Commands:**
```bash
# Run specific feature file
docker-compose run cucumber-playwright-tests \
  npx cucumber-js tests/features/login/login.feature

# Run with custom npm script
docker-compose run cucumber-playwright-tests npm run test:chromium

# Run with environment override
docker-compose run -e BROWSER=firefox cucumber-playwright-tests
```

### Using Docker CLI

**Basic Execution:**
```bash
# Run tests and mount reports
docker run --rm \
  -v $(pwd)/reports:/app/reports \
  cucumber-playwright

# Run with specific browser
docker run --rm \
  -v $(pwd)/reports:/app/reports \
  -e BROWSER=firefox \
  cucumber-playwright npm run test:firefox
```

**Interactive Mode:**
```bash
# Access container shell
docker run -it cucumber-playwright /bin/bash

# Run specific commands
docker run -it cucumber-playwright npm run test
```

### Using Makefile

```bash
# Build image
make build

# Run tests
make test

# Run browser-specific tests
make test-chromium
make test-firefox
make test-webkit

# View logs
make logs

# Access shell
make shell

# Clean up
make clean
```

## Troubleshooting

### Issue: Container Exits Immediately

**Cause:** Test execution completed
**Solution:** This is normal behavior. View results in `./reports`

### Issue: "Permission Denied" on Reports

**Cause:** Volume mount permission issues
**Solution:**
```bash
# Fix permissions
sudo chown -R $USER:$USER reports/ logs/

# Or run with user flag
docker run --user $(id -u):$(id -g) cucumber-playwright
```

### Issue: Browser Not Found

**Cause:** Browsers not installed in container
**Solution:** Rebuild image with `--no-cache`
```bash
docker-compose build --no-cache
```

### Issue: Tests Fail in Docker but Pass Locally

**Possible Causes:**
1. **Timing issues:** Add waits or increase timeouts
2. **Headless mode:** Some tests may behave differently
3. **Screen resolution:** Set viewport size explicitly

**Debug:**
```bash
# Access container shell
make shell

# Run tests interactively
npm run test

# Check logs
docker-compose logs cucumber-playwright-tests
```

### Issue: Out of Memory

**Cause:** Insufficient memory allocated to Docker
**Solution:** Increase Docker memory limit in Docker Desktop settings (recommend 4GB+)

### Issue: Slow Build Times

**Solution:** Use Docker BuildKit
```bash
# Enable BuildKit
export DOCKER_BUILDKIT=1

# Build with BuildKit
docker-compose build
```

## CI/CD Integration

### GitHub Actions

```yaml
name: Cucumber-Playwright Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Build Docker image
        run: docker-compose build
      
      - name: Run tests
        run: docker-compose up --exit-code-from cucumber-playwright-tests
      
      - name: Upload test reports
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: test-reports
          path: reports/
```

### GitLab CI

```yaml
test:
  image: docker:latest
  services:
    - docker:dind
  script:
    - docker-compose build
    - docker-compose up --exit-code-from cucumber-playwright-tests
  artifacts:
    when: always
    paths:
      - reports/
```

### Jenkins

```groovy
pipeline {
    agent any
    
    stages {
        stage('Build') {
            steps {
                sh 'docker-compose build'
            }
        }
        
        stage('Test') {
            steps {
                sh 'docker-compose up --exit-code-from cucumber-playwright-tests'
            }
        }
    }
    
    post {
        always {
            publishHTML([
                reportDir: 'reports',
                reportFiles: 'index.html',
                reportName: 'Test Report'
            ])
        }
    }
}
```

### Azure DevOps

```yaml
trigger:
  - main

pool:
  vmImage: 'ubuntu-latest'

steps:
- task: Docker@2
  displayName: Build image
  inputs:
    command: build
    dockerfile: Dockerfile
    tags: cucumber-playwright

- script: |
    docker-compose up --exit-code-from cucumber-playwright-tests
  displayName: Run tests

- task: PublishTestResults@2
  condition: always()
  inputs:
    testResultsFormat: 'JUnit'
    testResultsFiles: 'reports/*.xml'
```

## Advanced Usage

### Multi-Stage Builds

For optimized image size, consider multi-stage builds:

```dockerfile
# Build stage
FROM node:20-bookworm AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

# Runtime stage
FROM mcr.microsoft.com/playwright:v1.56.1-bookworm
WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY . .
CMD ["npm", "run", "test"]
```

### Parallel Execution

Run multiple browser tests in parallel:

```bash
# Run all browsers simultaneously
docker-compose up -d test-chromium test-firefox test-webkit

# Wait for completion
docker-compose logs -f
```

### Custom Network

For testing applications running in other containers:

```yaml
services:
  app:
    image: my-web-app
    networks:
      - test-network
  
  cucumber-playwright-tests:
    build: .
    depends_on:
      - app
    networks:
      - test-network
    environment:
      - BASE_URL=http://app:3000
```

## Best Practices

1. **Use Docker Compose** for local development
2. **Pin versions** in Dockerfile (Node, Playwright)
3. **Mount volumes** for reports and logs
4. **Set resource limits** in production
5. **Use multi-stage builds** for smaller images
6. **Cache dependencies** by copying package.json first
7. **Run as non-root user** for security (optional)
8. **Use .dockerignore** to reduce build context
9. **Tag images** with version numbers
10. **Clean up** unused images and containers regularly

## Performance Tips

1. **Build cache:** Order Dockerfile instructions from least to most frequently changing
2. **Layer caching:** Separate dependency installation from code copy
3. **BuildKit:** Enable for faster builds and better caching
4. **Prune regularly:** Remove unused images/containers
   ```bash
   docker system prune -a
   ```

## Security Considerations

1. **Don't store secrets** in Dockerfile or docker-compose.yml
2. **Use .env files** for sensitive configuration
3. **Scan images** for vulnerabilities
   ```bash
   docker scan cucumber-playwright
   ```
4. **Update base images** regularly
5. **Run as non-root** when possible

## Resources

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Playwright Docker Guide](https://playwright.dev/docs/docker)
- [Best Practices for Dockerizing Node.js](https://github.com/nodejs/docker-node/blob/main/docs/BestPractices.md)

---

**Need Help?** Open an issue in the repository with the `docker` label.
