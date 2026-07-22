# External Integrations

## Core Sections (Required)

### 1) Integration Inventory

| System | Type | Purpose | Auth model | Criticality | Evidence |
|--------|------|---------|------------|-------------|----------|
| RGPV website (`www.rgpv.ac.in`) | Web scraping (HTTP) | Source of all academic data (timetable, scheme, syllabus, info, news) | None (public pages); hardcoded ASP.NET session cookie for form endpoints | High | services/axios/index.ts, services/cheerio/index.ts |
| Google Sheets API | REST API (googleapis) | Persistent store for news deduplication; read/append news rows | Google service account (`credentials.json`), `googleapis` library | High (news pipeline) | write_news_alerts.ts, credentials.json |
| Custom API server (POST_ALL_NEWS_URL / POST_RECENT_NEWS_URL) | REST API (HTTP POST) | Pushes news data to an external application backend | Password-based Basic Auth (`POST_NEWS_PASSWORD`) | High (news pipeline) | services/axios/index.ts, .env.example |
| Short URL generator (SHORT_URL_GENERATOR_URL) | REST API (HTTP) | Shortens raw RGPV URLs for social media posts | Password-based auth (`SHORT_URL_PASSWORD`) | Medium (news pipeline) | .env.example, write_news_alerts.ts |
| Image generator API | REST API (HTTP POST) | Generates branded social post images | Bearer-style key auth, 5 keys rotated randomly (`IMAGE_GENERATOR_AUTH_1`..`5`) | Medium (news pipeline) | services/auth/index.ts, services/imageGenerator/index.ts |
| Zoho Social (`social.zoho.in`) | Browser automation (Puppeteer) | Posts news alerts with image to social media | Username + password (`ZOHO_USERNAME`, `ZOHO_PASSWORD`) via browser form | Medium (news pipeline) | services/socialMediaShare/index.ts |

### 2) Data Stores

| Store | Role | Access layer | Key risk | Evidence |
|-------|------|--------------|----------|----------|
| Google Sheets (spreadsheet ID from env) | News deduplication ledger; source of truth for posted news history | `write_news_alerts.ts` via `googleapis` v4 Sheets API | Sheet structure is assumed (range `Sheet1!A2:F`, columns A/D/F); schema not validated in code | write_news_alerts.ts |
| `dist/` directory (local, ephemeral in CI) | Temporary output of compiled JSON files before deployment | `fs.writeFile` in entry scripts | Files are lost if CI job fails before the `prettify-and-deploy` job runs; cached between jobs via `actions/cache` | .github/workflows/compile data.yml |
| `publish` git branch | Permanent hosting of generated JSON data (GitHub Pages / branch-based API) | GitHub Actions `JamesIves/github-pages-deploy-action` | Branch is force-pushed on every CI run; no history is preserved | .github/workflows/compile data.yml |

### 3) Secrets and Credentials Handling

- Credential sources: `.env` file at runtime (local); GitHub Actions repository secrets injected into `.env` by the CI workflow
- `credentials.json`: A dummy template is committed to the repo. In CI, actual service account JSON is injected from the `SHEET_CREDENTIALS` secret via `echo ${{ secrets.SHEET_CREDENTIALS }} >> credentials.json`
- Hardcoding concerns: A hardcoded ASP.NET session cookie (`ASP.NET_SessionId=hznbm3vovcoagebriewkhpw0`) is present in both `services/axios/index.ts` and `services/cheerio/index.ts`. This is not a user secret but will cause silent failures if the RGPV server invalidates the session.
- Rotation or lifecycle notes: No automated key rotation. The 5 image-generator auth keys are selected randomly per run but no rotation policy is documented. Google service account credentials have no expiry mechanism in code.

### 4) Reliability and Failure Behavior

- Retry/backoff behavior: `services/retry/withRetry` wraps all entry-point pipeline functions with configurable retries (default: 3 retries, 1000ms delay; entry scripts use 3 retries, 1500ms delay). Individual service calls inside pipelines do NOT retry independently.
- Timeout policy: No explicit timeouts on axios requests. Puppeteer navigation uses `timeout: 0` (unlimited). CI job timeouts: 45 minutes for data jobs, 120 minutes for news job.
- Circuit-breaker or fallback behavior: None. Service functions return `undefined` on error; callers do not check all return values.

### 5) Observability for Integrations

- Logging around external calls: `console.error` on all caught exceptions with caller name and truncated domain. `console.log` debug statements in `simplePostData` (logs request metadata).
- Metrics/tracing coverage: None — no structured logging, no APM, no request tracing.
- Missing visibility gaps: No way to tell which specific RGPV page/program caused a failure without reading raw CI logs. No alerting on partial data compilation (e.g. some programs succeed, others silently return `undefined` URLs).

### 6) Evidence

- services/axios/index.ts (HTTP wrappers, auth patterns, hardcoded headers)
- services/cheerio/index.ts (RGPV scraping, hardcoded cookie)
- services/env/index.ts (env validation schema)
- services/socialMediaShare/index.ts (Zoho Social automation)
- write_news_alerts.ts (Google Sheets integration)
- credentials.json (service account template shape)
- .env.example (full list of required secrets)
- .github/workflows/check news alerts.yml (CI secret injection pattern)
