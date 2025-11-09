# Repository Guidelines

## Project Structure & Module Organization
Follow the monorepo map in `ARCHTECHTURE.md`: runnable surfaces live in `apps/` (the Ink-based `apps/airiscode-cli`), reusable logic in `packages/` (drivers, adapters, MCP clients, policies, sandbox guard, runners, UX), long-form docs in `docs/`, and deterministic helper scripts under `tools/make/`. Keep new work aligned with this split: add adapters under `packages/adapters/<name>`, drivers under `packages/drivers/<provider>`, fixtures in `__fixtures__/`, and specs beside the source file they cover.

## Build, Test & Development Commands
- `pnpm install` — hydrate all workspaces; avoid npm/yarn.
- `pnpm turbo run build` — repo-wide type-check/compile.
- `pnpm turbo run lint` — ESLint + Prettier baseline.
- `pnpm turbo run test` — execute unit/integration suites.
- `pnpm --filter apps/airiscode-cli dev` — run the CLI locally with hot reload.
- `tools/make/setup` / `tools/make/test` — CI-stable bootstrap/test flows; prefer them for scripts or pipelines.

## Coding Style & Naming Conventions
Use 2-space indentation, semicolons, and strict TypeScript configs. Exported types/classes stay PascalCase, functions/variables camelCase, directories kebab-case. Adapters, drivers, and runners must remain thin shims; hoist reusable helpers into `packages/ux` or `packages/policies` instead of duplicating logic. Always run `pnpm turbo run lint` prior to review to enforce formatting and static analysis.

## Testing Guidelines
Name specs `*.spec.ts` and colocate them with the code. Components that talk to Shell Guard, approvals, or MCP tools need integration tests that exercise the policy plumbing; store deterministic payloads in `__fixtures__/`. Match the package’s current coverage metrics and document any new CI entry points via `tools/make/`. For targeted runs, use `pnpm turbo run test -- --filter <package>`.

## Architecture & Tooling Notes
The CLI orchestrates Super Agent, MindBase memory, SuperClaude assets, external adapters (Codex, Claude Code, Gemini, Aider), and the AIRIS MCP Gateway. Shell Guard must vet every proposed shell command, and approval/trust profiles (see `packages/policies`) dictate what adapters may execute. When introducing new tools, describe their shell intents so the gateway and guard lists stay accurate, and ensure dynamic tooling remains LLM-agnostic as outlined in the architecture doc.

## Commit & Pull Request Guidelines
Use conventional commits (`feat:`, `fix:`, `docs:`, etc.) so Turbo scopes and release automation stay reliable. PR descriptions should cover problem, solution, validation (commands run, screenshots for TUI updates, linked issues), and any policy or architecture impacts (e.g., approval defaults, new MCP servers). Do not request review until `pnpm turbo run build lint test` succeeds locally.
