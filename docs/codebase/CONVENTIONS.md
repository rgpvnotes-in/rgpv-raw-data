# Coding Conventions

## Core Sections (Required)

### 1) Naming Rules

| Item | Rule | Example | Evidence |
|------|------|---------|----------|
| Root entry files | `snake_case` | `get_timetable_data.ts`, `write_news_alerts.ts` | Project root |
| Service directories | `camelCase` | `services/socialMediaShare/`, `services/imageGenerator/` | services/ |
| Service index files | Always `index.ts` inside named directory | `services/retry/index.ts` | services/ |
| Functions | `camelCase` | `writeTimeTableData`, `fetchTimeTableFileUrl`, `latestAlerts` | get_timetable_data.ts, services/axios/index.ts |
| Types / interfaces | `PascalCase` | `TimeTableProgram`, `AppEnv`, `SchemeBucket` | get_timetable_data.ts, services/env/index.ts |
| Constants | `camelCase` (exported) or `SCREAMING_SNAKE_CASE` (env vars only) | `rgpvHeaders`, `constantHashTag`, `SPREADSHEET_ID` | services/cheerio/index.ts, services/hashtagGenerator/index.ts |
| Exported named exports | Named (no default exports observed) | `export const withRetry`, `export const getEnv` | All service files |

### 2) Formatting and Linting

- Formatter: **oxfmt** — config in `.oxfmtrc.json` (ignores `.vscode/**` and `dist/**`)
- Linter: **oxlint** — config in `.oxlintrc.json` (plugins: `typescript`, `unicorn`, `oxc`; `correctness` category set to `error`)
- Most relevant enforced rules: TypeScript correctness errors, unicorn idiomatic JS rules, oxc-specific checks
- Run commands:
  ```bash
  pnpm run lint          # oxlint .
  pnpm run format        # oxfmt --write .
  pnpm run format:check  # oxfmt --check .
  pnpm run check         # lint + format:check + typecheck + test
  ```

### 3) Import and Module Conventions

- Import grouping/order: No enforced grouping rule observed; standard library and external packages are mixed with local imports in some files (e.g. `write_news_alerts.ts` mixes `node:crypto`, `googleapis`, `axios` without separation)
- Alias vs relative import policy: All local imports use relative paths with explicit `/index` suffix (e.g. `"./services/retry/index"`) — no path aliases configured in `tsconfig.json`
- Public exports/barrel policy: Each service exposes named exports from its `index.ts`; no root-level barrel file exists

### 4) Error and Logging Conventions

- Error strategy: Most service functions use `try/catch` that logs to `console.error` and returns `undefined` rather than re-throwing. Entry scripts use `withRetry` at the top level to retry the full pipeline on failure. `services/env/index.ts` is an exception — it throws immediately on invalid env.
- Logging style: `console.log` for debug diagnostics (including sensitive-leaning info such as auth key index), `console.error` for caught errors. Format: plain string interpolation, no structured logging.
- Sensitive-data redaction: **No redaction**. Auth key indices and request flag values are logged (e.g. `console.log("customHeaders value ", !!customHeaders)`). Actual secret values are not logged, but `console.log` statements in `simplePostData` reveal request parameters.

### 5) Testing Conventions

- Test file naming/location rule: No test files exist in the repository. `vitest.config.ts` has `passWithNoTests: true` to allow `pnpm run test` to succeed with zero test files.
- Mocking strategy norm: [TODO] — no tests exist to observe mocking patterns
- Coverage expectation: [TODO] — no coverage configuration or threshold set

### 6) Evidence

- .oxlintrc.json
- .oxfmtrc.json
- tsconfig.json
- services/retry/index.ts (representative naming and export style)
- services/env/index.ts (error-throw vs catch-log exception)
- services/axios/index.ts (catch-log pattern, debug console.log)
- vitest.config.ts (passWithNoTests)
