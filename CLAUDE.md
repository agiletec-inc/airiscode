# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**airiscode** is a terminal-first autonomous coding runner that orchestrates multiple CLI coding assistants (Claude Code, Codex, Gemini CLI, Aider) through a unified interface. It integrates Super Agent runtime, SuperClaude assets, MindBase (local semantic memory), and AIRIS MCP Gateway.

**Current Status**: Pre-implementation architecture phase. ARCHTECHTURE.md and AGENTS.md define the vision; actual packages/apps are not yet built.

## Development Commands

This is a **pnpm + Turbo monorepo** (planned structure):

```bash
# Install dependencies
pnpm install

# Build all packages
pnpm turbo run build

# Lint all packages
pnpm turbo run lint

# Run all tests
pnpm turbo run test

# Run CLI locally (when implemented)
pnpm --filter apps/airiscode-cli dev

# Run single package tests
pnpm turbo run test -- --filter <package-name>

# Use Make targets for CI consistency
tools/make/setup
tools/make/test
```

## Architecture Fundamentals

### Core Principles (from ARCHTECHTURE.md:1-15)

1. **No reimplementation** – Wrap existing CLIs (Claude Code, Codex, etc.) as child processes via adapters; never fork upstream code
2. **LLM-agnostic** – Orchestration runtime (Super Agent) supports OpenAI, Anthropic, Google, local models (Ollama/MLX)
3. **Dynamic tooling** – MCP Gateway advertises tools lazily; only describe tools to LLM when planner selects them
4. **Local memory** – MindBase keeps conversation + task logs entirely local (pgvector + Ollama embeddings)
5. **Strict policies** – CLI enforces `--approvals` (never/on-request/on-failure) and `--trust` (restricted/sandboxed/untrusted)
6. **Terminal-first UX** – Ink-based TUI + `--json` headless mode for CI/CD integration

### Monorepo Structure (from ARCHTECHTURE.md:18-37)

```
airiscode/
├─ apps/
│  └─ airiscode-cli/          # Ink+Commander CLI, policy enforcement, session UI
├─ packages/
│  ├─ drivers/                # LLM drivers (openai, anthropic, google, local/ollama, mlx)
│  ├─ adapters/               # Child-process wrappers for Codex/Claude Code/Gemini/Aider
│  ├─ mcp/
│  │  ├─ client/              # Lazy tool discovery, MCP transport
│  │  └─ registry/            # tools.json templates
│  ├─ policies/               # Approval/trust profiles
│  ├─ sandbox/                # Shell Guard - deny/allow lists, command analysis
│  ├─ runners/                # git-runner, docker-runner
│  └─ ux/                     # Prompt assets, diff renderers
├─ tools/make/                # Reproducible Make targets
└─ docs/                      # Architecture docs
```

### Execution Flow (from ARCHTECHTURE.md:58-89)

1. **User command**: `airis code "Add /health endpoint" --approvals=never --trust=sandboxed`
2. **Session bootstrap**: Load policy profile, init MindBase, detect adapters, render TUI
3. **Planning**: Super Agent evaluates confidence, generates deep research plan, builds repo index
4. **Tool orchestration**: AIRIS MCP Gateway exposes MindBase/Serena/Context7/Supabase tools lazily
5. **Adapter invocation**: Choose adapter(s) based on policy; run as child process; Shell Guard filters commands
6. **Runners & verification**: git-runner stages diffs/tests, docker-runner spins up services
7. **Reporting**: Emit diff/logs to TUI + optional `--json`; MindBase stores conversation

### Policy & Safety (from ARCHTECHTURE.md:105-115)

| Flag | Behavior |
|------|----------|
| `--approvals=never` | Fully autonomous, auto-retry with backoff |
| `--approvals=on-failure` | Pause for input on errors |
| `--approvals=on-request` | Execute only when user approves |
| `--trust=restricted` | Read-only FS, shell disabled |
| `--trust=sandboxed` | Workspace write allowed, network blocked |
| `--trust=untrusted` | Full access, but Shell Guard still blocks dangerous commands |

**Shell Guard** parses every command before execution and blocks: `rm -rf /`, `docker system prune`, fork bombs, etc.

## Coding Standards

### TypeScript Configuration (from AGENTS.md:14-15)

- Use 2-space indentation, semicolons
- Strict TypeScript: `"strict": true` in all tsconfig.json files
- PascalCase for types/classes, camelCase for functions/variables, kebab-case for directories

### Module Organization (from AGENTS.md:4)

- New adapters → `packages/adapters/<name>/`
- New drivers → `packages/drivers/<name>/`
- Shared utilities → `packages/ux/` or `packages/policies/`
- Tests alongside code: `*.spec.ts` or `__tests__/` directories
- Fixtures under `__fixtures__/` when needed

### Testing (from AGENTS.md:17-18)

- Unit tests: `*.spec.ts` next to source files
- Integration tests for runners/adapters must exercise Shell Guard and policy hooks
- Run focused tests: `pnpm turbo run test -- --filter <package>`
- Maintain existing coverage levels (CI enforces)

### Commit Style (from AGENTS.md:20-21)

- Follow conventional commits: `feat:`, `fix:`, `docs:`, `refactor:`, etc.
- PRs must describe: problem, solution, validation (commands run, screenshots for TUI)
- Reference ARCHTECHTURE.md sections when changing security flows
- Ensure `pnpm turbo run build lint test` passes before PR

## Key Integration Points

### Super Agent Runtime (from ARCHTECHTURE.md:45)
Located at `/Users/kazuki/github/superagent`. Provides ABI modules under `src/superagent/api/*`:
- `api/confidence` – Confidence gating and evaluation
- `api/deep_research` – Deep research planning
- `api/repo_index` – Repository indexing

### MindBase (from ARCHTECHTURE.md:47)
Located at `/Users/kazuki/github/mindbase`. Exposes MCP tools:
- `mindbase_store` – Store conversation/task data
- `mindbase_search` – Semantic search via pgvector + Ollama embeddings

### AIRIS MCP Gateway (from ARCHTECHTURE.md:48)
Located at `/Users/kazuki/github/airis-mcp-gateway`. Registers 25+ MCP servers, streams tool metadata lazily, hosts HTTP/SSE endpoints.

### SuperClaude Assets (from ARCHTECHTURE.md:46)
- `SuperClaude_Framework` – TypeScript plugin version
- `SuperClaude_Plugin` – Slash-command bundle

## Security Considerations (from AGENTS.md:23-24)

When adding new tools or adapters:
1. Never downgrade `--approvals` or `--trust` defaults in code
2. Route all external shell execution through `packages/sandbox/` utilities
3. Document proposed shell commands for Shell Guard review
4. Ensure new adapters respect policy profiles from `packages/policies/`

## Implementation Notes

### Model Drivers (from ARCHTECHTURE.md:93-100)
Uniform `ModelDriver` interface must support:
- `chat`, `toolCall`, `stream` methods
- Local models via Ollama/MLX on M4 Air (32GB)
- Remote GPU servers via SSH/HTTP
- Cloud APIs (OpenAI, Anthropic, Google) with user-provided keys

### Adapter Contract (from ARCHTECHTURE.md:380-381, proto definitions)
Each adapter communicates via gRPC/JSON:
- `Spawn` – Start adapter process with policy profile
- `Execute` – Send action + input_json, receive output + proposed shell commands
- `StreamLogs` – Real-time log streaming
- `RequestShell` – Submit command for Shell Guard approval
- `Terminate` – Clean shutdown

### Event System (from ARCHTECHTURE.md:274-294)
Structured events for `--json` mode:
- `EVENT_SESSION_START`, `EVENT_SESSION_END`
- `EVENT_ADAPTER_SPAWN`, `EVENT_TOOL_CALL`
- `EVENT_GUARD_BLOCK`, `EVENT_DIFF_READY`
- `EVENT_TEST_START`, `EVENT_TEST_RESULT`
- `EVENT_COMMIT`, `EVENT_ERROR`

## Related Documentation

- **ARCHTECHTURE.md** – Complete architecture, execution flows, sequence diagrams, gRPC proto definitions
- **AGENTS.md** – Repository guidelines, build/test commands, coding standards, commit style

## Development Targets

1. **Mac (M4 Air)** – Primary dev environment; Ollama for local inference, Docker Desktop for MindBase/gateway
2. **Linux GPU node** – Optional remote driver via SSH/HTTP
3. **Open-source release** – MIT license for CLI + packages; MindBase is monetization vector
