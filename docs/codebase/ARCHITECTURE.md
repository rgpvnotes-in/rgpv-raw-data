# Architecture

## Core Sections (Required)

### 1) Architectural Style

- Primary style: **Pipeline / Script-based** — five independent, sequential data pipeline scripts. Each is a standalone, stateless program invoked by the CI scheduler or manually.
- Why this classification: No server process, no shared runtime state, no inter-process communication. Each entry script executes from top to bottom, writes a JSON file or calls external APIs, then exits.
- Primary constraints:
  1. Scripts are run by GitHub Actions on a fixed schedule — must complete within CI timeout (45–120 minutes).
  2. All external dependencies (RGPV website, Google Sheets, external APIs) are network I/O — no local database.
  3. Each data pipeline is entirely independent; no shared job queue or orchestration layer.

### 2) System Flow

#### Data compilation pipelines (`get_*.ts`)

```text
GitHub Actions schedule
  → tsx get_<type>_data.ts
    → services/cheerio: scrape RGPV HTML page (stateData / program list)
    → services/axios:   POST RGPV form endpoint to get individual PDF/file URLs
    → [repeat per program / semester / scheme]
  → fs.writeFile → dist/<type>.json
  → (after all 4 complete) oxfmt prettify → deploy dist/ to 'publish' branch
```

#### News alerts pipeline (`write_news_alerts.ts`)

```text
GitHub Actions schedule (every 10 min)
  → dotenv loads .env → services/env: validate & cache env
  → services/cheerio: scrape rgpv.ac.in homepage alert modal (latestAlerts)
  → googleapis: read existing news from Google Sheet (Sheet1!A2:F)
  → [for each new item not yet in sheet]:
      → services/axios: call SHORT_URL_GENERATOR to shorten URL
      → services/axios: POST to Image Generator API → download image file
      → googleapis: append new row to Google Sheet
      → services/socialMediaShare (puppeteer): log in to Zoho Social → upload image → post
      → services/axios: PUT/POST recent news to API server
  → services/axios: POST all news to API server (last 100 rows)
```

### 3) Layer/Module Responsibilities

| Layer or module | Owns | Must not own | Evidence |
|-----------------|------|--------------|----------|
| Root entry scripts | Orchestration, data shape types, `writeFile` | Reusable transport, parsing | get_timetable_data.ts, get_info_data.ts |
| `services/axios/` | All HTTP GET/POST, RGPV ASP.NET form encoding, news API calls | HTML parsing, file I/O, env loading | services/axios/index.ts |
| `services/cheerio/` | HTML DOM parsing, data extraction from RGPV pages | HTTP transport, file writing | services/cheerio/index.ts |
| `services/env/` | Zod schema, parse-once cached `getEnv()` singleton | All other logic | services/env/index.ts |
| `services/retry/` | Generic async retry with delay | Domain-specific logic | services/retry/index.ts |
| `services/auth/` | Random selection of IMAGE_GENERATOR_AUTH_N key | HTTP calls, scraping | services/auth/index.ts |
| `services/imageGenerator/` | Build payload, call image generation API | Social posting | services/imageGenerator/index.ts |
| `services/socialMediaShare/` | Puppeteer browser session, Zoho Social login + post + file upload | Image generation, scraping | services/socialMediaShare/index.ts |
| `services/hashtagGenerator/` | Single exported constant hashtag string | All logic | services/hashtagGenerator/index.ts |

### 4) Reused Patterns

| Pattern | Where found | Why it exists |
|---------|-------------|---------------|
| Retry wrapper | `services/retry/index.ts`, used by all `get_*.ts` entry scripts | Network requests to RGPV are unreliable; bounded retry with delay prevents single-failure aborts |
| Env singleton | `services/env/index.ts` (cached parse) | Avoids re-parsing and re-validating process.env on every call; throws early on missing vars |
| IIFE module-load execution | `services/auth/index.ts` | Selects random auth key once at import time |
| Sequential async for-loops | All entry scripts | Preserves RGPV rate-limit safety by not parallelising scrape requests |
| Error catch-and-log (non-throw) | `services/axios/index.ts`, `write_news_alerts.ts` | Service functions catch errors, log to stderr, and return undefined rather than propagating — allows pipeline to continue partially |

### 5) Known Architectural Risks

- **No error propagation in service layer**: Most `services/axios` functions catch all errors and return `undefined`. Entry scripts do not check return values in all cases, silently producing incomplete JSON output (e.g. `programData.url = fileUrl` where `fileUrl` may be `undefined`).
- **Single-job serial scraping**: Data compilation loops are sequential. RGPV has no documented rate-limit policy; this is safe but very slow — timetable/scheme/syllabus jobs can approach the 45-minute CI timeout.
- **Puppeteer fragility**: `services/socialMediaShare` depends on Zoho Social DOM selectors and hard-coded navigation timeouts (`timeout: 0`). Any UI change to Zoho Social will silently break posting.
- **Hardcoded ASP.NET session cookie**: A fixed `ASP.NET_SessionId` is embedded in HTTP headers in both `services/axios/index.ts` and `services/cheerio/index.ts`. If the session expires on the server, all RGPV scraping calls will fail.

### 6) Evidence

- get_timetable_data.ts (orchestration pattern)
- write_news_alerts.ts (news pipeline flow)
- services/retry/index.ts (retry pattern)
- services/env/index.ts (singleton pattern)
- services/axios/index.ts (error catch-and-log)
- services/socialMediaShare/index.ts (puppeteer automation)
- .github/workflows/compile data.yml (CI scheduling and job topology)
