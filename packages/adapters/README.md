# Adapters

Child process wrappers for CLI coding assistants (Claude Code, Codex, Gemini CLI, Aider).

## Design Principles

1. **No reimplementation** - Wrap existing CLIs as child processes; never fork upstream code
2. **Shell Guard proxy** - All shell execution flows through Guard for safety
3. **Strengths-based routing** - Each adapter is invoked for its core competencies:
   - **Claude Code**: Understanding, explanation, impact analysis
   - **Codex**: Implementation, testing, quality control
   - **Gemini CLI**: Large context mapping, autonomous execution

## Adapter Contract

Each adapter MUST implement the `AdapterProcess` gRPC service (see `packages/api/proto/airiscode/v1/adapter.proto`):

```protobuf
service AdapterProcess {
  rpc Spawn(SpawnAdapterRequest) returns (SpawnAdapterResponse);
  rpc Execute(ExecuteRequest) returns (ExecuteResponse);
  rpc StreamLogs(StreamLogsRequest) returns (stream LogChunk);
  rpc RequestShell(ShellRequest) returns (ShellReply);
  rpc Terminate(SpawnAdapterResponse) returns (google.protobuf.Empty);
}
```

### Actions by Adapter

| Action | Claude Code | Codex | Gemini CLI | Description |
|--------|-------------|-------|------------|-------------|
| `plan` | ✅ | ❌ | ✅ | Generate implementation plan |
| `explain` | ✅ | ❌ | ❌ | Explain code / design rationale |
| `review` | ✅ | ❌ | ❌ | Code review / impact analysis |
| `implement` | ✅ | ✅ | ❌ | Generate code changes |
| `test` | ❌ | ✅ | ❌ | Run tests / verify changes |
| `commit` | ❌ | ✅ | ❌ | Create git commit |
| `read` | ❌ | ❌ | ✅ | Read/index large codebase |
| `map` | ❌ | ❌ | ✅ | Map project structure |
| `auto` | ❌ | ❌ | ✅ | Autonomous execution mode |

## Plugin Manifest Schema

Each adapter directory contains a `plugin.json`:

```json
{
  "name": "adapter-name",
  "version": "0.1.0",
  "kind": "adapter",
  "description": "Short description",
  "entry": "bin/adapter-script",
  "capabilities": {
    "actions": ["action1", "action2"],
    "streamLogs": true,
    "strengths": ["strength1", "strength2"]
  },
  "policy": {
    "requiresShellProxy": true,
    "defaultTrust": "sandboxed",
    "recommendedApprovals": "on-failure",
    "supportsAutoApprove": false
  },
  "dependencies": {
    "cli": "upstream-cli-name",
    "minVersion": "0.1.0"
  }
}
```

## Implementation Template

See `packages/adapters/claude-code/bin/claude-adapter` for reference implementation.

### Minimal Adapter Stub

```typescript
#!/usr/bin/env node
import { AdapterProcess } from '@airiscode/api/gen/ts/airiscode/v1/adapter';
import { spawn } from 'child_process';

class ClaudeAdapter implements AdapterProcess {
  async Spawn(req: SpawnAdapterRequest): Promise<SpawnAdapterResponse> {
    // Launch claude-code CLI as child process
    const child = spawn('claude-code', ['--json'], { env: req.env });
    return { adapter_pid: generateUUID(), api_version: { major: 0, minor: 1, patch: 0 } };
  }

  async Execute(req: ExecuteRequest): Promise<ExecuteResponse> {
    // Route to claude-code action (plan/explain/review/implement)
    const result = await this.invokeUpstream(req.action, req.input_json);
    return { output_json: result, proposed_shell: [] };
  }

  async RequestShell(req: ShellRequest): Promise<ShellReply> {
    // ALWAYS proxy through Shell Guard - never execute directly
    const guard = await getGuard();
    const verdict = guard.evaluate(req.command, this.trustLevel);
    if (!verdict.allowed) {
      return { allowed: false, exit_code: 1, merged_log: verdict.reason };
    }
    // Execute rewritten command with timeout
    const { exitCode, log } = await this.runCommand(verdict.rewritten_command || req.command);
    return { allowed: true, exit_code: exitCode, merged_log: log };
  }
}
```

## Testing Adapters

```bash
# Unit tests (mock upstream CLI)
pnpm turbo run test -- --filter @airiscode/adapter-claude-code

# Integration tests (requires upstream CLI installed)
INTEGRATION=1 pnpm test -- --filter @airiscode/adapter-claude-code

# Manual invocation via airiscode CLI
airis code "task" --adapters=claude-code --dry-run
```

## Security Invariants

1. **Shell Guard is mandatory** - All `RequestShell` calls MUST flow through Guard
2. **No direct FS writes** - Use workspace-relative paths only
3. **Policy respect** - Honor `approvals` and `trust` levels from `PolicyProfile`
4. **Timeout enforcement** - Apply Guard-derived timeouts to all subprocess calls

## Adding a New Adapter

1. Create directory: `packages/adapters/my-adapter/`
2. Add `plugin.json` manifest
3. Implement `bin/my-adapter` script (Node/Deno/Bun/Python/etc.)
4. Implement gRPC `AdapterProcess` service
5. Register in `apps/airiscode-cli/src/adapters/registry.ts`
6. Add integration tests

## References

- gRPC proto: `packages/api/proto/airiscode/v1/adapter.proto`
- Shell Guard: `packages/sandbox/shell-guard.ts`
- Policy profiles: `packages/policies/schemas/profiles.yaml`
