# ============================================
# AIRIS Code - Docker Development Environment
# ============================================

# Docker Compose settings
export COMPOSE_DOCKER_CLI_BUILD := 1
export DOCKER_BUILDKIT := 1

# UID/GID for Docker user matching
export HOST_UID := $(shell id -u)
export HOST_GID := $(shell id -g)

# Docker Compose command
DC := docker compose -f docker-compose.dev.yml
WORKSPACE_SERVICE := workspace

# Colors
GREEN := \033[0;32m
YELLOW := \033[1;33m
BLUE := \033[0;34m
NC := \033[0m

.DEFAULT_GOAL := help

# ---- Help ----
.PHONY: help
help:
	@echo "╔════════════════════════════════════════╗"
	@echo "║  AIRIS Code - Makefile Commands        ║"
	@echo "╚════════════════════════════════════════╝"
	@echo ""
	@echo "$(GREEN)Container Management:$(NC)"
	@echo "  make up          - Start development container"
	@echo "  make down        - Stop development container"
	@echo "  make restart     - Restart development container"
	@echo "  make logs        - Show container logs"
	@echo "  make ps          - Show container status"
	@echo ""
	@echo "$(GREEN)Workspace:$(NC)"
	@echo "  make shell       - Enter workspace shell"
	@echo "  make bash        - Enter workspace bash"
	@echo ""
	@echo "$(GREEN)Development:$(NC)"
	@echo "  make install     - Install dependencies"
	@echo "  make build       - Build all packages"
	@echo "  make dev         - Run CLI in development mode"
	@echo "  make test        - Run tests"
	@echo "  make lint        - Run linter"
	@echo "  make clean       - Clean build artifacts"
	@echo ""
	@echo "$(GREEN)CLI Commands:$(NC)"
	@echo "  make cli         - Run airiscode CLI (use: make cli CMD='code \"task\"')"
	@echo ""

# ---- Container Management ----
.PHONY: up
up:
	@echo "$(BLUE)Starting workspace container...$(NC)"
	@$(DC) up -d
	@echo "$(GREEN)✓ Workspace ready$(NC)"

.PHONY: down
down:
	@echo "$(BLUE)Stopping containers...$(NC)"
	@$(DC) down

.PHONY: restart
restart: down up

.PHONY: logs
logs:
	@$(DC) logs -f $(WORKSPACE_SERVICE)

.PHONY: ps
ps:
	@$(DC) ps

# ---- Workspace ----
.PHONY: shell
shell:
	@$(DC) exec -it $(WORKSPACE_SERVICE) sh

.PHONY: bash
bash:
	@$(DC) exec -it $(WORKSPACE_SERVICE) bash

# ---- Development ----
.PHONY: install
install:
	@echo "$(BLUE)Installing dependencies...$(NC)"
	@$(DC) build
	@echo "$(BLUE)Preparing workspace volumes...$(NC)"
	@$(DC) run --rm --user root $(WORKSPACE_SERVICE) bash -c "\
		mkdir -p /app/node_modules /home/app/.local/share/pnpm/store/v3 && \
		chown -R app:app /app/node_modules /home/app/.local"
	@$(DC) run --rm -e CI=true $(WORKSPACE_SERVICE) pnpm install --no-frozen-lockfile
	@echo "$(GREEN)✓ Dependencies installed$(NC)"

.PHONY: build
build:
	@echo "$(BLUE)Building packages...$(NC)"
	@$(DC) exec $(WORKSPACE_SERVICE) pnpm turbo run build
	@echo "$(GREEN)✓ Build complete$(NC)"

.PHONY: dev
dev:
	@echo "$(BLUE)Running airiscode CLI...$(NC)"
	@$(DC) exec -it $(WORKSPACE_SERVICE) pnpm --filter @airiscode/cli dev

.PHONY: test
test:
	@$(DC) exec $(WORKSPACE_SERVICE) pnpm turbo run test

.PHONY: lint
lint:
	@$(DC) exec $(WORKSPACE_SERVICE) pnpm turbo run lint

.PHONY: clean
clean:
	@echo "$(BLUE)Cleaning build artifacts...$(NC)"
	@$(DC) exec $(WORKSPACE_SERVICE) pnpm turbo run clean
	@echo "$(GREEN)✓ Clean complete$(NC)"

# ---- CLI Commands ----
.PHONY: cli
cli:
	@$(DC) exec -it $(WORKSPACE_SERVICE) pnpm --filter @airiscode/cli start $(CMD)

# ---- Init ----
.PHONY: init
init:
	@echo "$(BLUE)Initializing project...$(NC)"
	@$(MAKE) down
	@$(MAKE) install
	@$(MAKE) up
	@echo "$(GREEN)✓ Initialization complete$(NC)"
	@echo ""
	@echo "Run: $(YELLOW)make dev$(NC) to start development"
