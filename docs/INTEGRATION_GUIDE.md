# Integration Guide - Merging New and Existing Implementations

This guide explains how to integrate the newly created implementation skeletons with the existing codebase.

**Context**: The implementation created proto definitions, event system, TUI components, and adapter contracts. Some packages already have partial implementations that need to be merged.

---

## 🔄 Integration Strategy

### Principle: Merge, Don't Replace

The existing codebase has foundational implementations. The new additions provide:
1. **Proto contracts** - gRPC service definitions
2. **Event system** - TUI/JSON unified output
3. **TUI components** - Ink-based UI
4. **Policy schemas** - YAML-based configuration

**Strategy**: Keep existing implementations as the base, integrate new additions as enhancements.

---

## 📦 Package-by-Package Integration

### 1. packages/sandbox

**Existing**: `shell-guard.ts` with `GuardResult` interface
**New**: `shell-guard.ts` with `GuardVerdict` interface + `guard.schema.yaml`

**Integration Plan**:
```typescript
// Option A: Extend existing ShellGuard
// packages/sandbox/src/shell-guard.ts

import * as yaml from 'yaml';
import { GuardConfig } from './types.js';

export class ShellGuard {
  private config: GuardConfig;

  constructor(private policy: PolicyProfile) {
    // Load YAML config
    this.config = this.loadConfig();
  }

  private async loadConfig(): Promise<GuardConfig> {
    const yamlPath = path.join(__dirname, '../schemas/guard.schema.yaml');
    const content = await fs.readFile(yamlPath, 'utf-8');
    return yaml.parse(content);
  }

  evaluate(command: string, trustLevel: TrustLevel): GuardResult {
    // 1. Check denylist from YAML
    for (const rule of this.config.denylist) {
      if (new RegExp(rule.pattern).test(command)) {
        return {
          allowed: false,
          reason: rule.reason,
          severity: 'critical',
        };
      }
    }

    // 2. Apply rewrites from YAML
    let rewritten = command;
    for (const rewrite of this.config.rewrites) {
      if (rewrite.when_trust === trustLevel || !rewrite.when_trust) {
        rewritten = command.replace(new RegExp(rewrite.from), rewrite.to);
        if (rewritten !== command) break;
      }
    }

    return {
      allowed: true,
      rewritten: rewritten !== command ? rewritten : undefined,
    };
  }
}
```

**Action**: Add YAML loading to existing `ShellGuard` class.

---

### 2. packages/policies

**Existing**: TypeScript-based policy definitions
**New**: `guard.schema.yaml` + `profiles.yaml`

**Integration Plan**:
```typescript
// packages/policies/src/profiles.ts

import * as yaml from 'yaml';
import * as fs from 'fs/promises';
import * as path from 'path';

export interface PolicyProfile {
  approvals: ApprovalsLevel;
  trust: TrustLevel;
  guard_strict: boolean;
  auto_approve_timeout_ms: number;
  auto_approve_hint: string;
  description: string;
}

export async function loadProfile(name: string): Promise<PolicyProfile> {
  const yamlPath = path.join(__dirname, '../schemas/profiles.yaml');
  const content = await fs.readFile(yamlPath, 'utf-8');
  const config = yaml.parse(content);
  return config.profiles[name];
}

// Usage:
const profile = await loadProfile('auto-gemini');
// { approvals: 'on-request', trust: 'sandboxed', auto_approve_timeout_ms: 12000, ... }
```

**Action**: Add YAML profile loader to `@airiscode/policies`.

---

### 3. apps/airiscode-cli

**Existing**: `src/commands/code.ts` with session management
**New**: `src/ui/App.tsx` (TUI), `src/events/emitter.ts` (Event system)

**Integration Plan**:

#### Step 1: Wire EventEmitter to existing commands

```typescript
// apps/airiscode-cli/src/commands/code.ts

import { EventEmitter } from '../events/emitter.js';
import { renderTUI } from './code-tui.js';

async function executeCodeCommand(task: string, options: CodeCommandOptions): Promise<void> {
  const sessionId = uuidv4();

  if (options.json) {
    // JSON Lines mode
    const emitter = new EventEmitter('json');
    await executeWithEmitter(task, options, emitter);
  } else {
    // TUI mode
    await renderTUI({ sessionId, task });
  }
}

async function executeWithEmitter(
  task: string,
  options: CodeCommandOptions,
  emitter: EventEmitter
): Promise<void> {
  // Emit session start
  emitter.emit(EventEmitter.createEvent(
    EventKind.EVENT_SESSION_START,
    sessionId,
    'cli',
    `Task: ${task}`
  ));

  // ... existing session logic ...

  // Emit events at key points:
  // - EVENT_ADAPTER_SPAWN when spawning adapter
  // - EVENT_TOOL_CALL when calling MCP tools
  // - EVENT_DIFF_READY when changes are ready
  // - EVENT_TEST_RESULT when tests complete
  // - EVENT_COMMIT when committing
}
```

#### Step 2: Connect TUI to session events

```typescript
// apps/airiscode-cli/src/ui/App.tsx

export const App: React.FC<AppProps> = ({ sessionId, task, emitter }) => {
  const [phase, setPhase] = useState('initializing');

  useEffect(() => {
    // Subscribe to session events
    const handlers: EventHandler = {
      onInfo: (summary) => {
        setLogs((prev) => [...prev, summary]);
      },
      onDiffReady: (data) => {
        setDiffData(data);
        setPhase('diff-ready');
      },
      onTestResult: (data) => {
        setTestData(data);
        setPhase('test-complete');
      },
      // ... other handlers
    };

    // Wire handlers to emitter (implementation depends on emitter design)
    // Option: emitter.subscribe(handlers)
  }, [emitter]);

  // ... rest of component
};
```

**Action**: Integrate EventEmitter into existing `SessionManager` workflow.

---

### 4. packages/adapters/claude-code

**Existing**: Partial implementation with `ClaudeCodeAdapter` class
**New**: `bin/claude-adapter` script + proto contract definitions

**Integration Plan**:

#### Step 1: Implement gRPC server wrapper

```typescript
// packages/adapters/claude-code/src/grpc-server.ts

import { Server, ServerCredentials } from '@grpc/grpc-js';
import { ClaudeCodeAdapter } from './claude-code-adapter.js';

export class AdapterGrpcServer {
  private server: Server;
  private adapter: ClaudeCodeAdapter;

  constructor() {
    this.server = new Server();
    this.adapter = new ClaudeCodeAdapter();

    // Register AdapterProcess service
    this.server.addService(AdapterProcessService, {
      Spawn: this.adapter.spawn.bind(this.adapter),
      Execute: this.adapter.execute.bind(this.adapter),
      RequestShell: this.adapter.requestShell.bind(this.adapter),
      Terminate: this.adapter.terminate.bind(this.adapter),
    });
  }

  async start(port: number = 50051): Promise<void> {
    this.server.bindAsync(
      `0.0.0.0:${port}`,
      ServerCredentials.createInsecure(),
      (err, boundPort) => {
        if (err) throw err;
        console.log(`[claude-adapter] gRPC server listening on port ${boundPort}`);
        this.server.start();
      }
    );
  }
}
```

#### Step 2: Update bin/claude-adapter

```typescript
#!/usr/bin/env node
import { AdapterGrpcServer } from '../dist/grpc-server.js';

const server = new AdapterGrpcServer();
server.start().catch((err) => {
  console.error('[claude-adapter] Fatal error:', err);
  process.exit(1);
});
```

**Action**: Add gRPC server wrapper to existing adapter implementation.

---

## 🔧 Dependency Resolution

### New Dependencies to Add

```bash
# Root package.json
pnpm add -Dw @grpc/grpc-js @grpc/proto-loader

# packages/sandbox
pnpm add --filter @airiscode/sandbox yaml

# packages/policies
pnpm add --filter @airiscode/policies yaml

# apps/airiscode-cli
pnpm add --filter @airiscode/cli ink ink-spinner ink-text-input react uuid
```

### TypeScript Configuration

Ensure all packages reference proto-generated types:

```json
// packages/adapters/claude-code/tsconfig.json
{
  "extends": "../../tsconfig.base.json",
  "references": [
    { "path": "../../packages/api" },
    { "path": "../../packages/policies" },
    { "path": "../../packages/sandbox" }
  ]
}
```

---

## ✅ Integration Checklist

### Phase 1: Proto & Build System
- [x] Proto definitions created
- [x] buf.gen.yaml configured
- [ ] Run `make codegen` to generate stubs
- [ ] Fix import paths in generated code
- [ ] Verify TypeScript compilation

### Phase 2: Shell Guard Enhancement
- [ ] Add YAML loading to existing `ShellGuard`
- [ ] Test denylist rules from `guard.schema.yaml`
- [ ] Test rewrites from `guard.schema.yaml`
- [ ] Add unit tests for YAML-based rules

### Phase 3: Policy Profiles
- [ ] Add `loadProfile()` function to `@airiscode/policies`
- [ ] Integrate with existing policy system
- [ ] Test all 5 profiles (restricted/sandboxed/untrusted/auto-gemini/quality)

### Phase 4: Event System
- [ ] Wire `EventEmitter` into `SessionManager`
- [ ] Emit events at key workflow points
- [ ] Test JSON Lines output mode
- [ ] Test TUI event updates

### Phase 5: TUI Integration
- [ ] Connect `App.tsx` to existing `code` command
- [ ] Implement hotkey handlers
- [ ] Test TUI rendering
- [ ] Test event → UI update flow

### Phase 6: Adapter gRPC Server
- [ ] Implement `AdapterGrpcServer` wrapper
- [ ] Test Spawn/Execute/Terminate RPCs
- [ ] Verify Shell Guard proxy in `RequestShell`
- [ ] Add integration tests

---

## 🚀 Recommended Execution Order

1. **Generate Proto Stubs** (Unblocks all other work)
   ```bash
   make codegen
   pnpm build  # Fix any TypeScript errors
   ```

2. **Enhance Shell Guard** (Critical security layer)
   ```bash
   # Add YAML loading to packages/sandbox/src/shell-guard.ts
   pnpm --filter @airiscode/sandbox test
   ```

3. **Integrate Event System** (Enables TUI/JSON modes)
   ```bash
   # Wire EventEmitter into apps/airiscode-cli/src/commands/code.ts
   # Test JSON output: ./bin/airis code "test" --json
   ```

4. **Launch TUI** (User-facing milestone)
   ```bash
   # Connect App.tsx to code command
   # Test: ./bin/airis code "test"
   ```

5. **Implement Adapter gRPC** (Enables adapter orchestration)
   ```bash
   # Add gRPC server to packages/adapters/claude-code/
   # Test: spawn adapter, execute action, verify shell proxy
   ```

---

## 📝 Migration Notes

### Breaking Changes to Avoid

1. **Do NOT replace existing `ShellGuard` interface**
   - Keep `GuardResult` return type
   - Add YAML config loading as enhancement

2. **Do NOT replace existing `SessionManager`**
   - Integrate `EventEmitter` as addition
   - Existing session logic stays intact

3. **Do NOT replace existing CLI commands**
   - Add TUI/JSON modes as options
   - Keep existing ora-based spinner for backward compat

### Safe Integration Points

- ✅ Add YAML-based configuration (non-breaking)
- ✅ Add EventEmitter alongside existing logging
- ✅ Add TUI as optional `--tui` flag (default to existing CLI)
- ✅ Add proto-based types as alternatives (not replacements)

---

## 🎯 Success Criteria

Integration is complete when:

1. ✅ `make codegen` generates TS/Go stubs without errors
2. ✅ `pnpm build` compiles all packages successfully
3. ✅ `pnpm test` passes all existing tests
4. ✅ `./bin/airis code "test" --json` outputs structured events
5. ✅ `./bin/airis code "test"` launches TUI (Ink-based)
6. ✅ Shell Guard blocks dangerous commands from YAML denylist
7. ✅ Adapter spawns and executes actions via gRPC

---

## 📚 Reference Documentation

- **Proto Contracts**: `packages/api/proto/airiscode/v1/`
- **Shell Guard Schema**: `packages/policies/schemas/guard.schema.yaml`
- **Policy Profiles**: `packages/policies/schemas/profiles.yaml`
- **TUI Components**: `apps/airiscode-cli/src/ui/`
- **Event System**: `apps/airiscode-cli/src/events/`

---

**Status**: Ready for integration phase. Start with `make codegen` and proceed through checklist.
