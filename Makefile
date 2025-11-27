.PHONY: help build up down test test-chromium test-firefox test-webkit logs clean rebuild shell

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
	docker-compose build

# Start containers
up:
	docker-compose up

# Stop and remove containers
down:
	docker-compose down

# Run all tests
test:
	docker-compose up cucumber-playwright-tests

# Run tests on Chromium
test-chromium:
	docker-compose up test-chromium

# Run tests on Firefox
test-firefox:
	docker-compose up test-firefox

# Run tests on WebKit
test-webkit:
	docker-compose up test-webkit

# View logs
logs:
	docker-compose logs -f cucumber-playwright-tests

# Clean up containers and volumes
clean:
	docker-compose down -v
	rm -rf reports/* logs/*

# Rebuild without cache
rebuild:
	docker-compose build --no-cache

# Access container shell
shell:
	docker-compose run cucumber-playwright-tests /bin/bash
