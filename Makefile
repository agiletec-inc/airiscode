.PHONY: help setup proto codegen build lint test test-watch test-coverage test-unit clean install check-deps

# Use npx pnpm if pnpm is not installed globally
PNPM := $(shell command -v pnpm 2> /dev/null)
ifndef PNPM
	PNPM := npx pnpm
endif

help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

check-deps: ## Check if required dependencies are installed
	@command -v node >/dev/null 2>&1 || { echo "Error: Node.js is not installed. Please install Node.js from https://nodejs.org/"; exit 1; }
	@echo "✓ Node.js is installed"
	@command -v pnpm >/dev/null 2>&1 && echo "✓ pnpm is installed" || echo "ℹ Using npx pnpm (local execution)"

install: check-deps ## Install all dependencies
	@echo "Installing dependencies..."
	@$(PNPM) install

setup: check-deps ## Install dependencies (pnpm, buf, etc.)
	@./tools/make/setup

proto: codegen ## Alias for codegen

codegen: ## Generate TS/Go code from proto definitions
	@./tools/make/codegen

build: check-deps ## Build all packages via Turbo
	@echo "Building all packages..."
	@$(PNPM) turbo run build

lint: check-deps ## Lint all packages
	@echo "Linting all packages..."
	@$(PNPM) turbo run lint

test: check-deps ## Run all tests
	@echo "Running all tests..."
	@$(PNPM) turbo run test

test-watch: check-deps ## Run tests in watch mode
	@echo "Running tests in watch mode..."
	@$(PNPM) turbo run test -- --watch

test-coverage: check-deps ## Run tests with coverage
	@echo "Running tests with coverage..."
	@$(PNPM) turbo run test -- --coverage

test-unit: check-deps ## Run unit tests only (faster)
	@echo "Running unit tests..."
	@$(PNPM) vitest run

clean: ## Clean generated files and build artifacts
	@echo "Cleaning generated files..."
	@rm -rf packages/api/gen
	@$(PNPM) turbo run clean
	@echo "Cleaning node_modules..."
	@find . -name "node_modules" -type d -prune -exec rm -rf {} +
	@find . -name "dist" -type d -prune -exec rm -rf {} +
	@echo "✓ Clean complete"
