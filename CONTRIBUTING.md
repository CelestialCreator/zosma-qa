# Contributing

## Development Setup

### Prerequisites

- [Node.js 18+](https://nodejs.org/)
- [pnpm 9+](https://pnpm.io/)

### Getting Started

```bash
# Clone the repo
git clone https://github.com/zosmaai/zosma-qa.git
cd zosma-qa

# Install dependencies
pnpm install

# Build all packages
pnpm build

# Type check all packages
pnpm typecheck
```

### Running the Example Test Suite

The example suite runs Playwright tests against the live [https://www.zosma.ai](https://www.zosma.ai) site.

```bash
# Run all 32 example tests
pnpm test:examples

# Run a single spec file
cd examples/zosma-ai && pnpm exec playwright test tests/home.spec.ts

# Open the HTML report
pnpm report
```

### Lint and Format

This project uses [Biome](https://biomejs.dev/) for linting and formatting.

```bash
# Check for issues
pnpm lint

# Auto-fix issues
pnpm lint:fix

# Format all files
pnpm format
```

### Cleaning Build Artifacts

```bash
pnpm clean
```

## Conventions

### Code Style

- TypeScript throughout, strict mode — no `any`, no implicit `any`
- CommonJS output (`"module": "commonjs"` in all `tsconfig.json` files)
- All source files under `src/`, compiled output in `dist/`
- Use `node:` prefix on all Node.js built-in imports
- Biome handles formatting (tabs, 80 line width, double quotes)
- Run `pnpm lint:fix` to auto-fix issues before committing

### CLI Prompts

The CLI uses `@inquirer/prompts` (the new modular API). Do not use the old `inquirer` package or `@types/inquirer`.

### Imports Between Packages

Use workspace aliases, not relative paths between packages:

```typescript
// CORRECT
import { defineConfig } from '@zosmaai/zosma-qa-core';

// WRONG
import { defineConfig } from '../../core/src/config';
```

### Git

- Branch naming: `feat/description`, `fix/description`, `refactor/description`
- Commit format: `type(scope): description`
  - Types: `feat`, `fix`, `refactor`, `test`, `docs`, `chore`
  - Scopes: `core`, `playwright`, `cli`, `examples`, `templates`
- Include `fixes #N` or `closes #N` in commit messages for related issues
- Never force push to main

### Testing

- Example tests live in `examples/zosma-ai/tests/`
- All tests target the live `https://www.zosma.ai` site
- Always call `waitForLoadState('networkidle')` — the site is a Next.js app
- See `AGENTS.md` for DOM patterns and locator conventions

### Pull Requests

- One feature or fix per PR
- Include tests for new functionality where applicable
- All CI checks must pass before merge
- PRs are reviewed, then merged to main

## Project Layout

```
packages/core/         Shared TypeScript types, config, and test discovery
packages/playwright/   Playwright runner plugin and base config factory
packages/cli/          Full interactive CLI (init, agents, run, report commands)
packages/zosma-qa/     Thin unscoped wrapper — the `npx zosma-qa` entry point
examples/zosma-ai/     Working example test suite (tests against zosma.ai)
templates/playwright/  Files scaffolded by `npx zosma-qa init`
tests/                 Root test directory (users put their tests here)
specs/                 AI planner markdown output
docs/                  Architecture, getting started, and vision docs
```

Each package in `packages/` has its own `package.json`, `tsconfig.json`, and `src/` directory. Packages reference each other via the workspace protocol (`workspace:*`).
