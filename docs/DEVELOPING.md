# Development: lint, tests, CI

## Why this matters

- **ESLint** catches bugs early (unused variables, bad typing habits, Vue/TS patterns) and keeps style consistent. Without lint, technical debt often grows unnoticed.
- **Tests** protect **pure functions** first and API behavior later. Not everything must be E2E immediately: one fast unit test per utility is almost always worth it.
- **CI** (GitHub Actions) runs lint + tests on every push so `main` does not break silently.

## Node version

See `**.nvmrc`** (e.g. Node 24). Before `npm install` / `npm run lint`:

```bash
nvm install   # once, if that version is missing
nvm use
```

Without a suitable Node version, ESLint plugins or `postinstall` can fail (e.g. Node 16 lacks `Object.groupBy`, which modern ESLint tooling expects).

## Commands


| Command                                | Purpose                                                                                                                                                                                                                                             |
| -------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `npm run lint`                         | ESLint across the whole project                                                                                                                                                                                                                     |
| `npm run lint:fix`                     | Apply auto-fixable rules                                                                                                                                                                                                                            |
| `npm run test`                         | Vitest once (CI-friendly)                                                                                                                                                                                                                           |
| `npm run test:watch`                   | Vitest watch mode                                                                                                                                                                                                                                   |
| `npm run verify`                       | Lint + tests + typecheck (recommended before push; matches CI)                                                                                                                                                                                      |
| `npm run typecheck`                    | Nuxt / TypeScript check                                                                                                                                                                                                                             |
| `npm run test:e2e`                     | Production build + Nitro on `127.0.0.1:4275` + Playwright (`dotenv-cli`: `.env` then `.env.e2e`, **no `--override`**) — duplicate keys keep `**.env**`; committed Playwright values in `**.env.e2e**` apply only for keys **not** set in `**.env`** |
| `npm run test:bdd`                     | Production-like BDD run (build + Nitro startup + Cucumber feature execution)                                                                                                                                                                        |
| `npm run test:bdd:local`               | Run Cucumber scenarios against an already-running local app                                                                                                                                                                                         |
| `npm run test:bdd:remote`              | Run Cucumber scenarios against `E2E_BASE_URL` without starting a local server; used by GitHub Actions against PR previews.                                                                                                                          |
| `npm run test:e2e:remote-smoke`        | Playwright smoke against a deployed app. Requires `PLAYWRIGHT_BASE_URL=https://…`; uses `.env.e2e` for seeded demo login credentials and does not start a local Nitro server.                                                                        |
| `npm run test:e2e:remote`              | Full Playwright E2E against `PLAYWRIGHT_BASE_URL` without starting a local server; used by GitHub Actions against PR previews.                                                                                                                      |
| `npm run backfillEngagementAggregates` | Rebuild engagement aggregate tables from raw events (manual/heavy)                                                                                                                                                                                  |


## Test strategy by layer

We treat tests as three explicit layers with different ownership:

- **Unit/component (`npm run test`)**: domain behavior, helper invariants, architectural boundaries, and isolated component interaction contracts.
- **E2E smoke (`npm run test:e2e`)**: app boot, page reachability, setup/auth plumbing, and high-signal integration smoke checks only. Authed `**source-statuses.spec.ts`** exercises `**POST /api/crawler/source-status**` and `**GET /api/source-statuses**` (uses `**NUXT_CRAWLER_API_KEY**` from merged env, e.g. `**.env.e2e**`).
- **Remote E2E smoke (`npm run test:e2e:remote-smoke`)**: same Playwright
  runner, but against `PLAYWRIGHT_BASE_URL` instead of a local Nitro server.
  CI runs only the public a11y smoke and the seeded-user settings/feed smoke
  after Vercel deployment; broader local E2E remains `npm run test:e2e`.
- **Remote PR E2E/BDD**: same-repository PRs deploy an isolated Vercel Preview
  backed by a Neon preview branch, then run `npm run test:e2e:remote` and
  `npm run test:bdd:remote` against that URL. Production/main deployments keep
  the smaller smoke-only gate.
- **BDD (`npm run test:bdd`)**: user-facing feature behavior and guided journeys as the primary executable product specification.

Practical coverage targets:

- **Unit/helpers**: aim for 90-100% on encapsulated utility/domain helpers.
- **E2E smoke/API infrastructure**: aim for 90-100% on smoke-critical routes and setup paths.
- **BDD feature journeys**: aim for 90-100% coverage of supported user-facing core flows.

Use `features/README.md` for BDD authoring conventions and the current prioritized BDD gaps.

### Playwright / E2E auth (`dev@localhost`)

End-to-end tests use a **committed** `.env.e2e` with `DATABASE_URL`, `AUTH_JWT_SECRET`, SRP salt/verifier for `**dev@localhost`**, and `E2E_LOGIN_PASSWORD` (matches the verifier). The default local/E2E password is `dev`.

1. Start Postgres (e.g. Docker Compose from `.env.example`) and ensure `DATABASE_URL` in `.env.e2e` matches.
2. Apply schema and seed: `npx prisma migrate deploy` (or `db:push` in dev), then `**npx prisma db seed**` when you need seed data. For E2E, merge `**.env.e2e**` so `**DEV_SRP_***` are present (e.g. `**dotenv -e .env -e .env.e2e -- npx prisma db seed**` — `.env` wins on conflicts, `.env.e2e` fills missing keys). Plain `**npx prisma db seed**` only loads `**.env**`, so you miss `**DEV_***` unless they are copied into `**.env**`. Prisma 7 does not auto-run seed after migrate; seed is always explicit. `**db:seed**` also inserts eight placeholder feeds for `**dev@localhost**` (one per TopicKnowledgeCrawler `sourceHealthStatus`, URLs under `example.com/seed/source-status/…`) and matching `**source_statuses**` snapshots so `/feeds` shows every health variant locally (`utils/source-status-seed-urls.ts`).
3. Run `**npm run test:e2e**`. `dotenv-cli` injects env for `nuxt build`, the Nitro server, and Playwright (same merge as `**tests/e2e/load-e2e-env.ts**`). The Playwright project `**fresh-setup**` runs `**tests/e2e/fresh-auth.setup.ts**`, registers a new account via SRP, and writes `**tests/e2e/.auth/fresh-user.json**` (gitignored) for the regular `**chromium-authed**` project. The `**setup**` project still writes `**tests/e2e/.auth/dev.json**` for remote smoke / demo-user checks, and `**operator-setup**` writes the seeded operator state. The `**chromium**` project (public a11y smokes) does not need auth, so `**playwright test --project chromium**` does not need seeded users. Full `**test:e2e**`, including authed and operator projects, needs `**DATABASE_URL**`, a reachable DB, merge-seeded demo/operator accounts, and a matching invite code for fresh-account setup. For a non-empty **timeline** in manual tests, run `**npm run devData`** before or alongside E2E; the README's [local try-out path](../README.md#try-it-locally) shows the short setup sequence, and onboarding fixture background is documented in `[docs/archive/26-04-30-onboarding-welcome-timeline.md](./archive/26-04-30-onboarding-welcome-timeline.md)`.

To rotate the dev password: `SRP_GEN_PASSWORD='…' npx tsx scripts/generate-srp-env.ts dev@localhost` (prints `DEV_SRP_*`), update `.env.e2e` and `E2E_LOGIN_PASSWORD`, then re-seed. For the seeded operator account, run the same command with `operator@localhost` to print `OPERATOR_SRP_*`.

**E2E troubleshooting:** If `**auth.setup.ts`** fails with **Prisma “credentials … are not valid”**, Nitro’s `**DATABASE_URL`** (from `**.env**` if set there — it wins over `**.env.e2e**`) does not match your running Postgres. Align `**.env**` (or remove `DATABASE_URL` there so `**.env.e2e**` applies), then `**npx prisma migrate deploy**` and merge-seed as in step 2.

**Note:** `eslint.config.mjs` imports `./.nuxt/eslint.config.mjs`. That file is created by `**nuxt prepare`**, which runs as part of `**postinstall**` (`nuxt prepare && prisma generate`). Without a prior `**npm ci**` / `**npm install**`, `npm run lint` fails — that is expected.

## Resetting the dev server

If you delete `.nuxt/` to troubleshoot a stale cache, always regenerate
Nuxt's virtual modules before starting the dev server:

```bash
./scripts/with-nvm.sh npm run postinstall   # runs `nuxt prepare` then `prisma generate`
./scripts/with-nvm.sh npm run dev
```

Starting `nuxt dev` directly after `rm -rf .nuxt` can surface spurious
`Failed to resolve import "#app-manifest"` errors because Vite begins
pre-transforming Nuxt internals before the virtual module is registered.

## User-facing copy and accessibility

Anything that reaches the user (UI strings, help centre entries, error
messages) follows the house style in
`[CONTENT_AND_A11Y.md](./CONTENT_AND_A11Y.md)`. In short:

- Plain language in the main UI; technical details under
`help.items.*` in `i18n/locales/{de,en}.json`.
- Security / privacy features use `SecurityBadge` and link to a matching
entry in `/help`.
- Keyboard, screen reader and colour-contrast baseline per the reviewer
checklist in that document.

Read it before changing `i18n/locales/*.json`, `pages/help.vue`, or any
user-facing component.

## Habits for healthier code

1. **Before commit:** `npm run verify` (or at least `lint` + `test`).
2. Keep **small, testable helpers** (like `normalizeFeedUrl`) in `server/utils/` — unit tests stay cheap there.
3. **Vue props/types:** prefer typed `defineProps<{ ... }>()` over bare `Object` — ESLint/TS help more reliably (migrate gradually).
4. **Avoid `any`** without a reason — prefer a real type or `unknown` + narrowing.
5. **API routes:** later, test with a setup helper and mocked `prisma`, or integration tests with a test DB — the baseline is in place now.

## Nuxt ESLint module

`[@nuxt/eslint](https://eslint.nuxt.com/)` generates a project-specific **flat config** (ESLint 10 in this repo). Add rules or ignores in `**eslint.config.mjs`** via `withNuxt(...)`.

## Docker / Compose

- `**npm ci` in the Dockerfile** needs a `package-lock.json` committed from a compatible **npm** version. The image runs `**npm install -g npm@11`** so `npm ci` matches lockfiles produced by npm 11 locally; do not run `npm install` before `npm ci` in the Dockerfile (that does not repair an out-of-sync lock and hides the real fix).
- If Compose warns `**The "z" variable is not set**`, a value (often `POSTGRES_PASSWORD`) likely contains `**$z**` (or similar). Use a password without `$`, URL-encode it in a single `DATABASE_URL` in `.env`, or adjust Compose per [variable interpolation](https://docs.docker.com/compose/environment-variables/variable-interpolation/).

## ModSecurity / CRS (operators)

- If you run infl0 behind **ModSecurity + OWASP CRS**, review
`[infl0-exclusion.conf](../infl0-exclusion.conf)`.
- Include it from your **before-CRS** include point (typically
`REQUEST-900-EXCLUSION-RULES-BEFORE-CRS.conf`).
- The host matcher in the helper uses `example.com` on purpose; replace it
with your real public infl0 hostname (optionally with `(?::\d+)?` for ports).
- The helper is intentionally narrow: it fixes method policy for infl0 API
routes (`PATCH` / `DELETE`) and documents how to add endpoint-scoped
`REQUEST_BODY` exclusions for rich-content ingestion (`/api/crawler/ingest`)
using concrete audit-log rule IDs.

## Crawler → infl0 (TopicKnowledgeCrawler / n8n)

- `**GET /api/crawler/sources`** — list active feed `crawlKey`s (deduped) for sync.
- `**POST /api/crawler/ingest**` — article upsert; body includes `crawlKey` + article fields.
- `**POST /api/crawler/source-status**` — same `**NUXT_CRAWLER_API_KEY**` auth; upserts one row per
normalized `crawlKey` into `**source_statuses**` (latest snapshot). Prefer **camelCase** JSON;
**snake_case** keys are also accepted (see `server/utils/source-status-crawler-payload.ts`).
- `**GET /api/source-statuses`** — **session** user only; joins active `UserFeed` rows with
`SourceStatus` for UI (`latest` is `null` until the crawler posts).

## Operator board

- The protected `/operator/sources` view and its API
  (`GET /api/operator/source-statuses`) are gated by the
  `NUXT_OPERATOR_EMAILS` allowlist (Phase 1: env-based, see
  [`OPERATOR.md`](./OPERATOR.md)).
- Server boot prints one line summarising the parsed allowlist
  (`[operator-access] N operator email(s) configured`, plus a warning
  per invalid entry). When the line is missing or warns, fix the env
  before running operator-scoped tests.
- Playwright project **`chromium-operator`** (`playwright.config.ts`)
  uses a dedicated SRP login via `tests/e2e/operator-auth.setup.ts` and
  the seeded `operator@localhost` account from `.env.e2e`
  (`OPERATOR_*` vars); the spec `tests/e2e/authed/operator-sources.spec.ts`
  is excluded from `chromium-authed` so the two roles never share
  storage state.
- BDD scenarios in `features/operator_sources.feature` cover the
  non-operator 403 path and the operator happy path via crawler fixtures
  (`features/steps/operator.steps.js`). The crawler key (`NUXT_CRAWLER_API_KEY`)
  must be set in the merged env.

## Documentation map


| Doc                                        | Role                                                 |
| ------------------------------------------ | ---------------------------------------------------- |
| `[ROADMAP.md](./ROADMAP.md)`               | Vision, idea backlog, technical follow-ups           |
| `[CHANGELOG.md](./CHANGELOG.md)`           | Shipped work (features, fixes, breaking changes)     |
| `[planned/README.md](./planned/README.md)` | Feature packages for implementation planning         |
| `[DEPLOYING.md](./DEPLOYING.md)`           | Vercel/Neon deployments and preview database cleanup |
| `[OPERATOR.md](./OPERATOR.md)`             | In-app operator status board (access, columns, troubleshooting) |
| `[RELEASING.md](./RELEASING.md)`           | GitHub Actions CI and tagging a release              |


## Dependencies and security

- After changing dependencies, run `**npm audit`**; use `**npm audit fix**` to apply compatible upgrades (keeps `package-lock.json` consistent).
- **Nuxt Content** uses `**content.experimental.sqliteConnector: 'native'`** (Node 22.5+) so `nuxt prepare` does not prompt for `better-sqlite3` — better for CI and Docker without native addon builds.
