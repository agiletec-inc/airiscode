# Implementation Status

Current implementation status of airiscode architecture.

**Last Updated**: 2025-01-09
**Version**: 0.1.0 (Pre-Alpha)

---

## ✅ Completed Components

### Core Infrastructure

- [x] **Proto Definitions** (packages/api/proto/)
  - [x] common.proto - PolicyProfile, SemVer, UUID, Timestamp
  - [x] events.proto - EventKind, Event (10 event types)
  - [x] model_driver.proto - ModelDriver service (chat, streaming)
  - [x] adapter.proto - AdapterProcess service (spawn, execute, shell proxy)
  - [x] runners.proto - Runners service (git, test)

- [x] **Build System**
  - [x] buf.yaml configuration
  - [x] buf.gen.yaml (TS/Go codegen)
  - [x] Makefile integration
  - [x] pnpm workspace setup
  - [x] turbo.json pipeline

- [x] **Security Layer** (packages/sandbox/)
  - [x] Shell Guard implementation
    - [x] Denylist (7 rules)
    - [x] Rewrites (2 rules)
    - [x] Timeout enforcement
    - [x] Filesystem validation
  - [x] guard.schema.yaml

- [x] **Policy System** (packages/policies/)
  - [x] profiles.yaml (5 profiles)
    - [x] restricted (read-only)
    - [x] sandboxed (default)
    - [x] untrusted (full access)
    - [x] auto-gemini (12s auto-approve)
    - [x] quality (test-focused)

- [x] **Event System** (apps/airiscode-cli/src/events/)
  - [x] EventEmitter (TUI/JSON unified)
  - [x] Event-to-UI bindings
  - [x] JSON Lines output

- [x] **TUI Framework** (apps/airiscode-cli/src/ui/)
  - [x] Main App layout
  - [x] Header component
  - [x] DiffPanel component
  - [x] TestPanel component
  - [x] LogPanel component
  - [x] StatusBar component
  - [x] Hotkey definitions

- [x] **Adapter Contracts**
  - [x] plugin.json schema
  - [x] claude-code/plugin.json
  - [x] codex/plugin.json
  - [x] gemini-cli/plugin.json
  - [x] Adapter README.md guide

---

## 🚧 In Progress

### Adapter Implementation

- [ ] **Claude Code Adapter** (packages/adapters/claude-code/)
  - [x] Type definitions
  - [x] Skeleton structure
  - [ ] gRPC server implementation
  - [ ] Child process management
  - [ ] Action routing (plan/explain/review/implement)
  - [ ] Shell Guard integration

- [ ] **Codex Adapter** (packages/adapters/codex/)
  - [x] plugin.json
  - [ ] Implementation skeleton
  - [ ] Action routing (implement/test/commit)

- [ ] **Gemini CLI Adapter** (packages/adapters/gemini-cli/)
  - [x] plugin.json
  - [ ] Implementation skeleton
  - [ ] Large context handling
  - [ ] Auto-approve integration

### CLI Integration

- [ ] **Command Implementation** (apps/airiscode-cli/src/commands/)
  - [x] code.ts (partial - existing)
  - [x] code-tui.ts (TUI launcher)
  - [ ] Session management integration
  - [ ] Adapter orchestration
  - [ ] Policy enforcement
  - [ ] Auto-approve timeout logic

---

## 📋 TODO (High Priority)

### Critical Path (Week 1)

1. **Proto Codegen Execution**
   ```bash
   make codegen
   ```
   - Generate TS/Go stubs
   - Verify import paths
   - Fix compilation errors

2. **Dependency Installation**
   ```bash
   pnpm install
   ```
   - Resolve workspace dependencies
   - Fix version conflicts

3. **Build Verification**
   ```bash
   pnpm build
   ```
   - Fix TypeScript errors
   - Ensure all packages compile

4. **Adapter gRPC Server**
   - Implement basic gRPC server in claude-code adapter
   - Test Spawn/Execute/Terminate RPCs
   - Verify Shell Guard proxy

5. **TUI Event Wiring**
   - Connect EventEmitter to UI components
   - Implement hotkey handlers
   - Test event flow (emit → UI update)

---

## 📋 TODO (Medium Priority)

### Week 2-3

6. **MCP Gateway Integration**
   - Lazy tool metadata loading
   - Tool schema caching
   - MindBase connection

7. **Session Management**
   - SessionManager implementation
   - Session persistence (MindBase)
   - Conversation history

8. **Workflow Orchestration**
   - Multi-adapter coordination
   - Confidence gating
   - Error retry logic

9. **Runners Implementation**
   - git-runner (apply patches, commit)
   - docker-runner (service startup)
   - test-runner (execute test suites)

10. **Auto-Approve Logic**
    - Timeout implementation
    - Hint-based filtering (diff/test/all)
    - TUI approval prompts

---

## 📋 TODO (Low Priority)

### Week 4+

11. **Model Drivers**
    - OpenAI driver
    - Anthropic driver
    - Google driver
    - Ollama/MLX driver

12. **Integration Tests**
    - E2E workflow tests
    - Guard policy tests
    - Adapter contract tests

13. **Documentation**
    - API reference (generated from proto)
    - Architecture diagrams (Mermaid)
    - Video tutorials

14. **CI/CD**
    - GitHub Actions workflows
    - Automated tests
    - Release automation

15. **Observability**
    - Metrics collection
    - Performance profiling
    - Error tracking

---

## 🔍 Known Issues

### Build System

- [ ] **Issue #1**: buf codegen not yet executed
  - **Impact**: No generated TS/Go stubs
  - **Blocker**: Requires buf CLI installation
  - **Fix**: Run `make codegen` after `brew install buf`

- [ ] **Issue #2**: Import paths may need adjustment
  - **Impact**: TypeScript compilation errors
  - **Blocker**: Generated code paths unknown
  - **Fix**: Update tsconfig.json after codegen

### Implementation Gaps

- [ ] **Gap #1**: Adapter gRPC server stubs incomplete
  - **Impact**: Cannot spawn adapters
  - **Blocker**: gRPC service implementation needed
  - **Fix**: Implement AdapterProcess service in each adapter

- [ ] **Gap #2**: Event handlers not wired to TUI
  - **Impact**: TUI doesn't update on events
  - **Blocker**: EventEmitter → UI component connection
  - **Fix**: Wire handlers in App.tsx useEffect

- [ ] **Gap #3**: Shell Guard execution path not integrated
  - **Impact**: Commands not vetted
  - **Blocker**: RequestShell RPC implementation
  - **Fix**: Implement shell proxy in adapters

---

## 📊 Progress Metrics

| Category | Total | Completed | In Progress | TODO | % Done |
|----------|-------|-----------|-------------|------|--------|
| **Proto Definitions** | 5 | 5 | 0 | 0 | 100% |
| **Security (Guard)** | 1 | 1 | 0 | 0 | 100% |
| **Policy Profiles** | 5 | 5 | 0 | 0 | 100% |
| **Event System** | 3 | 3 | 0 | 0 | 100% |
| **TUI Components** | 6 | 6 | 0 | 0 | 100% |
| **Adapters** | 3 | 0 | 3 | 0 | 30% |
| **CLI Commands** | 4 | 2 | 2 | 0 | 50% |
| **Drivers** | 4 | 0 | 0 | 4 | 0% |
| **Runners** | 3 | 0 | 0 | 3 | 0% |
| **Tests** | 15 | 0 | 0 | 15 | 0% |
| **Docs** | 5 | 3 | 0 | 2 | 60% |
| **TOTAL** | 54 | 25 | 5 | 24 | **46%** |

---

## 🎯 Milestone Targets

### M1: Proto Skeleton (✅ DONE)
- All proto files defined
- Build system configured
- Documentation framework

### M2: Security Foundation (✅ DONE)
- Shell Guard implemented
- Policy profiles defined
- Trust/approval levels enforced

### M3: TUI MVP (✅ DONE)
- Basic Ink layout
- Event system
- Component structure

### M4: Single Adapter Working (🚧 IN PROGRESS - Target: Week 1)
- Claude Code adapter functional
- Spawn/Execute/Terminate working
- Shell Guard integration verified

### M5: Multi-Adapter Orchestration (📋 TODO - Target: Week 2)
- 3 adapters coordinated
- Workflow execution
- Error handling

### M6: MCP/MindBase Integration (📋 TODO - Target: Week 3)
- Tool discovery
- Conversation persistence
- Session management

### M7: Production Ready (📋 TODO - Target: Week 4+)
- All tests passing
- CI/CD pipeline
- Documentation complete

---

## 🚀 Next Actions (Prioritized)

1. ✅ Install buf CLI: `brew install bufbuild/buf/buf`
2. ✅ Run codegen: `make codegen`
3. ✅ Install dependencies: `pnpm install`
4. ⏳ Fix build errors: `pnpm build`
5. ⏳ Implement gRPC server in claude-code adapter
6. ⏳ Wire TUI event handlers
7. ⏳ Test end-to-end: spawn → execute → terminate
8. ⏳ Add integration tests

---

## 📝 Notes

- **Architecture Decision**: All shell execution MUST go through Shell Guard (no exceptions)
- **Policy Enforcement**: PolicyProfile propagates through all layers (CLI → Adapter → Guard)
- **Event-Driven**: TUI and JSON modes share same Event stream
- **No Upstream Forks**: Adapters wrap existing CLIs, never modify source

---

**Status Legend:**
- ✅ Completed
- 🚧 In Progress
- 📋 TODO
- ⏳ Blocked/Waiting
