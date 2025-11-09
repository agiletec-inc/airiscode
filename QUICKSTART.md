# QUICKSTART - airiscode Implementation Guide

This guide walks you through setting up and running the airiscode implementation from scratch.

## Prerequisites

- **Node.js**: >= 20.0.0
- **pnpm**: >= 9.0.0
- **buf CLI**: For proto code generation
- **macOS/Linux**: Primary development environment

## Installation

### 1. Install System Dependencies

```bash
# macOS
brew install bufbuild/buf/buf

# Install pnpm globally
npm install -g pnpm@9
```

### 2. Clone and Setup

```bash
cd /Users/kazuki/github/airiscode

# Install all dependencies
pnpm install

# Generate TypeScript/Go stubs from proto definitions
make codegen
```

### 3. Verify Setup

```bash
# Check generated proto stubs
ls packages/api/gen/ts/airiscode/v1/
# Expected output:
# - common.ts
# - events.ts
# - model_driver.ts
# - adapter.ts
# - runners.ts

ls packages/api/gen/go/airiscode/v1/
# Expected Go files
```

---

## Build & Development

### Build All Packages

```bash
# Build entire monorepo
pnpm build

# Build specific package
pnpm --filter @airiscode/sandbox build
pnpm --filter @airiscode/cli build
```

### Development Mode (Watch)

```bash
# Watch all packages
pnpm dev

# Watch specific package
pnpm --filter @airiscode/cli dev
```

### Linting & Type Checking

```bash
# Lint all packages
pnpm lint

# Type check
pnpm type-check
```

---

## Architecture Overview

### Directory Structure

```
airiscode/
├── packages/
│   ├── api/              # gRPC/proto definitions + generated code
│   ├── policies/         # Policy profiles & approval levels
│   ├── sandbox/          # Shell Guard security layer
│   ├── adapters/         # CLI wrappers (Claude/Codex/Gemini)
│   ├── drivers/          # LLM drivers (OpenAI/Anthropic/Ollama)
│   ├── mcp/              # MCP client & registry
│   └── runners/          # Git/Docker/Test runners
├── apps/
│   └── airiscode-cli/    # Main CLI application (Ink TUI)
└── tools/make/           # Build scripts
```

### Key Components

#### 1. **Proto Contracts** (`packages/api/proto/airiscode/v1/`)

Defines gRPC services for:
- `ModelDriver`: LLM abstraction (chat, tool calls, streaming)
- `AdapterProcess`: Child CLI wrapper (spawn, execute, shell proxy)
- `Runners`: Git/test execution
- `Event`: Structured logging (TUI + JSON Lines)

#### 2. **Shell Guard** (`packages/sandbox/shell-guard.ts`)

Security boundary enforcing:
- **Denylist**: Blocks dangerous commands (e.g., `rm -rf /`)
- **Rewrites**: Transforms commands (e.g., `npm install` → `pnpm install`)
- **Timeout enforcement**: Trust-level dependent limits

#### 3. **Policy Profiles** (`packages/policies/schemas/profiles.yaml`)

5 predefined profiles:
- `restricted`: Read-only, no shell
- `sandboxed`: Workspace write, network blocked (default)
- `untrusted`: Full access, Guard active
- `auto-gemini`: Auto-approve after 12s timeout
- `quality`: Pause on test failures

#### 4. **Adapters** (`packages/adapters/`)

Wrap existing CLIs:
- **claude-code**: Deep understanding (`plan`, `explain`, `review`)
- **codex**: Quality control (`implement`, `test`, `commit`)
- **gemini-cli**: Large context (`read`, `map`, `auto`)

Each adapter implements `AdapterProcess` gRPC service and proxies all shell execution through Shell Guard.

#### 5. **TUI** (`apps/airiscode-cli/src/ui/`)

Ink-based terminal UI:
- **Header**: Session info, badges (GUARD alerts)
- **Diff Panel**: Code changes visualization
- **Test Panel**: Test results
- **Log Panel**: Event stream
- **Status Bar**: Current phase, hotkeys

---

## Usage Examples

### Basic Execution (TUI Mode)

```bash
# Simple task with default settings
./apps/airiscode-cli/bin/airis code "Add /health endpoint"

# Specify adapters
./apps/airiscode-cli/bin/airis code "Refactor auth" \
  --adapters=claude-code,codex

# Use policy profile
./apps/airiscode-cli/bin/airis code "Fix bug" \
  --profile=quality
```

### JSON Lines Mode (CI/CD)

```bash
# Output structured events for automation
./apps/airiscode-cli/bin/airis code "Build feature" \
  --json > session.jsonl

# Parse events
cat session.jsonl | jq 'select(.kind == "EVENT_TEST_RESULT")'
```

### Gemini Auto-Approve Mode

```bash
# Autonomous execution with 12s timeout
./apps/airiscode-cli/bin/airis code "Add tests" \
  --adapters=gemini-cli \
  --approvals=on-request \
  --auto-approve-timeout=12000 \
  --auto-approve-hint=all \
  --trust=sandboxed
```

### Advanced Workflow (3-Adapter Chain)

```bash
# Gemini: understand → Claude: design → Codex: implement
./apps/airiscode-cli/bin/airis code "Add Supabase auth" \
  --adapters=gemini-cli,claude-code,codex \
  --approvals=on-failure \
  --trust=sandboxed \
  --guard=strict

# Execution flow:
# 1. Gemini: read + map (codebase structure)
# 2. Claude: plan + explain (design proposal)
# 3. Codex: implement + test (code changes)
# 4. On failure: pause for user approval
# 5. Codex: commit (auto-commit if tests pass)
```

---

## Configuration

### Policy Flags

| Flag | Values | Default | Description |
|------|--------|---------|-------------|
| `--approvals` | `never`/`on-failure`/`on-request` | `on-failure` | When to pause for approval |
| `--trust` | `restricted`/`sandboxed`/`untrusted` | `sandboxed` | Filesystem/network access level |
| `--guard` | `strict`/`lenient` | `strict` | Shell Guard enforcement mode |
| `--auto-approve-timeout` | milliseconds | `0` | Auto-approve delay (0=disabled) |
| `--auto-approve-hint` | `diff`/`test`/`all` | `""` | What to auto-approve |

### Hotkeys (TUI Mode)

| Key | Action |
|-----|--------|
| `y` | Approve current action |
| `n` | Reject current action |
| `d` | Toggle diff panel |
| `l` | Toggle logs panel |
| `t` | Toggle tests panel |
| `c` | Copy command to clipboard |
| `q` | Quit |
| `?` | Show help |

---

## Development Workflow

### 1. Adding a New Adapter

```bash
# Create adapter directory
mkdir -p packages/adapters/my-adapter/{bin,src}

# Create plugin manifest
cat > packages/adapters/my-adapter/plugin.json <<EOF
{
  "name": "adapter-my-adapter",
  "version": "0.1.0",
  "kind": "adapter",
  "entry": "bin/my-adapter",
  "capabilities": {
    "actions": ["custom-action"],
    "streamLogs": true
  },
  "policy": {
    "requiresShellProxy": true,
    "defaultTrust": "sandboxed"
  }
}
EOF

# Implement AdapterProcess gRPC service
# See packages/adapters/README.md for template
```

### 2. Modifying Proto Definitions

```bash
# Edit proto files
vim packages/api/proto/airiscode/v1/adapter.proto

# Regenerate code
make codegen

# Rebuild affected packages
pnpm build
```

### 3. Testing Shell Guard

```bash
# Unit tests
pnpm --filter @airiscode/sandbox test

# Manual test
node -e "
  const { getGuard } = require('./packages/sandbox/dist/shell-guard.js');
  (async () => {
    const guard = await getGuard();
    console.log(guard.evaluate('rm -rf /', 'sandboxed'));
    // { allowed: false, reason: 'Denied: System wipe protection' }
  })();
"
```

---

## Troubleshooting

### Issue: `buf generate` fails

**Solution**: Ensure buf CLI is installed:
```bash
buf --version
# If not found:
brew install bufbuild/buf/buf
```

### Issue: TypeScript compilation errors

**Solution**: Check references in tsconfig.json:
```bash
# Verify all referenced packages exist
pnpm --filter @airiscode/cli exec tsc --noEmit
```

### Issue: Adapter not found

**Solution**: Verify adapter plugin.json exists:
```bash
ls packages/adapters/*/plugin.json
```

### Issue: Shell Guard blocks valid command

**Solution**: Add to allowlist or adjust trust level:
```bash
# Edit guard schema
vim packages/policies/schemas/guard.schema.yaml

# Or use higher trust level
./bin/airis code "task" --trust=untrusted
```

---

## Next Steps

1. **Implement Adapter Logic**: Complete `packages/adapters/claude-code/src/claude-code-adapter.ts`
2. **MCP Integration**: Connect to AIRIS MCP Gateway for tool discovery
3. **MindBase Integration**: Persist conversation history locally
4. **Integration Tests**: Add E2E workflow tests
5. **CI/CD**: Configure GitHub Actions for automated builds

---

## References

- **Architecture**: See `ARCHITECTURE.md` for system design
- **Adapter Guide**: See `packages/adapters/README.md`
- **Proto Definitions**: See `packages/api/proto/airiscode/v1/`
- **Policy Schemas**: See `packages/policies/schemas/`

---

## Support

For issues or questions:
- Check existing issues: (GitHub link TBD)
- Review ARCHITECTURE.md and CLAUDE.md
- Inspect event logs: `--json` mode for debugging
