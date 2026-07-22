# Codebase Concerns

## Core Sections (Required)

### 1) Top Risks (Prioritized)

| Severity | Concern | Evidence | Impact | Suggested action |
|----------|---------|----------|--------|------------------|
| High | Hardcoded ASP.NET session cookie in HTTP headers | `services/axios/index.ts` line ~14, `services/cheerio/index.ts` line ~14 | If RGPV server invalidates the session, all data scraping silently fails (returns `undefined`) | Replace with a session-refresh mechanism or validate cookie freshness before each scrape |
| High | Zero test coverage | vitest.config.ts (`passWithNoTests: true`), no `*.test.ts` files | No automated regression safety net for any pipeline logic | Add unit tests for at minimum `services/env`, `services/retry`, and `services/cheerio` parsing logic |
| High | Silent partial failures in scraped data | `services/axios/index.ts` (catch returns `undefined`), `get_timetable_data.ts` (`programData.url = fileUrl` not checked) | Compiled JSON may contain `undefined` URL fields without any build failure signal | Add explicit checks for `undefined` returns; fail fast or log a structured warning per-item |
| Medium | Puppeteer-based Zoho Social posting is selector-fragile | `services/socialMediaShare/index.ts` (CSS selectors, `waitForSelector`) | Any Zoho Social UI change will break the posting pipeline with no graceful degradation | [ASK USER] Consider replacing with Zoho Social REST API if available |
| Medium | Duplicate `rgpvHeaders` object in two files | `services/axios/index.ts` and `services/cheerio/index.ts` (identical constants) | Risk of headers diverging if one copy is updated; maintenance burden | Extract to a shared constants module |
| Medium | `any` type used broadly in axios service | `services/axios/index.ts` (function signatures, return types) | Bypasses TypeScript type safety; errors from malformed responses are undetectable at compile time | Replace with explicit response types or at minimum `unknown` |
| Low | Debug `console.log` statements in production code | `services/axios/index.ts` (`simplePostData` — logs `customHeaders value`, `customBasicAuth value`, `JSON.stringify(responseFromServer.data)`) | Leaks request metadata to CI logs; noisy output | Remove or replace with a proper logger behind a debug flag |
| Low | `vite.config.ts` is empty | vite.config.ts | Unclear purpose; may cause confusion for contributors | [ASK USER] Remove if only present as Vitest peer dependency boilerplate |

### 2) Technical Debt

| Debt item | Why it exists | Where | Risk if ignored | Suggested fix |
|-----------|---------------|-------|-----------------|---------------|
| `any` return types throughout axios service | Written before strict typing was enforced | `services/axios/index.ts` | Type errors from API responses are silently swallowed | Define explicit response types per endpoint |
| Duplicate `rgpvHeaders` | Copy-pasted from axios to cheerio during development | `services/axios/index.ts`, `services/cheerio/index.ts` | Headers drift between the two files | Extract to `services/rgpv/headers.ts` and import in both |
| Hardcoded session cookie | Likely captured from a real browser session as a quick fix | `services/axios/index.ts`, `services/cheerio/index.ts` | RGPV session expiry causes silent data failures | Investigate if the RGPV endpoints require a valid session or accept unauthenticated requests |
| No test suite | Project bootstrapped as a scraping script; tests not prioritised | Entire codebase | Cannot safely refactor or verify behaviour regressions | Start with unit tests for pure functions (retry, env, cheerio selectors) |
| `write_news_alerts.ts` is a large monolithic file | All Google Sheets, deduplication, posting logic co-located | `write_news_alerts.ts` | High cognitive load for changes; difficult to test in isolation | Extract into separate service modules |

### 3) Security Concerns

| Risk | OWASP category | Evidence | Current mitigation | Gap |
|------|----------------|----------|--------------------|-----|
| Secrets injected into `.env` via `echo` in CI | A02 Cryptographic Failures | `.github/workflows/check news alerts.yml` (`echo SPREADSHEET_ID=...`) | GitHub encrypted secrets prevent values from being logged by default | Env file is written to disk in the runner; no explicit cleanup step after job |
| Hardcoded ASP.NET session cookie | A05 Security Misconfiguration | `services/axios/index.ts`, `services/cheerio/index.ts` | Cookie is a session token, not a user credential | Session token committed to repository; could allow impersonation if RGPV session is still valid |
| Committed dummy `credentials.json` | A02 Cryptographic Failures | `credentials.json` | File contains only placeholder values, not real credentials | Real credentials must never be committed; `.gitignore` should exclude `credentials.json` (verify this is the case) |
| No input sanitisation on scraped content | A03 Injection | `write_news_alerts.ts` (`news.content`, `news.url` passed to external APIs) | URLs are encoded with `encodeURI`; content is trimmed | Scraped strings passed to downstream APIs without further sanitisation |
| `timeout: 0` on Puppeteer navigation | A05 Security Misconfiguration | `services/socialMediaShare/index.ts` | None | Unlimited navigation timeout; a hung Zoho page will block the CI job indefinitely up to the 120-minute runner timeout |

### 4) Performance and Scaling Concerns

| Concern | Evidence | Current symptom | Scaling risk | Suggested improvement |
|---------|----------|-----------------|-------------|-----------------------|
| Sequential async for-loops over all programs/semesters | `get_timetable_data.ts`, `get_scheme_data.ts` | Data jobs approach the 45-minute CI timeout | Adding more RGPV programs will push jobs over timeout | Parallelise scrape requests with controlled concurrency (e.g. `p-limit`) |
| Puppeteer `slowMo: 100` | `services/socialMediaShare/index.ts` | Intentional slowdown for reliability | Each social post takes significantly longer than necessary | [ASK USER] Is `slowMo` still needed? Remove once automation is stable |
| Entire news history read on every run | `write_news_alerts.ts` (`readDataFromSheet` called inside per-news loop) | Multiple redundant Sheets API reads per run | As news history grows, Sheets read cost grows linearly | Cache the sheet read result outside the loop |

### 5) Fragile/High-Churn Areas

| Area | Why fragile | Churn signal | Safe change strategy |
|------|-------------|-------------|----------------------|
| `services/socialMediaShare/index.ts` | CSS selector-dependent Puppeteer automation against a third-party UI | Identified in recent commit history as complex area | Wrap selectors in named constants; add screenshot capture on failure for diagnostics |
| `services/axios/index.ts` | RGPV form POST encoding is manually constructed (raw URL-encoded string) | Hardcoded `__VIEWSTATE`, `__VIEWSTATEGENERATOR` values | Validate against live RGPV responses before any change; consider extracting ASP.NET state dynamically |
| `write_news_alerts.ts` | Monolithic file combining scraping, deduplication, Sheets I/O, API posting | Most complex entry point; multi-concern | Extract each concern into a service; test independently |

### 6) `[ASK USER]` Questions

1. [ASK USER] Is the hardcoded `ASP.NET_SessionId` cookie still valid/required for RGPV form endpoints, or is it a leftover from development? Should it be refreshed dynamically?
2. [ASK USER] Does the RGPV website require the static session cookie, or do the form endpoints accept unauthenticated requests?
3. [ASK USER] Is `vite.config.ts` intentionally included (e.g. for future Vite usage), or is it only present as a Vitest peer-dependency artifact and can be removed?
4. [ASK USER] Is `puppeteer`'s `slowMo: 100` still required for Zoho Social reliability, or can it be removed/reduced now that the flow is established?
5. [ASK USER] Is there a Zoho Social REST API available that could replace the Puppeteer browser automation, making the posting pipeline more reliable?
6. [ASK USER] What is the intended test strategy? Should unit tests be added for the service modules, and should the news pipeline be integration-tested with mocked HTTP responses?
7. [ASK USER] Should `credentials.json` be explicitly listed in `.gitignore` to prevent accidental commit of real service account keys?

### 7) Evidence

- services/axios/index.ts (any types, duplicate headers, hardcoded cookie, debug logs)
- services/cheerio/index.ts (duplicate headers, hardcoded cookie)
- services/socialMediaShare/index.ts (selector fragility, slowMo, timeout 0)
- write_news_alerts.ts (monolithic design, repeated Sheets reads)
- vitest.config.ts (passWithNoTests — masks test absence)
- .github/workflows/check news alerts.yml (secret-to-env injection, no cleanup)
- credentials.json (committed dummy; real credentials shape revealed)
