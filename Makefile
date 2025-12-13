# =============================================================================
# IT Bangmod Photo Club Director - Makefile
# =============================================================================
# This Makefile provides convenient commands for development, testing, and
# deployment of the IT Bangmod Photo Club Director application.
# =============================================================================

# Configuration
.DEFAULT_GOAL := help
ENV_DEV := .env.development
ENV_PROD := .env.production

# Use PowerShell on Windows
ifeq ($(OS),Windows_NT)
SHELL := pwsh.exe
.SHELLFLAGS := -NoProfile -Command
endif

# =============================================================================
# Help
# =============================================================================
.PHONY: help
help: ## Show this help message
	@Write-Host ""
	@Write-Host "IT Bangmod Photo Club Director" -ForegroundColor Cyan
	@Write-Host "================================"
	@Write-Host ""
	@Write-Host "Usage: make [target]" -ForegroundColor Green
	@Write-Host ""
	@Write-Host "Available targets:" -ForegroundColor Yellow
	@Write-Host "  install           - Install all dependencies"
	@Write-Host "  reinstall         - Reinstall all dependencies (clean install)"
	@Write-Host "  dev               - Start development environment (infra + api + ui)"
	@Write-Host "  dev-api           - Start only the API server"
	@Write-Host "  dev-ui            - Start only the Remix UI"
	@Write-Host "  infra-up          - Start infrastructure (postgres, redis, minio)"
	@Write-Host "  infra-down        - Stop infrastructure services"
	@Write-Host "  infra-logs        - Show infrastructure logs"
	@Write-Host "  infra-restart     - Restart infrastructure services"
	@Write-Host "  infra-clean       - Stop and remove all data (volumes)"
	@Write-Host "  db-migrate        - Run database migrations (development)"
	@Write-Host "  db-migrate-deploy - Deploy database migrations (production)"
	@Write-Host "  db-reset          - Reset database (drops all data)"
	@Write-Host "  db-studio         - Open Prisma Studio"
	@Write-Host "  db-generate       - Generate Prisma client"
	@Write-Host "  db-seed           - Seed the database"
	@Write-Host "  build             - Build both API and UI for production"
	@Write-Host "  build-api         - Build only the API server"
	@Write-Host "  build-ui          - Build only the Remix UI"
	@Write-Host "  test              - Run all tests"
	@Write-Host "  test-watch        - Run tests in watch mode"
	@Write-Host "  test-cov          - Run tests with coverage"
	@Write-Host "  lint              - Run linter on all projects"
	@Write-Host "  lint-api          - Run linter on API server"
	@Write-Host "  lint-ui           - Run linter on Remix UI"
	@Write-Host "  format            - Format API server code"
	@Write-Host "  typecheck         - Run TypeScript type checking"
	@Write-Host "  start-prod        - Start production servers"
	@Write-Host "  start-api-prod    - Start API in production mode"
	@Write-Host "  start-ui-prod     - Start UI in production mode"
	@Write-Host "  clean             - Clean build artifacts"
	@Write-Host "  clean-all         - Clean everything including node_modules"
	@Write-Host "  setup             - Full setup: install, infra, migrations"
	@Write-Host ""

# =============================================================================
# Installation
# =============================================================================
.PHONY: install
install: ## Install all dependencies
	@Write-Host "Installing dependencies..." -ForegroundColor Green
	bun install

.PHONY: reinstall
reinstall: ## Reinstall all dependencies (clean install)
	@Write-Host "Reinstalling dependencies..." -ForegroundColor Green
	Remove-Item -Recurse -Force -ErrorAction SilentlyContinue node_modules
	Remove-Item -Recurse -Force -ErrorAction SilentlyContinue api-server/node_modules
	Remove-Item -Recurse -Force -ErrorAction SilentlyContinue remix-app/node_modules
	bun install

# =============================================================================
# Development
# =============================================================================
.PHONY: dev
dev: ## Start development environment (infra + api + ui)
	@Write-Host "Starting development environment..." -ForegroundColor Green
	bun run --env-file=$(ENV_DEV) dev

.PHONY: dev-api
dev-api: ## Start only the API server in development mode
	@Write-Host "Starting API server..." -ForegroundColor Green
	bun run --env-file=$(ENV_DEV) --cwd api-server start:dev

.PHONY: dev-ui
dev-ui: ## Start only the Remix UI in development mode
	@Write-Host "Starting Remix UI..." -ForegroundColor Green
	bun run --env-file=$(ENV_DEV) --cwd remix-app dev

# =============================================================================
# Infrastructure
# =============================================================================
.PHONY: infra-up
infra-up: ## Start infrastructure services (postgres, redis, minio)
	@Write-Host "Starting infrastructure..." -ForegroundColor Green
	docker-compose up -d

.PHONY: infra-down
infra-down: ## Stop infrastructure services
	@Write-Host "Stopping infrastructure..." -ForegroundColor Yellow
	docker-compose down

.PHONY: infra-logs
infra-logs: ## Show infrastructure logs
	docker-compose logs -f

.PHONY: infra-restart
infra-restart: infra-down infra-up ## Restart infrastructure services
	@Write-Host "Infrastructure restarted" -ForegroundColor Green

.PHONY: infra-clean
infra-clean: ## Stop and remove all infrastructure data (volumes)
	@Write-Host "Warning: This will delete all data!" -ForegroundColor Red
	docker-compose down -v

# =============================================================================
# Database
# =============================================================================
.PHONY: db-migrate
db-migrate: ## Run database migrations (development)
	@Write-Host "Running database migrations..." -ForegroundColor Green
	bun run --env-file=$(ENV_DEV) --cwd api-server migrate:dev

.PHONY: db-migrate-deploy
db-migrate-deploy: ## Deploy database migrations (production)
	@Write-Host "Deploying database migrations..." -ForegroundColor Green
	bun run --cwd api-server migrate:deploy

.PHONY: db-reset
db-reset: ## Reset database (drops all data and re-runs migrations)
	@Write-Host "Resetting database..." -ForegroundColor Red
	bun run --env-file=$(ENV_DEV) --cwd api-server migrate:reset

.PHONY: db-studio
db-studio: ## Open Prisma Studio
	@Write-Host "Opening Prisma Studio..." -ForegroundColor Green
	bun run --env-file=$(ENV_DEV) --cwd api-server bunx prisma studio

.PHONY: db-generate
db-generate: ## Generate Prisma client
	@Write-Host "Generating Prisma client..." -ForegroundColor Green
	bun run --cwd api-server bunx prisma generate

.PHONY: db-seed
db-seed: ## Seed the database
	@Write-Host "Seeding database..." -ForegroundColor Green
	bun run --env-file=$(ENV_DEV) --cwd api-server bunx prisma db seed

# =============================================================================
# Building
# =============================================================================
.PHONY: build
build: ## Build both API and UI for production
	@Write-Host "Building for production..." -ForegroundColor Green
	bun run build

.PHONY: build-api
build-api: ## Build only the API server
	@Write-Host "Building API server..." -ForegroundColor Green
	bun run --cwd api-server build

.PHONY: build-ui
build-ui: ## Build only the Remix UI
	@Write-Host "Building Remix UI..." -ForegroundColor Green
	bun run --cwd remix-app build

# =============================================================================
# Testing & Quality
# =============================================================================
.PHONY: test
test: ## Run all tests
	@Write-Host "Running tests..." -ForegroundColor Green
	bun run --cwd api-server test

.PHONY: test-watch
test-watch: ## Run tests in watch mode
	@Write-Host "Running tests in watch mode..." -ForegroundColor Green
	bun run --cwd api-server test:watch

.PHONY: test-cov
test-cov: ## Run tests with coverage
	@Write-Host "Running tests with coverage..." -ForegroundColor Green
	bun run --cwd api-server test:cov

.PHONY: lint
lint: ## Run linter on all projects
	@Write-Host "Running linter..." -ForegroundColor Green
	bun run lint

.PHONY: lint-api
lint-api: ## Run linter on API server
	@Write-Host "Running linter on API..." -ForegroundColor Green
	bun run --cwd api-server lint

.PHONY: lint-ui
lint-ui: ## Run linter on Remix UI
	@Write-Host "Running linter on UI..." -ForegroundColor Green
	bun run --cwd remix-app lint

.PHONY: format
format: ## Format API server code
	@Write-Host "Formatting code..." -ForegroundColor Green
	bun run --cwd api-server format

.PHONY: typecheck
typecheck: ## Run TypeScript type checking
	@Write-Host "Running type check..." -ForegroundColor Green
	bun run --cwd remix-app typecheck

# =============================================================================
# Production
# =============================================================================
.PHONY: start-prod
start-prod: ## Start production servers
	@Write-Host "Starting production servers..." -ForegroundColor Green
	bun run --cwd api-server start:prod

.PHONY: start-api-prod
start-api-prod: ## Start API server in production mode
	@Write-Host "Starting API server in production mode..." -ForegroundColor Green
	bun run --cwd api-server start:prod

.PHONY: start-ui-prod
start-ui-prod: ## Start Remix UI in production mode
	@Write-Host "Starting Remix UI in production mode..." -ForegroundColor Green
	bun run --cwd remix-app start

# =============================================================================
# Cleanup
# =============================================================================
.PHONY: clean
clean: ## Clean build artifacts
	@Write-Host "Cleaning build artifacts..." -ForegroundColor Yellow
	Remove-Item -Recurse -Force -ErrorAction SilentlyContinue api-server/dist
	Remove-Item -Recurse -Force -ErrorAction SilentlyContinue remix-app/build

.PHONY: clean-all
clean-all: clean ## Clean everything including node_modules
	@Write-Host "Cleaning node_modules..." -ForegroundColor Yellow
	Remove-Item -Recurse -Force -ErrorAction SilentlyContinue node_modules
	Remove-Item -Recurse -Force -ErrorAction SilentlyContinue api-server/node_modules
	Remove-Item -Recurse -Force -ErrorAction SilentlyContinue remix-app/node_modules

# =============================================================================
# Utilities
# =============================================================================
.PHONY: wait-db
wait-db: ## Wait for database to be ready
	@Write-Host "Waiting for database..." -ForegroundColor Green
	bunx wait-on tcp:localhost:5432

.PHONY: setup
setup: install infra-up wait-db db-migrate ## Full setup: install deps, start infra, run migrations
	@Write-Host "Setup complete! Run 'make dev' to start development" -ForegroundColor Green
