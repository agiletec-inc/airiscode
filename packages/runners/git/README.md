# @airiscode/runners-git

Git operations runner for AIRIS Code.

## Features

- **Status & Diff**: Get repository status and diffs
- **Commit Operations**: Add files, create commits with options
- **Remote Operations**: Push and pull with various options
- **Branch Management**: List, create, and checkout branches
- **Patch Application**: Apply patches with validation
- **History**: Get commit logs
- **Stashing**: Stash and pop changes
- **Reset**: Reset changes with different modes
- **Type-Safe Results**: All operations return `Result<T, GitRunnerError>`

## Installation

```bash
pnpm add @airiscode/runners-git
```

## Usage

### Basic Operations

```typescript
import { GitRunner } from '@airiscode/runners-git';

const runner = new GitRunner('/path/to/repo');

// Get status
const statusResult = await runner.status();
if (statusResult.ok) {
  console.log('Current branch:', statusResult.value.current);
  console.log('Modified files:', statusResult.value.modified);
  console.log('Is clean:', statusResult.value.isClean);
}

// Get diff
const diffResult = await runner.diff({ staged: true });
if (diffResult.ok) {
  console.log('Staged changes:', diffResult.value);
}

// Add files
await runner.add(['file1.ts', 'file2.ts']);

// Commit
const commitResult = await runner.commit({
  message: 'feat: add new feature',
  author: 'John Doe',
  email: 'john@example.com',
});

if (commitResult.ok) {
  console.log('Commit hash:', commitResult.value.commit);
  console.log('Changes:', commitResult.value.summary.changes);
}
```

### Branch Operations

```typescript
// List branches
const branchesResult = await runner.listBranches();
if (branchesResult.ok) {
  branchesResult.value.forEach((branch) => {
    console.log(`${branch.current ? '*' : ' '} ${branch.name}`);
  });
}

// Create and checkout new branch
await runner.createBranch('feature/new-feature', 'main');

// Checkout existing branch
await runner.checkout('develop');
```

### Remote Operations

```typescript
// Push to remote
await runner.push({
  remote: 'origin',
  branch: 'main',
  setUpstream: true,
});

// Force push
await runner.push({
  force: true,
});

// Pull from remote
await runner.pull('origin', 'main');
```

### Patch Operations

```typescript
// Apply patch
const patchResult = await runner.applyPatch({
  patch: patchContent,
  check: true, // Dry run first
});

if (patchResult.ok) {
  // Apply for real
  await runner.applyPatch({
    patch: patchContent,
    whitespace: 'fix',
  });
}
```

### Stashing

```typescript
// Stash changes
await runner.stash('WIP: working on feature');

// Pop stash
await runner.stashPop();
```

### Reset Operations

```typescript
// Soft reset (keep changes staged)
await runner.reset('soft', 'HEAD~1');

// Mixed reset (default, unstage changes)
await runner.reset('mixed', 'HEAD~1');

// Hard reset (discard all changes)
await runner.reset('hard', 'HEAD');
```

### Error Handling

```typescript
const result = await runner.commit({
  message: 'Test commit',
});

if (!result.ok) {
  console.error('Operation:', result.error.operation);
  console.error('Message:', result.error.message);
  if (result.error.cause) {
    console.error('Cause:', result.error.cause);
  }
}
```

## API Reference

### GitRunner

#### Constructor

```typescript
new GitRunner(workingDir: string)
```

#### Methods

- `status(): Promise<GitStatusResult>` - Get repository status
- `diff(options?: GitDiffOptions): Promise<GitDiffResult>` - Get diff
- `add(files: string[]): Promise<Result<void, GitRunnerError>>` - Add files to staging
- `commit(options: GitCommitOptions): Promise<GitCommitResultType>` - Create commit
- `push(options?: GitPushOptions): Promise<GitPushResult>` - Push commits
- `pull(remote?: string, branch?: string): Promise<Result<void, GitRunnerError>>` - Pull changes
- `listBranches(): Promise<GitBranchResult>` - List all branches
- `createBranch(name: string, startPoint?: string): Promise<Result<void, GitRunnerError>>` - Create branch
- `checkout(branch: string): Promise<Result<void, GitRunnerError>>` - Checkout branch
- `log(maxCount?: number): Promise<GitLogResult>` - Get commit log
- `applyPatch(options: GitApplyOptions): Promise<GitApplyResult>` - Apply patch
- `reset(mode?: 'soft' | 'mixed' | 'hard', ref?: string): Promise<Result<void, GitRunnerError>>` - Reset changes
- `stash(message?: string): Promise<Result<void, GitRunnerError>>` - Stash changes
- `stashPop(): Promise<Result<void, GitRunnerError>>` - Pop stash

## Types

See [types.ts](./src/types.ts) for detailed type definitions.

## License

MIT
