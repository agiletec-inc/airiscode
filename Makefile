.PHONY: help setup proto codegen build lint test clean

help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

setup: ## Install dependencies (pnpm, buf, etc.)
	@./tools/make/setup

proto: codegen ## Alias for codegen

codegen: ## Generate TS/Go code from proto definitions
	@./tools/make/codegen

build: ## Build all packages via Turbo
	@pnpm turbo run build

lint: ## Lint all packages
	@pnpm turbo run lint

test: ## Run all tests
	@pnpm turbo run test

clean: ## Clean generated files
	@rm -rf packages/api/gen
	@pnpm turbo run clean
