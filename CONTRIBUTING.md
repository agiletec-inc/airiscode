# Contributing to airiscode

Thank you for your interest in contributing to airiscode! This document provides guidelines and instructions for contributing.

## Development Setup

### Prerequisites

- Node.js >= 20.0.0
- pnpm >= 8.0.0
- Git

### Getting Started

1. Fork the repository
2. Clone your fork:
   ```bash
   git clone https://github.com/yourusername/airiscode.git
   cd airiscode
   ```

3. Install dependencies:
   ```bash
   pnpm install
   ```

4. Build all packages:
   ```bash
   pnpm build
   ```

5. Run tests:
   ```bash
   pnpm test
   ```

## Project Structure

This is a pnpm + Turbo monorepo. See [AGENTS.md](./AGENTS.md) for detailed structure guidelines.

### Key Directories

- `apps/airiscode-cli/` - Main CLI application
- `packages/*/` - Reusable packages
- `tools/make/` - Build and development scripts
- `docs/` - Documentation

## Development Workflow

### Branch Strategy

- `main` - Stable production-ready code
- `develop` - Integration branch for ongoing development
- `feature/*` - Feature development branches

### Making Changes

1. Create a feature branch from `develop`:
   ```bash
   git checkout develop
   git pull origin develop
   git checkout -b feature/your-feature-name
   ```

2. Make your changes following our coding standards

3. Run tests and linting:
   ```bash
   pnpm lint
   pnpm test
   pnpm build
   ```

4. Commit your changes using conventional commits:
   ```bash
   git commit -m "feat: add new feature"
   git commit -m "fix: resolve bug in shell guard"
   git commit -m "docs: update README"
   ```

### Conventional Commits

We use conventional commit messages:

- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation changes
- `refactor:` - Code refactoring
- `test:` - Adding or updating tests
- `chore:` - Maintenance tasks
- `perf:` - Performance improvements

### Pull Request Process

1. Push your branch to your fork
2. Create a Pull Request to the `develop` branch
3. Fill out the PR template with:
   - Description of changes
   - Related issue numbers
   - Testing performed
   - Screenshots (if applicable)

4. Wait for code review
5. Address review feedback
6. Once approved, your PR will be merged

## Coding Standards

### TypeScript

- Use strict TypeScript (`strict: true`)
- 2-space indentation
- Semicolons required
- Single quotes for strings

### Naming Conventions

- **Types/Interfaces/Classes**: PascalCase (`PolicyProfile`, `ShellGuard`)
- **Functions/Variables**: camelCase (`evaluateCommand`, `guardResult`)
- **Directories**: kebab-case (`shell-guard`, `mcp-client`)
- **Files**: kebab-case with extension (`shell-guard.ts`, `policy-profile.spec.ts`)

### Testing

- Place tests next to the code: `*.spec.ts`
- Use Vitest for all tests
- Aim for >80% code coverage
- Test both happy path and error cases

### Documentation

- Add JSDoc comments for exported functions and classes
- Update README.md when adding new features
- Keep CLAUDE.md and related docs in sync

## Security Guidelines

### Shell Guard

When adding new adapters or tools that execute shell commands:

1. **Always route through Shell Guard**:
   ```typescript
   import { ShellGuard } from '@airiscode/sandbox';
   const guard = new ShellGuard(policy);
   const result = guard.evaluate(command);
   ```

2. **Never downgrade policy defaults** in code

3. **Document dangerous patterns** in `packages/sandbox/src/deny-list.ts`

4. **Add regression tests** for blocked commands

### Policy Enforcement

- Respect `--approvals` and `--trust` flags
- Never bypass policy checks
- Log all policy violations

## Adding New Packages

1. Create directory under `packages/`
2. Add `package.json` with workspace dependencies
3. Add `tsconfig.json` extending `../../tsconfig.base.json`
4. Add `src/index.ts` as entry point
5. Add `__tests__/` directory with spec files
6. Update `pnpm-workspace.yaml` if needed

## Running Specific Tasks

```bash
# Build single package
pnpm --filter @airiscode/sandbox build

# Test single package
pnpm --filter @airiscode/policies test

# Run CLI in dev mode
pnpm --filter airiscode-cli dev

# Clean all build artifacts
pnpm clean
```

## Debugging

### Enable Debug Logs

```bash
DEBUG=airiscode:* pnpm dev
```

### VSCode Debug Configuration

See `.vscode/launch.json` (TBD)

## Getting Help

- Check [CLAUDE.md](./CLAUDE.md) for architecture guidance
- Read [ARCHTECHTURE.md](./ARCHTECHTURE.md) for system design
- Review [実装計画プランニング.md](./実装計画プランニング.md) for implementation plan
- Open a GitHub Discussion for questions
- Join our Discord (TBD)

## Code of Conduct

Be respectful, inclusive, and constructive in all interactions.

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
