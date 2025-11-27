# Use official Node.js LTS image as base
FROM node:20-bookworm

# Install dependencies required for Playwright browsers
RUN apt-get update && apt-get install -y \
    libnss3 \
    libnspr4 \
    libatk1.0-0 \
    libatk-bridge2.0-0 \
    libcups2 \
    libdrm2 \
    libxkbcommon0 \
    libxcomposite1 \
    libxdamage1 \
    libxfixes3 \
    libxrandr2 \
    libgbm1 \
    libpango-1.0-0 \
    libcairo2 \
    libasound2 \
    libatspi2.0-0 \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install npm dependencies
RUN npm install

# Install Playwright browsers with system dependencies
RUN npx playwright install --with-deps

# Copy the rest of the application
COPY . .

# Create directories for reports and logs
RUN mkdir -p reports logs

# Set environment variable for headless mode
ENV HEADLESS=true

# Default command to run tests
CMD ["npm", "run", "test"]
