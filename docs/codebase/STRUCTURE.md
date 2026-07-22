# Codebase Structure

## Core Sections (Required)

### 1) Top-Level Map

| Path | Purpose | Evidence |
|------|---------|----------|
| `get_timetable_data.ts` | Entry: scrapes RGPV timetable → writes `dist/timetable.json` | get_timetable_data.ts |
| `get_syllabus_data.ts` | Entry: scrapes RGPV syllabus → writes `dist/syllabus.json` | get_syllabus_data.ts |
| `get_scheme_data.ts` | Entry: scrapes RGPV scheme → writes `dist/scheme.json` | get_scheme_data.ts |
| `get_info_data.ts` | Entry: scrapes RGPV program/system info → writes `dist/info.json` | get_info_data.ts |
| `write_news_alerts.ts` | Entry: scrapes RGPV news → Google Sheets → API servers → Zoho Social | write_news_alerts.ts |
| `services/` | Shared service modules used by entry scripts | services/ |
| `services/axios/` | HTTP transport wrappers (GET, POST, RGPV-specific form posting) | services/axios/index.ts |
| `services/cheerio/` | HTML scraping logic (parses RGPV page DOM) | services/cheerio/index.ts |
| `services/env/` | Zod-validated env singleton (`getEnv()`) | services/env/index.ts |
| `services/retry/` | Generic async retry wrapper (`withRetry`) | services/retry/index.ts |
| `services/auth/` | Selects a random image-generator auth key at module load | services/auth/index.ts |
| `services/imageGenerator/` | Calls external image generation API to produce social post images | services/imageGenerator/index.ts |
| `services/hashtagGenerator/` | Exports a static RGPV hashtag string constant | services/hashtagGenerator/index.ts |
| `services/socialMediaShare/` | Puppeteer-driven Zoho Social browser automation for posting | services/socialMediaShare/index.ts |
| `dist/` | Generated output (JSON data files); deployed to `publish` branch | .github/workflows/compile data.yml |
| `.github/workflows/` | GitHub Actions CI pipelines for data compilation and news posting | .github/workflows/ |
| `credentials.json` | Committed dummy template for Google service account shape | credentials.json |
| `.env.example` | Template listing all required environment variables | .env.example |
| `tsconfig.json` | TypeScript compiler config | tsconfig.json |
| `tsdown.config.ts` | Bundler config listing all five entrypoints | tsdown.config.ts |
| `vitest.config.ts` | Vitest test runner config | vitest.config.ts |
| `vite.config.ts` | Empty Vite config (peer dependency of Vitest) | vite.config.ts |
| `.oxlintrc.json` | Oxlint ruleset config | .oxlintrc.json |
| `.oxfmtrc.json` | Oxfmt formatter ignore patterns | .oxfmtrc.json |
| `.node-version` | Node.js version pin (`24`) | .node-version |

### 2) Entry Points

- Main runtime entries: Five independent script files at project root — each is a standalone pipeline:
  - `get_timetable_data.ts` — run via `pnpm run compile:timetable`
  - `get_syllabus_data.ts` — run via `pnpm run compile:syllabus`
  - `get_scheme_data.ts` — run via `pnpm run compile:scheme`
  - `get_info_data.ts` — run via `pnpm run compile:info`
  - `write_news_alerts.ts` — run via `pnpm run compile:news`
- Secondary entry points (worker/cli/jobs): None; all invoked as top-level Node.js scripts
- How entry is selected: `package.json` `scripts` using `tsx <filename>.ts`; also listed in `tsdown.config.ts` for bundling

### 3) Module Boundaries

| Boundary | What belongs here | What must not be here |
|----------|-------------------|------------------------|
| Root entry scripts (`get_*.ts`, `write_*.ts`) | Orchestration logic, data shape types, `writeFile` calls | Reusable transport or utility logic |
| `services/axios/` | All HTTP requests and response handling | HTML parsing, business rules, file I/O |
| `services/cheerio/` | DOM scraping and data extraction from HTML | HTTP transport, file I/O |
| `services/env/` | Env validation and the `getEnv()` singleton | Business logic, HTTP calls |
| `services/retry/` | Retry loop and delay utility | Domain-specific logic |
| `services/auth/` | Auth credential selection | HTTP calls, scraping |
| `services/imageGenerator/` | Image generation API calls | Posting logic, scraping |
| `services/socialMediaShare/` | Browser-automation posting pipeline | Data scraping, image generation |

### 4) Naming and Organization Rules

- File naming: `snake_case` for root entry scripts (e.g. `get_timetable_data.ts`); service directories use `camelCase` names
- Directory organization: feature-based `services/<feature>/index.ts` pattern — each service is a named folder with a single `index.ts` export
- Import aliasing: None; all imports use relative paths (e.g. `"./services/retry/index"`)
- TypeScript module resolution: `"moduleResolution": "Bundler"` in tsconfig — no path aliases configured

### 5) Evidence

- package.json (scripts section lists all entrypoints)
- tsdown.config.ts (explicit bundler entrypoint list)
- tsconfig.json (include/exclude, moduleResolution)
- services/ directory layout (observed from workspace structure)
