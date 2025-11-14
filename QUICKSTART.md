# AIRIS Code - Quickstart Guide

🚀 **AIRIS Code** is a terminal-first autonomous coding runner with unified multi-provider support.

## Installation & Setup

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Build Packages

```bash
pnpm -w build
```

### 3. Configure Provider

Copy the example config:

```bash
cp ~/.airiscode/config.toml.example ~/.airiscode/config.toml
```

Edit `~/.airiscode/config.toml` and configure your provider.

## Provider Configuration Examples

### OpenAI

```toml
[provider]
name = "openai"

[openai]
api_key = "$OPENAI_API_KEY"
model = "gpt-4o-mini"
```

```bash
export OPENAI_API_KEY="sk-..."
```

### Anthropic (Claude)

```toml
[provider]
name = "anthropic"

[anthropic]
api_key = "$ANTHROPIC_API_KEY"
model = "claude-3-5-sonnet-latest"
```

```bash
export ANTHROPIC_API_KEY="sk-ant-..."
```

### Ollama (Local)

```toml
[provider]
name = "ollama"

[ollama]
model = "qwen2.5:7b"
```

```bash
ollama serve
ollama pull qwen2.5:7b
```

## Running

```bash
# Development
pnpm --filter @airiscode/cli dev

# Production
pnpm --filter @airiscode/cli start
```

## Features

### Phase 1: Streaming & History ✅

- ✅ **Real-time streaming** - 50ms buffered chunk display
- ✅ **Multi-turn conversations** - Full conversation context
- ✅ **Session persistence** - JSON Lines format (`~/.airiscode/sessions/*.jsonl`)
- ✅ **Error handling** - Partial response preservation
- ✅ **Provider switching** - OpenAI, Anthropic, Ollama

### Phase 2: Enhanced UI & Commands ✅

- ✅ **Context architecture** - SessionContext, UIStateContext
- ✅ **Slash commands** - `/help`, `/clear`, `/exit`
- ✅ **Enhanced Composer** - Visual command detection
- ✅ **Message Display** - Organized conversation view
- ✅ **Error display** - Inline error messages
- ✅ **Status indicators** - Streaming, message count

### Phase 3: MCP Gateway Integration ✅

- ✅ **MCPContext** - MCP Gateway client management
- ✅ **Tool orchestration** - Context7, Serena, Supabase tools
- ✅ **MCP commands** - `/mcp connect`, `/mcp status`, `/tools`
- ✅ **Connection status** - Visual indicators in header
- ✅ **Dynamic tool discovery** - Always-on tools from gateway
- ✅ **Error handling** - Graceful connection failures

## Usage

### Basic Chat

1. Start AIRIS Code: `pnpm --filter @airiscode/cli dev`
2. Type your message and press Enter
3. Watch real-time streaming response
4. Continue multi-turn conversation

### Slash Commands

- `/help` - Show available commands
- `/clear` - Clear conversation history
- `/mcp connect [url]` - Connect to MCP Gateway
- `/mcp status` - Show MCP connection and server status
- `/mcp tools` - List available MCP tools
- `/tools` - Quick list of MCP tools
- `/exit` or `/quit` - Exit application
- Press `Ctrl+C` anytime to exit

### Example Session

```
AIRIS Code (2 turns) | session-1699999999

You: Explain TypeScript in one sentence
Assistant: TypeScript is a superset of JavaScript that adds static typing...

You: /help
Assistant: Available commands:
/clear - Clear conversation history
/help - Show this help message

> your message here_

Ready (4 messages)
```

### MCP Gateway Integration

AIRIS Code integrates with [AIRIS MCP Gateway](https://github.com/agiletec-inc/airis-mcp-gateway) to provide tool orchestration for Context7, Serena AI, Supabase, and 25+ MCP servers.

#### Starting the MCP Gateway

```bash
# Clone and start the gateway
cd /path/to/airis-mcp-gateway
pnpm install
pnpm dev

# Gateway runs at http://localhost:3000
```

#### Connecting from AIRIS Code

1. **Start AIRIS Code:**
   ```bash
   pnpm --filter @airiscode/cli dev
   ```

2. **Connect to gateway:**
   ```
   > /mcp connect http://localhost:3000
   ```

3. **Check connection status:**
   ```
   > /mcp status
   ```

   Output:
   ```
   MCP Gateway Status: ✅ Connected

   Servers:
     - context7: enabled (5 tools)
     - serena: enabled (3 tools)
     - supabase: enabled (7 tools)
   ```

4. **List available tools:**
   ```
   > /tools
   ```

   Output:
   ```
   Available Tools (15):
     - get-library-docs: Fetches up-to-date documentation for a library
     - resolve-library-id: Resolves package name to Context7 library ID
     - serena_search: AI-powered web search with citations
     - supabase_query: Execute SQL queries on Supabase database
     ...
   ```

#### MCP Gateway Features

- **Lazy tool discovery** - Tools loaded on-demand
- **Always-on tools** - Core tools available immediately after connection
- **Server management** - Enable/disable MCP servers dynamically
- **HTTP/SSE streaming** - Real-time tool invocation results
- **25+ MCP servers** - Context7, Serena, Supabase, filesystem, browser automation, etc.

#### Example MCP Workflow

```
AIRIS Code | MCP: 15 tools | session-1699999999

You: /mcp connect
Assistant: ✅ Connected to MCP Gateway at http://localhost:3000
15 tools available

You: /tools
Assistant: Available Tools (15):
  - get-library-docs: Fetches up-to-date documentation for a library
  - resolve-library-id: Resolves package name to Context7 library ID
  - serena_search: AI-powered web search with citations
  ...

You: Explain React hooks using official docs
Assistant: [Uses get-library-docs to fetch React documentation]
React hooks are functions that let you use state and lifecycle features...

> _

Ready (6 messages)
```

#### Troubleshooting MCP

**Gateway not running:**
```bash
cd /path/to/airis-mcp-gateway
pnpm dev
# Check http://localhost:3000/health
```

**Connection refused:**
```
> /mcp connect http://localhost:3000
❌ Failed to connect: ECONNREFUSED
```
Solution: Ensure gateway is running and accessible at the specified URL

**No tools available:**
```
> /mcp status
MCP Gateway Status: ✅ Connected

Servers:
  No servers
```
Solution: Check gateway configuration in `airis-mcp-gateway/config.json` and ensure servers are enabled

## Architecture

```
apps/airiscode-cli/src/
├─ index.tsx              # Entry point
├─ EnhancedApp.tsx        # Main UI with contexts
├─ contexts/
│  ├─ SessionContext.tsx  # Session & message management
│  ├─ UIStateContext.tsx  # UI state (loading, error, streaming)
│  └─ MCPContext.tsx      # MCP Gateway client & tool management
├─ components/
│  ├─ Composer.tsx        # Input with slash command detection
│  └─ MessageDisplay.tsx  # Conversation display
├─ providerFactory.ts     # Multi-provider initialization
└─ sessionStorage.ts      # JSON Lines persistence

packages/
├─ core-gemini/           # Provider-agnostic types
├─ drivers/               # OpenAI, Anthropic, Ollama drivers
└─ mcp/
   ├─ gateway-client/     # MCP Gateway HTTP client
   ├─ session/            # MCP session management
   └─ registry/           # MCP tool registry
```

## Session Files

Sessions auto-save to `~/.airiscode/sessions/session-{timestamp}.jsonl`:

```jsonl
{"role":"user","content":"Hello","timestamp":1699999999}
{"role":"assistant","content":"Hi!","timestamp":1699999999}
```

## Next Steps

🚧 **Shell Guard & Policies**
- Command filtering (`rm -rf /`, fork bombs)
- Approval levels (never/on-failure/on-request)
- Trust boundaries (restricted/sandboxed/untrusted)

🚧 **Tool Call Confirmation UI**
- Display tool parameters before invocation
- User approval for sensitive operations
- Tool execution logs

🚧 **Advanced UI**
- Code syntax highlighting
- Diff visualization
- File tree navigation

## Troubleshooting

### Config not found

```bash
cp ~/.airiscode/config.toml.example ~/.airiscode/config.toml
# Edit and set your provider/API key
```

### Build errors

```bash
pnpm -w clean
pnpm install
pnpm -w build
```

### Provider errors

Check your API key:
```bash
echo $OPENAI_API_KEY    # or ANTHROPIC_API_KEY
```

## License

MIT - See LICENSE file

---

**Built with:** pnpm + Turbo | Ink UI | TypeScript
