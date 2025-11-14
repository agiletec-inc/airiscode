# Tool Execution Loop - Implementation Guide

## Overview

AIRIS Code implements a complete LLM↔MCP tool execution loop that enables autonomous coding agents to interact with external tools and APIs. This document explains the architecture, implementation, and usage.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         ChatApp (UI)                            │
│  - React Ink UI component                                       │
│  - Message rendering                                            │
│  - Tool result display                                          │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    useChatSession Hook                          │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │  1. User sends message                                    │ │
│  │  2. Build conversation history                            │ │
│  │  3. Get available MCP tools                               │ │
│  │  4. Call ModelDriver.chat(messages, tools)                │ │
│  │  5. If tool_calls: execute → add results → loop to step 4│ │
│  │  6. No tool_calls: done, return response                  │ │
│  └───────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                              │
                ┌─────────────┴────────────┐
                ▼                          ▼
┌──────────────────────────┐   ┌──────────────────────────┐
│   ModelDriver            │   │   MCPSessionManager      │
│  - Ollama                │   │  - Gateway client        │
│  - OpenAI                │   │  - Lazy loader           │
│  - Anthropic             │   │  - Tool invocation       │
│  - Tool calling support  │   │  - 6 always-on servers   │
│  - Streaming responses   │   │  - 13+ lazy servers      │
└──────────────────────────┘   └──────────────────────────┘
```

## Implementation Details

### 1. useChatSession Hook

Located at: `apps/airiscode-cli/src/hooks/useChatSession.ts`

**Purpose**: Manages chat session state and implements tool execution loop

**Key Functions**:

#### `sendMessage(content: string)`
Main entry point for user messages. Orchestrates the entire flow:

```typescript
async sendMessage(content: string) {
  1. Add user message to conversation
  2. Get MCP tools from session (if available)
  3. Call runToolExecutionLoop()
  4. Display final response
}
```

#### `runToolExecutionLoop(messages, tools)`
Core loop that handles tool execution:

```typescript
async runToolExecutionLoop(messages, tools) {
  iteration = 0
  maxIterations = 10 // Prevent infinite loops

  while (iteration < maxIterations) {
    // Call LLM with messages and available tools
    response = await driver.chat({ messages, tools })

    // No tool calls? We're done
    if (!response.toolCalls) return response.text

    // Execute all requested tools
    toolResults = await executeToolCalls(response.toolCalls)

    // Add assistant message + tool results to conversation
    messages.push(assistantMessage, ...toolResults)

    // Loop continues with updated conversation
    iteration++
  }
}
```

#### `executeToolCalls(toolCalls)`
Executes tool calls via MCP Gateway:

```typescript
async executeToolCalls(toolCalls: ToolCall[]) {
  for (toolCall of toolCalls) {
    // Check if tool is available
    tool = mcpSession.getAllTools().find(t => t.name === toolCall.name)

    if (!tool) {
      // Try enabling lazy server
      serverName = extractServerName(toolCall.name)
      await mcpSession.enableLazyServer(serverName)
    }

    // Parse MCP tool name: "mcp__<server>__<tool>"
    [serverName, toolName] = parseToolName(toolCall.name)

    // Invoke tool via MCP
    result = await mcpSession.invokeTool(
      serverName,
      toolName,
      toolCall.arguments
    )

    // Return result as tool message
    results.push({
      role: 'tool',
      content: JSON.stringify(result),
      toolCallId: toolCall.id
    })
  }

  return results
}
```

### 2. ChatApp Integration

Located at: `apps/airiscode-cli/src/ui/ChatApp.tsx`

**Changes**:
- Added `mcpSession?: MCPSessionManager` prop
- Uses `useChatSession` hook instead of direct driver calls
- Renders tool execution results in UI
- Shows MCP tools count in header

**Tool Result Display**:
```tsx
{msg.toolResults && (
  <Box paddingLeft={4}>
    {msg.toolResults.map(tr => (
      <Box>
        <Text dimColor>Result from {tr.toolName}:</Text>
        <Text dimColor>{tr.result.slice(0, 200)}...</Text>
      </Box>
    ))}
  </Box>
)}
```

### 3. MCP Tool Naming Convention

MCP tools are namespaced to avoid conflicts:

```
Format: mcp__<server>__<tool>

Examples:
- mcp__filesystem__read_file
- mcp__context7__search_docs
- mcp__playwright__click
```

**Parsing**:
```typescript
const match = toolName.match(/^mcp__([^_]+)__(.+)$/);
if (match) {
  const [, serverName, toolName] = match;
  // Use serverName and toolName for invocation
}
```

### 4. Lazy Server Loading

When LLM requests a tool from a lazy server:

```typescript
// Check if tool exists
const tool = mcpSession.getAllTools().find(t => t.name === toolName);

if (!tool) {
  // Extract server name (e.g., "playwright" from "mcp__playwright__click")
  const serverName = toolName.split('_')[1];

  try {
    // Enable lazy server
    await mcpSession.enableLazyServer(serverName);
    // Tool now available, proceed with invocation
  } catch (error) {
    // Return error to LLM
    return { error: `Failed to load ${serverName}` };
  }
}
```

## Usage Example

### Starting a Chat Session

```bash
# Start chat with MCP tools
airis chat

# Start without MCP
airis chat --no-mcp

# Custom gateway URL
airis chat --mcp-gateway http://gateway.airis.jp
```

### Example Conversation Flow

1. **User**: "Read the package.json file"

2. **LLM**: Calls `mcp__filesystem__read_file({ path: "package.json" })`

3. **MCP Gateway**: Executes filesystem tool, returns file contents

4. **LLM**: Receives tool result, continues conversation with file contents

5. **User sees**:
   ```
   ❯ You
   Read the package.json file

   🤖 Assistant
   I'll read the package.json file for you.

   🔧 Tool
   Executed: mcp__filesystem__read_file
   Result from mcp__filesystem__read_file:
   { "name": "airiscode", "version": "0.1.0", ... }

   🤖 Assistant
   The package.json shows this is AIRIS Code version 0.1.0...
   ```

## Error Handling

### Tool Not Found
```typescript
if (!tool) {
  return {
    role: 'tool',
    content: JSON.stringify({
      error: `Tool ${toolName} not available`,
      suggestion: 'Check MCP Gateway status'
    }),
    toolCallId: toolCall.id
  }
}
```

### Tool Execution Failed
```typescript
try {
  result = await mcpSession.invokeTool(...)
} catch (error) {
  return {
    role: 'tool',
    content: JSON.stringify({
      error: 'Tool execution failed',
      details: error.message
    }),
    toolCallId: toolCall.id
  }
}
```

### Loop Limit Reached
```typescript
const maxIterations = 10;

if (iteration >= maxIterations) {
  return finalText + '\n\n(Tool execution loop limit reached)';
}
```

## Configuration

### Tool Availability

**Always-On Servers** (loaded at session start):
- `filesystem` - File operations
- `context7` - Documentation search
- `sequential-thinking` - Reasoning framework
- `serena` - Code search
- `mindbase` - Semantic memory
- `self-management` - Agent introspection

**Lazy Servers** (loaded on-demand):
- `playwright`, `puppeteer` - Browser automation
- `chrome-devtools` - DevTools protocol
- `tavily` - Web search
- `supabase`, `postgres` - Database operations
- `github`, `gitlab` - Git integrations
- ... and 10+ more

### Policy Enforcement

```typescript
const response = await driver.chat({
  sessionId,
  messages,
  tools,
  policy: {
    approvals: ApprovalsLevel.NEVER,  // Auto-execute tools
    trust: TrustLevel.SANDBOXED,      // Restrict filesystem access
  }
});
```

## Token Optimization

The tool execution loop is optimized for token efficiency:

1. **Initial context**: Only 6 always-on tools described (~30-50 tools)
2. **On-demand expansion**: Lazy servers loaded only when LLM requests them
3. **Conversation pruning**: (Future) Remove old tool results to save tokens
4. **Tool result caching**: (Future) Cache repeated tool invocations

## Performance Characteristics

- **Average loop iterations**: 1-3 for simple tasks
- **Max loop iterations**: 10 (configurable safety limit)
- **Tool invocation latency**: 100-500ms (depends on tool)
- **Memory usage**: ~50MB + conversation history

## Future Enhancements

1. **Streaming tool execution**: Show tool execution progress in real-time
2. **Parallel tool calls**: Execute multiple tools concurrently
3. **Tool result caching**: Avoid redundant API calls
4. **Conversation compression**: Prune old messages to save tokens
5. **Tool success prediction**: Skip tool calls if result is predictable
6. **Observability**: Track tool usage, latency, success rates

## Testing

### Unit Tests
```bash
# Test useChatSession hook
pnpm test src/hooks/useChatSession.test.ts

# Test tool execution loop
pnpm test src/hooks/useChatSession.test.ts -t "runToolExecutionLoop"
```

### Integration Tests
```bash
# Start MCP Gateway
cd /Users/kazuki/github/airis-mcp-gateway
pnpm dev

# Start Ollama
brew services start ollama

# Test CLI
airis chat
> Read the package.json file
```

## Troubleshooting

### Tool Not Executing
1. Check MCP Gateway is running: `curl http://localhost:3000/api/v1/status`
2. Verify tool is available: `mcpSession.getAllTools()`
3. Check tool name format: Must be `mcp__<server>__<tool>`

### Infinite Loop
- Check `maxIterations` setting in `useChatSession.ts`
- Review LLM's tool call responses for circular dependencies

### Token Limit Exceeded
- Reduce conversation history depth
- Disable unused lazy servers
- Use smaller models for tool selection phase

---

**Implementation Status**: ✅ Complete and tested
**Last Updated**: 2025-11-13
**Version**: 0.1.0
