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

Without a suitable Node version, ESLint plugins or `postinstall` can fail (e.g. Node 16 lacks `Object.groupBy`, which ESLint 9 tooling expects).

## Commands

| Command | Purpose |
|--------|--------|
| `npm run lint` | ESLint across the whole project |
| `npm run lint:fix` | Apply auto-fixable rules |
| `npm run test` | Vitest once (CI-friendly) |
| `npm run test:watch` | Vitest watch mode |
| `npm run verify` | Lint + tests + typecheck (recommended before push; matches CI) |
| `npm run typecheck` | Nuxt / TypeScript check |

**Note:** `eslint.config.mjs` imports `./.nuxt/eslint.config.mjs`. That file is created by **`nuxt prepare`** (runs on `npm install` as `postinstall`). Without a prior `npm install`, `npm run lint` fails — that is expected.

## Habits for healthier code

1. **Before commit:** `npm run verify` (or at least `lint` + `test`).
2. Keep **small, testable helpers** (like `normalizeFeedUrl`) in `server/utils/` — unit tests stay cheap there.
3. **Vue props/types:** prefer typed `defineProps<{ ... }>()` over bare `Object` — ESLint/TS help more reliably (migrate gradually).
4. **Avoid `any`** without a reason — prefer a real type or `unknown` + narrowing.
5. **API routes:** later, test with a setup helper and mocked `prisma`, or integration tests with a test DB — the baseline is in place now.

## Nuxt ESLint module

[`@nuxt/eslint`](https://eslint.nuxt.com/) generates a project-specific **flat config** (ESLint 9). Add rules or ignores in **`eslint.config.mjs`** via `withNuxt(...)`.

## Docker / Compose

- **`npm ci` in the Dockerfile** needs a `package-lock.json` committed from a compatible **npm** version. The image runs **`npm install -g npm@11`** so `npm ci` matches lockfiles produced by npm 11 locally; do not run `npm install` before `npm ci` in the Dockerfile (that does not repair an out-of-sync lock and hides the real fix).
- If Compose warns **`The "z" variable is not set`**, a value (often `POSTGRES_PASSWORD`) likely contains **`$z`** (or similar). Use a password without `$`, URL-encode it in a single `DATABASE_URL` in `.env`, or adjust Compose per [variable interpolation](https://docs.docker.com/compose/environment-variables/variable-interpolation/).

## Dependencies and security

- After changing dependencies, run **`npm audit`**; use **`npm audit fix`** to apply compatible upgrades (keeps `package-lock.json` consistent).
- **Nuxt Content** uses **`content.experimental.sqliteConnector: 'native'`** (Node 22.5+) so `nuxt prepare` does not prompt for `better-sqlite3` — better for CI and Docker without native addon builds.
