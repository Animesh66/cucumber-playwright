.PHONY: help build up down test test-chromium test-firefox test-webkit logs clean rebuild shell

# Docker Compose command (use V2 syntax for compatibility with CI/CD)
DOCKER_COMPOSE := docker compose

# Default target
help:
	@echo "Cucumber-Playwright Docker Commands"
	@echo "===================================="
	@echo "make build          - Build Docker image"
	@echo "make up             - Start containers"
	@echo "make down           - Stop and remove containers"
	@echo "make test           - Run all tests"
	@echo "make test-chromium  - Run tests on Chromium"
	@echo "make test-firefox   - Run tests on Firefox"
	@echo "make test-webkit    - Run tests on WebKit"
	@echo "make logs           - View container logs"
	@echo "make clean          - Remove containers and volumes"
	@echo "make rebuild        - Rebuild without cache"
	@echo "make shell          - Access container shell"

# Build Docker image
build:
	$(DOCKER_COMPOSE) build

# Start containers
up:
	$(DOCKER_COMPOSE) up

# Stop and remove containers
down:
	$(DOCKER_COMPOSE) down

# Run all tests
test:
	$(DOCKER_COMPOSE) up cucumber-playwright-tests

# Run tests on Chromium
test-chromium:
	$(DOCKER_COMPOSE) up test-chromium

# Run tests on Firefox
test-firefox:
	$(DOCKER_COMPOSE) up test-firefox

# Run tests on WebKit
test-webkit:
	$(DOCKER_COMPOSE) up test-webkit

# View logs
logs:
	$(DOCKER_COMPOSE) logs -f cucumber-playwright-tests

# Clean up containers and volumes
clean:
	$(DOCKER_COMPOSE) down -v
	rm -rf reports/* logs/*

# Rebuild without cache
rebuild:
	$(DOCKER_COMPOSE) build --no-cache

# Access container shell
shell:
	$(DOCKER_COMPOSE) run cucumber-playwright-tests /bin/bash
