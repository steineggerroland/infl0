# Development: lint, tests, CI

## Why this matters

- **ESLint** catches bugs early (unused variables, bad typing habits, Vue/TS patterns) and keeps style consistent. Without lint, technical debt often grows unnoticed.
- **Tests** protect **pure functions** first and API behavior later. Not everything must be E2E immediately: one fast unit test per utility is almost always worth it.
- **CI** (GitHub Actions) runs lint + tests on every push so `main` does not break silently.

## Node version

See **`.nvmrc`** (e.g. Node 24). Before `npm install` / `npm run lint`:

```bash
nvm install   # once, if that version is missing
nvm use
```

Without a suitable Node version, ESLint plugins or `postinstall` can fail (e.g. Node 16 lacks `Object.groupBy`, which modern ESLint tooling expects).

## Commands

| Command | Purpose |
|--------|--------|
| `npm run lint` | ESLint across the whole project |
| `npm run lint:fix` | Apply auto-fixable rules |
| `npm run test` | Vitest once (CI-friendly) |
| `npm run test:watch` | Vitest watch mode |
| `npm run verify` | Lint + tests + typecheck (recommended before push; matches CI) |
| `npm run typecheck` | Nuxt / TypeScript check |
| `npm run test:e2e` | Production build + Nitro on `127.0.0.1:4275` + Playwright (`dotenv-cli`: `.env` then `.env.e2e`, **no `--override`**) — duplicate keys keep **`.env`**; committed Playwright values in **`.env.e2e`** apply only for keys **not** set in **`.env`** |
| `npm run backfillEngagementAggregates` | Rebuild engagement aggregate tables from raw events (manual/heavy) |

### Playwright / E2E auth (`dev@localhost`)

End-to-end tests use a **committed** `.env.e2e` with `DATABASE_URL`, `AUTH_JWT_SECRET`, SRP salt/verifier for **`dev@localhost`**, and `E2E_LOGIN_PASSWORD` (matches the verifier; default password string is documented in `.env.e2e`).

1. Start Postgres (e.g. Docker Compose from `.env.example`) and ensure `DATABASE_URL` in `.env.e2e` matches.
2. Apply schema and seed: `npx prisma migrate deploy` (or `db:push` in dev), then **`npx prisma db seed`** when you need seed data. For E2E, merge **`.env.e2e`** so **`DEV_SRP_*`** are present (e.g. **`dotenv -e .env -e .env.e2e -- npx prisma db seed`** — `.env` wins on conflicts, `.env.e2e` fills missing keys). Plain **`npx prisma db seed`** only loads **`.env`**, so you miss **`DEV_*`** unless they are copied into **`.env`**. Prisma 7 does not auto-run seed after migrate; seed is always explicit.
3. Run **`npm run test:e2e`**. `dotenv-cli` injects env for `nuxt build`, the Nitro server, and Playwright (same merge as **`tests/e2e/load-e2e-env.ts`**). The Playwright project **`setup`** runs **`tests/e2e/auth.setup.ts`**, performs SRP login, and writes **`tests/e2e/.auth/dev.json`** (gitignored). The **`chromium-authed`** project depends on **`setup`**. The **`chromium`** project (public a11y smokes) does not, so **`playwright test --project chromium`** does not need Postgres. Full **`test:e2e`**, including authed projects, needs **`DATABASE_URL`**, a reachable DB, and merge-seeded **`dev@localhost`**. For a non-empty **timeline** in manual or authed tests, run **`npm run devData`** (see [README](../README.md) "Local seed data") before or alongside E2E; a dedicated E2E fixture path is planned in [`docs/planned/onboarding-welcome-timeline.md`](./planned/onboarding-welcome-timeline.md).

To rotate the dev password: `SRP_GEN_PASSWORD='…' npx tsx scripts/generate-srp-env.ts dev@localhost` (prints `DEV_SRP_*`), update `.env.e2e` and `E2E_LOGIN_PASSWORD`, then re-seed.

**E2E troubleshooting:** If **`auth.setup.ts`** fails with **Prisma “credentials … are not valid”**, Nitro’s **`DATABASE_URL`** (from **`.env`** if set there — it wins over **`.env.e2e`**) does not match your running Postgres. Align **`.env`** (or remove `DATABASE_URL` there so **`.env.e2e`** applies), then **`npx prisma migrate deploy`** and merge-seed as in step 2.

**Note:** `eslint.config.mjs` imports `./.nuxt/eslint.config.mjs`. That file is created by **`nuxt prepare`**, which runs at the end of **`postinstall`** (`prisma generate && nuxt prepare`). Without a prior **`npm ci`** / **`npm install`**, `npm run lint` fails — that is expected.

## Resetting the dev server

If you delete `.nuxt/` to troubleshoot a stale cache, always regenerate
Nuxt's virtual modules before starting the dev server:

```bash
./scripts/with-nvm.sh npm run postinstall   # runs `prisma generate` then `nuxt prepare`
./scripts/with-nvm.sh npm run dev
```

Starting `nuxt dev` directly after `rm -rf .nuxt` can surface spurious
`Failed to resolve import "#app-manifest"` errors because Vite begins
pre-transforming Nuxt internals before the virtual module is registered.

## User-facing copy and accessibility

Anything that reaches the user (UI strings, help centre entries, error
messages) follows the house style in
[`CONTENT_AND_A11Y.md`](./CONTENT_AND_A11Y.md). In short:

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

[`@nuxt/eslint`](https://eslint.nuxt.com/) generates a project-specific **flat config** (ESLint 10 in this repo). Add rules or ignores in **`eslint.config.mjs`** via `withNuxt(...)`.

## Docker / Compose

- **`npm ci` in the Dockerfile** needs a `package-lock.json` committed from a compatible **npm** version. The image runs **`npm install -g npm@11`** so `npm ci` matches lockfiles produced by npm 11 locally; do not run `npm install` before `npm ci` in the Dockerfile (that does not repair an out-of-sync lock and hides the real fix).
- If Compose warns **`The "z" variable is not set`**, a value (often `POSTGRES_PASSWORD`) likely contains **`$z`** (or similar). Use a password without `$`, URL-encode it in a single `DATABASE_URL` in `.env`, or adjust Compose per [variable interpolation](https://docs.docker.com/compose/environment-variables/variable-interpolation/).

## Documentation map

| Doc | Role |
|-----|------|
| [`ROADMAP.md`](./ROADMAP.md) | Vision, idea backlog, technical follow-ups |
| [`CHANGELOG.md`](./CHANGELOG.md) | Shipped work (features, fixes, breaking changes) |
| [`planned/README.md`](./planned/README.md) | Feature packages for implementation planning |
| [`RELEASING.md`](./RELEASING.md) | GitHub Actions CI + tagging a release |

## Dependencies and security

- After changing dependencies, run **`npm audit`**; use **`npm audit fix`** to apply compatible upgrades (keeps `package-lock.json` consistent).
- **Nuxt Content** uses **`content.experimental.sqliteConnector: 'native'`** (Node 22.5+) so `nuxt prepare` does not prompt for `better-sqlite3` — better for CI and Docker without native addon builds.
