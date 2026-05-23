# Package: CI remote E2E smoke strategy

## Status

Done (2026-05-21)

## Goal

Define and implement a reliable first remote smoke strategy that checks a real
deployed infl0 instance without migrating the full BDD/E2E suite into CI.

## Decision

Remote browser tests run **after Vercel deployment**:

- same-repository PRs deploy to Vercel Preview + isolated Neon preview DB;
- pushes to `main` deploy to production;
- manual deployment dispatches also run smoke;
- fork PRs skip deploy and therefore skip remote smoke because repository
  secrets are unavailable.

This keeps the classic `CI` workflow fast and local (`lint`, unit/component
tests, typecheck) while giving deployed previews real browser checks before
merge decisions.

## Implemented

- Added `playwright.remote-smoke.config.ts`.
- Added `npm run test:e2e:remote-smoke`.
- Added `npm run test:e2e:remote` and `npm run test:bdd:remote`.
- Exposed the Vercel deployment URL as a `deploy` job output.
- Added `remote-smoke`, `remote-e2e-pr`, and `remote-bdd-pr` jobs to
  `.github/workflows/deploy-vercel.yml`.
- Switched the regular Playwright `chromium-authed` project to a fresh SRP
  registration setup (`tests/e2e/fresh-auth.setup.ts`) instead of the seeded
  demo user.
- Documented operating and release policy in `DEPLOYING.md`, `DEVELOPING.md`,
  and `RELEASING.md`.

## Smoke Scope

Production/main smoke is intentionally small:

- public a11y/page-load smoke for `/`, `/help`, and `/login`;
- SRP login using seeded `dev@localhost` / `dev`;
- authenticated settings and feeds landmark checks.

Same-repository PR previews additionally run:

- full Playwright E2E against `PLAYWRIGHT_BASE_URL`;
- full Cucumber BDD against `E2E_BASE_URL`.

Audit result: BDD registers fresh accounts per scenario. Playwright now uses a
fresh account for regular authed specs; operator specs still use the seeded
operator because operator access is allowlist-based. Production avoids full
tests because full suites add/remove feeds, ingest content, post crawler
status, and mutate reader/settings state.

## Gating Policy

- PR preview smoke, full E2E, and BDD are part of the deploy workflow status
  for same-repository PRs and should be green before merge.
- `main` remote smoke runs after production deploy; a failure marks the
  workflow red and blocks release tagging until investigated.
- Remote tests do not roll back an already-created Vercel deployment.

## Rollback

Revert the `remote-smoke` job and `outputs.url` addition in
`.github/workflows/deploy-vercel.yml`. The existing deployment, CI, and release
workflows continue to work without the remote smoke script/config.

## Links

- Workflow: `.github/workflows/deploy-vercel.yml`
- Config: `playwright.remote-smoke.config.ts`
