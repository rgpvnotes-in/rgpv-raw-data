# Technology Stack

## Core Sections (Required)

### 1) Runtime Summary

| Area | Value | Evidence |
|------|-------|----------|
| Primary language | TypeScript (strict, ESNext target) | tsconfig.json |
| Runtime + version | Node.js 24 (pinned, `>=24 <25`) | .node-version, package.json `engines` |
| Package manager | pnpm 11.15.1 | package.json `packageManager`, pnpm-workspace.yaml |
| Module system | ESM (`"type": "module"`) | package.json |
| TS runtime execution | tsx 4.23.1 (no pre-compilation for run scripts) | package.json `scripts` |
| Bundler | tsdown 0.22.13 (for distributing entrypoints) | tsdown.config.ts, package.json `bundle` script |

### 2) Production Frameworks and Dependencies

| Dependency | Version | Role in system | Evidence |
|------------|---------|----------------|----------|
| axios | ^1.18.1 | HTTP client for all RGPV web scraping and API calls | package.json, services/axios/index.ts |
| cheerio | ^1.2.0 | Server-side HTML parsing for scraping RGPV pages | package.json, services/cheerio/index.ts |
| dotenv | ^17.4.2 | Loads `.env` file into `process.env` at runtime | package.json, write_news_alerts.ts |
| googleapis | ^173.0.0 | Google Sheets API client (read/write news data) | package.json, write_news_alerts.ts |
| puppeteer | ^25.3.0 | Headless browser automation for Zoho Social posting | package.json, services/socialMediaShare/index.ts |
| zod | ^4.1.5 | Runtime validation and typing of environment variables | package.json, services/env/index.ts |

### 3) Development Toolchain

| Tool | Purpose | Evidence |
|------|---------|----------|
| typescript 7.0.2 | Type checking (`tsc --noEmit`) — no emit, tsx handles execution | package.json devDependencies, tsconfig.json |
| tsx 4.23.1 | Direct TypeScript execution (replaces ts-node) | package.json `scripts` |
| vitest 4.1.10 | Unit test runner | package.json, vitest.config.ts |
| vite 8.1.5 | Peer dependency of vitest; empty config present | vite.config.ts |
| oxlint 1.75.0 | Fast Rust-based linter (typescript + unicorn + oxc plugins) | package.json, .oxlintrc.json |
| oxfmt 0.60.0 | Code formatter | package.json, .oxfmtrc.json |
| tsdown 0.22.13 | Bundler for distributable output from entrypoints | tsdown.config.ts |
| @types/node 26.1.1 | Node.js type definitions | package.json devDependencies |

### 4) Key Commands

```bash
# Install
pnpm install

# Run individual data pipelines
pnpm run compile:timetable
pnpm run compile:syllabus
pnpm run compile:scheme
pnpm run compile:info
pnpm run compile:news

# Build all data
pnpm run build

# Bundle entrypoints
pnpm run bundle

# Quality checks (lint + format-check + typecheck + test)
pnpm run check

# Individual checks
pnpm run lint
pnpm run format
pnpm run format:check
pnpm run typecheck
pnpm run test
```

### 5) Environment and Config

- Config sources: `.env` (loaded via dotenv), `credentials.json` (Google service account)
- Required env vars: `SPREADSHEET_ID`, `POST_ALL_NEWS_URL`, `POST_RECENT_NEWS_URL`, `POST_NEWS_PASSWORD`, `SHORT_URL_GENERATOR_URL`, `SHORT_URL_PASSWORD`, `ZOHO_USERNAME`, `ZOHO_PASSWORD`, `IMAGE_GENERATOR_AUTH_1`..`IMAGE_GENERATOR_AUTH_5`
- Runtime constraints: Node.js 24 strictly required; pnpm is the only supported package manager
- CI secrets: All env vars injected via GitHub Actions repository secrets at runtime

### 6) Evidence

- package.json
- tsconfig.json
- .node-version
- .env.example
- .oxlintrc.json
- .oxfmtrc.json
- tsdown.config.ts
- vitest.config.ts
