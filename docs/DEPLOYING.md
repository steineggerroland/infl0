# Deployments

## Operating requirements

infl0 is a Nuxt SSR app backed by PostgreSQL. A small deployment needs:

- **Runtime:** Node 24 or a compatible SSR host for the Nuxt/Nitro server.
- **Database:** PostgreSQL for users, source subscriptions, article metadata,
  preferences, timeline rows, and reading state.
- **Required environment:** `DATABASE_URL` and `AUTH_JWT_SECRET`.
- **Optional environment:** `NUXT_REGISTRATION_INVITE_CODE` enables
  invite-code registration, and `NUXT_CRAWLER_API_KEY` protects crawler
  ingestion endpoints.
- **Expected load:** currently sized and tested for personal or small-group
  use. Treat larger public instances as unmeasured until database, crawler,
  and serverless/runtime limits are observed under real traffic.

See [`.env.example`](../.env.example) and [`docker-compose.yaml`](../docker-compose.yaml)
for the local/prod-like configuration shape.

## What runs automatically

- **`Deploy Vercel`** (`.github/workflows/deploy-vercel.yml`) runs on every
  push to `main`, every same-repository PR targeting `main`, and manual
  dispatch. It deploys the Nuxt SSR app to Vercel and seeds the demo account.
- **`Cleanup Preview Database`** (`.github/workflows/cleanup-preview-db.yml`)
  runs when a same-repository PR closes and deletes the matching Neon preview
  branch.

## Vercel + Neon

The `Deploy Vercel` workflow publishes the Nuxt SSR app to Vercel for every
`main` push and for pull requests targeting `main`. PRs get a Vercel Preview
Deployment backed by an isolated Neon Postgres branch named
`preview-pr-<number>`; `main` uses the production database URL. Each deployment
runs Prisma migrations and seeds the demo account `dev@localhost` with password
`dev`.

Repository setup required once:

1. Create or connect a Vercel project on the Hobby plan and a Neon Postgres
   project on the Free plan.
2. Add these GitHub Actions secrets: `VERCEL_TOKEN`, `VERCEL_ORG_ID`,
   `VERCEL_PROJECT_ID`, `NEON_API_KEY`, `PRODUCTION_DATABASE_URL`, and
   `AUTH_JWT_SECRET`.
3. Add the GitHub Actions variable `NEON_PROJECT_ID`.
4. Optionally add `NUXT_REGISTRATION_INVITE_CODE` and `NUXT_CRAWLER_API_KEY`
   as GitHub Actions secrets if those flows should work on deployed previews.

The workflow skips external fork PRs because GitHub does not expose repository
secrets to them. A separate cleanup workflow deletes the matching Neon preview
branch when a PR closes; the main database is never deleted by automation.

Free-tier notes: Vercel Hobby is intended for personal, non-commercial projects,
and Neon Free has resource limits. See the official docs for
[Vercel Hobby](https://vercel.com/docs/plans/hobby),
[Neon pricing](https://neon.com/pricing),
[Neon create-branch-action](https://github.com/neondatabase/create-branch-action),
and
[Neon delete-branch-action](https://github.com/neondatabase/delete-branch-action).
