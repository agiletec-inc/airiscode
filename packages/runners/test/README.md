# @airiscode/runners-test

Test execution runner for AIRIS Code.

## Features

- **Multi-Framework Support**: Vitest, Jest, Mocha, AVA, pytest, Go test, Cargo test
- **Auto-Detection**: Automatically detects test framework from project
- **Coverage Collection**: Built-in support for coverage reporting
- **Watch Mode**: Support for watch mode across frameworks
- **Result Parsing**: Normalized test results across frameworks
- **Type-Safe Results**: All operations return `Result<TestRunResult, TestRunnerError>`

## Installation

```bash
pnpm add @airiscode/runners-test
```

## Usage

### Basic Test Execution

```typescript
import { TestRunner } from '@airiscode/runners-test';

const runner = new TestRunner('/path/to/project');

// Auto-detect framework and run tests
const result = await runner.run();

if (result.ok) {
  const { summary, success } = result.value;
  console.log(`Tests: ${summary.total}`);
  console.log(`Passed: ${summary.passed}`);
  console.log(`Failed: ${summary.failed}`);
  console.log(`Success: ${success}`);
}
```

### Specific Framework

```typescript
import { TestRunner, TestFramework } from '@airiscode/runners-test';

const runner = new TestRunner('/path/to/project');

// Run with specific framework
const result = await runner.run({
  framework: TestFramework.VITEST,
});
```

### With Coverage

```typescript
const result = await runner.run({
  coverage: true,
});

if (result.ok && result.value.coverage) {
  const { lines, statements, functions, branches } = result.value.coverage;
  console.log(`Lines: ${lines.percent}%`);
  console.log(`Statements: ${statements.percent}%`);
  console.log(`Functions: ${functions.percent}%`);
  console.log(`Branches: ${branches.percent}%`);
}
```

### Advanced Options

```typescript
const result = await runner.run({
  framework: TestFramework.JEST,
  files: ['src/**/*.test.ts'],
  watch: false,
  coverage: true,
  verbose: true,
  bail: true, // Stop on first failure
  grep: 'integration', // Run only tests matching pattern
  timeout: 10000, // 10 second timeout
  env: {
    NODE_ENV: 'test',
    CI: 'true',
  },
});
```

### Framework-Specific Examples

#### Vitest

```typescript
await runner.run({
  framework: TestFramework.VITEST,
  files: ['src/**/*.spec.ts'],
  coverage: true,
  verbose: true,
});
```

#### Jest

```typescript
await runner.run({
  framework: TestFramework.JEST,
  files: ['__tests__/**/*.test.js'],
  coverage: true,
  bail: true,
});
```

#### Mocha

```typescript
await runner.run({
  framework: TestFramework.MOCHA,
  files: ['test/**/*.test.js'],
  grep: 'should pass',
  timeout: 5000,
});
```

#### pytest (Python)

```typescript
await runner.run({
  framework: TestFramework.PYTEST,
  files: ['tests/'],
  coverage: true,
  verbose: true,
  grep: 'integration',
});
```

#### Go Test

```typescript
await runner.run({
  framework: TestFramework.GO_TEST,
  coverage: true,
  verbose: true,
  grep: 'TestIntegration',
});
```

#### Cargo Test (Rust)

```typescript
await runner.run({
  framework: TestFramework.CARGO_TEST,
  verbose: true,
  grep: 'integration',
});
```

### Error Handling

```typescript
const result = await runner.run();

if (!result.ok) {
  console.error('Test execution failed:', result.error.message);
  if (result.error.framework) {
    console.error('Framework:', result.error.framework);
  }
  if (result.error.cause) {
    console.error('Cause:', result.error.cause);
  }
}
```

## API Reference

### TestRunner

#### Constructor

```typescript
new TestRunner(workingDir: string)
```

#### Methods

- `run(options?: TestRunOptions): Promise<TestRunResultType>` - Run tests

### TestRunOptions

```typescript
interface TestRunOptions {
  framework?: TestFramework;       // Test framework to use
  files?: string[];                // Test files or patterns
  watch?: boolean;                 // Watch mode
  coverage?: boolean;              // Coverage collection
  verbose?: boolean;               // Verbose output
  bail?: boolean;                  // Bail on first failure
  grep?: string;                   // Run only tests matching pattern
  timeout?: number;                // Timeout in milliseconds
  env?: Record<string, string>;    // Environment variables
}
```

### TestRunResult

```typescript
interface TestRunResult {
  framework: TestFramework;
  suites: TestSuiteResult[];
  summary: {
    total: number;
    passed: number;
    failed: number;
    skipped: number;
    duration: number;
  };
  coverage?: CoverageReport;
  exitCode: number;
  success: boolean;
}
```

### TestFramework

```typescript
enum TestFramework {
  VITEST = 'vitest',
  JEST = 'jest',
  MOCHA = 'mocha',
  AVA = 'ava',
  PYTEST = 'pytest',
  GO_TEST = 'go_test',
  CARGO_TEST = 'cargo_test',
}
```

### CoverageReport

```typescript
interface CoverageReport {
  lines: {
    total: number;
    covered: number;
    percent: number;
  };
  statements: {
    total: number;
    covered: number;
    percent: number;
  };
  functions: {
    total: number;
    covered: number;
    percent: number;
  };
  branches: {
    total: number;
    covered: number;
    percent: number;
  };
  files?: Array<{
    path: string;
    lines: number;
    statements: number;
    functions: number;
    branches: number;
  }>;
}
```

## Framework Detection

The test runner automatically detects the test framework based on:

1. **JavaScript/TypeScript**: Checks `package.json` for dependencies (vitest, jest, mocha, ava)
2. **Python**: Looks for `pytest.ini` or `pyproject.toml`
3. **Go**: Looks for `go.mod`
4. **Rust**: Looks for `Cargo.toml`

You can override auto-detection by explicitly specifying the `framework` option.

## Coverage Support

Coverage collection is supported for:

- **Vitest**: `--coverage`
- **Jest**: `--coverage`
- **pytest**: `--cov`
- **Go**: `-cover`

The coverage report is normalized across frameworks to provide a consistent interface.

## License

MIT
