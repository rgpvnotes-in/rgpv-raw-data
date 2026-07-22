# Testing Patterns

## Core Sections (Required)

### 1) Test Stack and Commands

- Primary test framework: **Vitest 4.1.10** (configured with `passWithNoTests: true`)
- Assertion/mocking tools: Vitest built-ins (no additional assertion or mock libraries observed)
- Commands:

```bash
pnpm run test         # vitest run (single pass, passes with no test files)
pnpm run test:watch   # vitest (watch mode)
# No coverage command defined in package.json scripts
```

### 2) Test Layout

- Test file placement pattern: [TODO] — no test files exist in the repository; the configured framework does not enforce a pattern yet
- Naming convention: [TODO] — no convention established; vitest defaults would apply (`*.test.ts` / `*.spec.ts`)
- Setup files: None configured in `vitest.config.ts`

### 3) Test Scope Matrix

| Scope | Covered? | Typical target | Notes |
|-------|----------|----------------|-------|
| Unit | No | Services (retry, env, cheerio, axios wrappers) | No tests exist |
| Integration | No | RGPV scraping, Google Sheets, API calls | Would require network or mock responses |
| E2E | No | Full data pipeline (scrape → JSON write) | No tests exist |

### 4) Mocking and Isolation Strategy

- Main mocking approach: [TODO] — no tests exist to establish a pattern
- Isolation guarantees: [TODO] — not established
- Common failure mode in tests: [TODO] — not established

### 5) Coverage and Quality Signals

- Coverage tool + threshold: Not configured. No `--coverage` flag in any script.
- Current reported coverage: 0% (no test files exist)
- Known gaps: The entire codebase has no automated test coverage. The `passWithNoTests: true` setting in `vitest.config.ts` ensures CI does not fail due to missing tests, which masks the absence of coverage.

### 6) Evidence

- vitest.config.ts (framework config, `passWithNoTests: true`)
- vite.config.ts (empty; required as Vitest peer)
- package.json (`test` and `test:watch` scripts)
