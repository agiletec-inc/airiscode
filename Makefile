.PHONY: help setup proto codegen build lint test test-watch test-coverage test-unit clean install check-deps

help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

check-deps: ## Check if required dependencies are installed
	@command -v pnpm >/dev/null 2>&1 || { echo "Error: pnpm is not installed. Run 'npm install -g pnpm' or see https://pnpm.io/installation"; exit 1; }
	@echo "✓ pnpm is installed"

install: check-deps ## Install all dependencies
	@echo "Installing dependencies..."
	@pnpm install

setup: check-deps ## Install dependencies (pnpm, buf, etc.)
	@./tools/make/setup

proto: codegen ## Alias for codegen

codegen: ## Generate TS/Go code from proto definitions
	@./tools/make/codegen

build: check-deps ## Build all packages via Turbo
	@echo "Building all packages..."
	@pnpm turbo run build

lint: check-deps ## Lint all packages
	@echo "Linting all packages..."
	@pnpm turbo run lint

test: check-deps ## Run all tests
	@echo "Running all tests..."
	@pnpm turbo run test

test-watch: check-deps ## Run tests in watch mode
	@echo "Running tests in watch mode..."
	@pnpm turbo run test -- --watch

test-coverage: check-deps ## Run tests with coverage
	@echo "Running tests with coverage..."
	@pnpm turbo run test -- --coverage

test-unit: check-deps ## Run unit tests only (faster)
	@echo "Running unit tests..."
	@pnpm vitest run

clean: ## Clean generated files and build artifacts
	@echo "Cleaning generated files..."
	@rm -rf packages/api/gen
	@pnpm turbo run clean
	@echo "Cleaning node_modules..."
	@find . -name "node_modules" -type d -prune -exec rm -rf {} +
	@find . -name "dist" -type d -prune -exec rm -rf {} +
	@echo "✓ Clean complete"
