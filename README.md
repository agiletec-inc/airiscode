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
pnpm install

# Build all packages
pnpm build

# Run tests
pnpm test
```

### Development

```bash
# Watch mode for all packages
pnpm dev

# Run linter
pnpm lint

# Format code
pnpm format
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

## Usage (Planned)

```bash
# Run airiscode with default settings
airis code "Add a /health endpoint to the API"

# Fully autonomous mode
airis code "Refactor authentication" --approvals=never --trust=sandboxed

# Interactive mode with restricted access
airis code "Review security" --approvals=on-request --trust=restricted

# Use specific adapter and driver
airis code "Fix bug #123" --adapters=claude-code --driver=ollama --model=qwen2.5-coder:7b

# Enable specific MCP tools
airis code "Query database" --tools=mcp:supabase,mcp:mindbase

# JSON output for CI/CD
airis code "Run tests" --json
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

**Current Phase**: Phase 0 - Project Foundation

- [x] Monorepo setup (pnpm + Turbo)
- [x] TypeScript configuration
- [x] `@airiscode/types` package
- [x] `@airiscode/policies` package
- [x] `@airiscode/sandbox` package with Shell Guard
- [ ] CI/CD pipeline
- [ ] Remaining packages

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
