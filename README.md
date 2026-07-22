# rgpv-raw-data

Raw data collection and publishing scripts for RGPV-related data feeds.

This repository scrapes and prepares:

- timetable data
- scheme data
- syllabus data
- info metadata
- latest news alerts

The project now uses a modern TypeScript-based Node stack with pnpm and Vite+ ecosystem tools where they fit this repo.

## Stack

- **Node.js:** 24 LTS
- **Package manager:** pnpm
- **Language:** TypeScript
- **Module system:** ESM
- **Runtime TS execution:** tsx
- **Library bundling:** tsdown
- **Testing:** Vitest
- **Linting:** Oxlint
- **Formatting:** Oxfmt
- **Env validation:** zod

## Requirements

- Node.js `24.x`
- pnpm `11.x`

The repo is pinned with:

- `.node-version`
- `packageManager` in `package.json`

## Install

```bash
pnpm install
```

## Environment

Copy `.env.example` to `.env` and fill the values:

```bash
cp .env.example .env
```

Required variables:

```env
SPREADSHEET_ID=
POST_ALL_NEWS_URL=
POST_RECENT_NEWS_URL=
POST_NEWS_PASSWORD=
SHORT_URL_GENERATOR_URL=
SHORT_URL_PASSWORD=
ZOHO_USERNAME=
ZOHO_PASSWORD=
IMAGE_GENERATOR_AUTH_1=
IMAGE_GENERATOR_AUTH_2=
IMAGE_GENERATOR_AUTH_3=
IMAGE_GENERATOR_AUTH_4=
IMAGE_GENERATOR_AUTH_5=
```

## Google Sheets credentials

A dummy `credentials.json` template is committed so the expected file shape is clear.

For local or CI usage, replace it with valid Google service account credentials that have access to the target spreadsheet.

## Scripts

### Data generation

```bash
pnpm run compile:timetable
pnpm run compile:scheme
pnpm run compile:syllabus
pnpm run compile:info
pnpm run compile:news
```

### Combined data build

```bash
pnpm run build:data
pnpm run build
```

### Quality checks

```bash
pnpm run lint
pnpm run format
pnpm run format:check
pnpm run typecheck
pnpm run test
pnpm run check
```

### Bundle entrypoints

```bash
pnpm run bundle
```

## Generated output

Generated JSON files are written to `dist/`:

- `dist/timetable.json`
- `dist/scheme.json`
- `dist/syllabus.json`
- `dist/info.json`

## Project structure

```text
.
├─ services/
│  ├─ axios/
│  ├─ auth/
│  ├─ cheerio/
│  ├─ env/
│  ├─ hashtagGenerator/
│  ├─ imageGenerator/
│  ├─ retry/
│  └─ socialMediaShare/
├─ dist/
├─ get_info_data.ts
├─ get_scheme_data.ts
├─ get_syllabus_data.ts
├─ get_timetable_data.ts
└─ write_news_alerts.ts
```

## Workflows

### `compile-latest-data`

Runs on a schedule and:

1. compiles timetable data
2. compiles syllabus data
3. compiles scheme data
4. compiles info data
5. formats generated files
6. deploys `dist/` to the `publish` branch

### `compile-latest-news-data`

Runs on a schedule and:

1. creates runtime `.env` from GitHub Actions secrets
2. creates `credentials.json`
3. installs dependencies with pnpm
4. runs the news alert pipeline

## Notes

- The repo targets **Node 24**, so running it on older Node versions can show engine warnings.
- Retry behavior for the main compile entrypoints is bounded and logged.
- Debug logs are intentionally kept to help with scraper and publishing diagnosis.
