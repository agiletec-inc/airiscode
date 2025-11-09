# airiscode

**Terminal-first autonomous coding runner** that orchestrates multiple CLI coding assistants (Claude Code, Codex, Gemini CLI, Aider) through a unified interface.

## Features

- 🤖 **Multi-LLM Support**: OpenAI, Anthropic, Google, Ollama, MLX
- 🔌 **CLI Adapters**: Unified interface for Codex, Claude Code, Gemini CLI, Aider
- 🛡️ **Shell Guard**: Blocks dangerous commands (rm -rf /, docker system prune, etc.)
- 🔐 **Policy Management**: Configurable approval and trust levels
- 🧠 **MindBase Integration**: Local semantic memory with pgvector
- 🔧 **MCP Gateway**: Dynamic tool loading via AIRIS MCP Gateway
- 📊 **TUI**: Beautiful terminal UI built with Ink

## Quick Start

### Prerequisites

- Node.js >= 20.0.0
- pnpm >= 8.0.0

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/airiscode.git
cd airiscode

# Install dependencies
make install

# Build all packages
make build

# Run tests
make test
```

### Development

```bash
# Show all available commands
make help

# Watch mode for all packages
pnpm dev

# Run linter
make lint

# Run tests with coverage
make test-coverage

# Run tests in watch mode
make test-watch

# Clean build artifacts
make clean
```

### Available Make Commands

```bash
make help             # Show this help
make check-deps       # Check if required dependencies are installed
make install          # Install all dependencies
make build            # Build all packages via Turbo
make lint             # Lint all packages
make test             # Run all tests
make test-watch       # Run tests in watch mode
make test-coverage    # Run tests with coverage
make test-unit        # Run unit tests only (faster)
make clean            # Clean generated files and build artifacts
```

## Project Structure

```
airiscode/
├── apps/
│   └── airiscode-cli/          # Main CLI application
├── packages/
│   ├── types/                  # Shared TypeScript types
│   ├── policies/               # Policy profiles
│   ├── sandbox/                # Shell Guard
│   ├── drivers/                # LLM drivers
│   ├── adapters/               # CLI adapters
│   ├── mcp/                    # MCP client & registry
│   ├── runners/                # Git/Docker/Test runners
│   ├── super-agent/            # Super Agent runtime wrapper
│   ├── mindbase/               # MindBase client
│   └── ux/                     # Common UI components
└── tools/
    └── make/                   # Build scripts
```

## Usage

```bash
# Shorthand - execute task directly
airis "Add a /health endpoint to the API"

# With options
airis "Refactor authentication" --adapter claude-code --policy sandboxed --verbose

# Explicit code command (also works)
airis code "Add authentication feature"

# Interactive mode with restricted access
airis "Review security" --policy restricted

# Use specific adapter and driver
airis "Fix bug #123" --adapter claude-code --driver ollama

# JSON output for CI/CD
airis "Run tests" --json

# Configuration management
airis config --list
airis config --set defaultDriver=ollama

# Session management
airis session --list
airis session --show <session-id>
airis session --resume <session-id>
```

## Policy Levels

### Approval Levels
- `never`: Fully autonomous, no user approval required
- `on-failure`: Pause for user input when errors occur (default)
- `on-request`: Require explicit user approval before executing actions

### Trust Levels
- `restricted`: Read-only filesystem, shell disabled
- `sandboxed`: Workspace write allowed, external network blocked (default)
- `untrusted`: Full access, but Shell Guard still blocks dangerous commands

## Architecture

See [ARCHTECHTURE.md](./ARCHTECHTURE.md) for detailed architecture documentation.

## Implementation Plan

See [実装計画プランニング.md](./実装計画プランニング.md) for the detailed implementation roadmap.

## Development Status

**Current Phase**: Phase 5 Complete ✅

### Completed Phases

- [x] **Phase 0 - Foundation** (3 packages)
  - `@airiscode/types` - Common types and Result pattern
  - `@airiscode/policies` - Security policies (ApprovalsLevel, TrustLevel)
  - `@airiscode/sandbox` - ShellGuard with deny list

- [x] **Phase 1 - Core Interfaces** (2 packages)
  - `@airiscode/drivers` - ModelDriver abstract class
  - `@airiscode/adapters` - AdapterProcess abstract class

- [x] **Phase 2 - Implementations** (2 packages)
  - `@airiscode/drivers-local` - Ollama driver with streaming
  - `@airiscode/adapters-claude-code` - Claude Code CLI adapter

- [x] **Phase 3 - MCP Integration** (2 packages)
  - `@airiscode/mcp-client` - MCP Gateway client with caching
  - `@airiscode/mcp-registry` - Tool search and invocation tracking

- [x] **Phase 4 - Runners** (3 packages)
  - `@airiscode/runners-git` - Git operations (status, commit, push, patch)
  - `@airiscode/runners-docker` - Docker operations (compose, health, stats)
  - `@airiscode/runners-test` - Multi-framework test runner (7 frameworks)

- [x] **Phase 5 - CLI** (1 package)
  - `@airiscode/cli` - Commander.js-based CLI with 3 commands
  - Shorthand command support: `airis "task"`
  - Session management
  - Configuration management

### Statistics

- **Total Packages**: 13
- **Total Files**: 141
- **Lines of Code**: 14,180+
- **Test Files**: 13
- **Test Coverage**: Comprehensive (2,500+ lines of tests)

## Contributing

Please read [CONTRIBUTING.md](./CONTRIBUTING.md) for development guidelines.

## License

MIT License - see [LICENSE](./LICENSE) for details.

## Related Projects

- [Super Agent](https://github.com/yourusername/superagent) - Confidence gating and deep research
- [MindBase](https://github.com/yourusername/mindbase) - Local semantic memory
- [AIRIS MCP Gateway](https://github.com/yourusername/airis-mcp-gateway) - MCP server aggregation

## Documentation

- [CLAUDE.md](./CLAUDE.md) - Guide for Claude Code
- [AGENTS.md](./AGENTS.md) - Repository guidelines
- [ARCHTECHTURE.md](./ARCHTECHTURE.md) - System architecture
- [実装計画プランニング.md](./実装計画プランニング.md) - Implementation plan
