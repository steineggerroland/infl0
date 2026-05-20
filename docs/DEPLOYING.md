# Deployments

## Operating requirements

infl0 is a Nuxt SSR app backed by PostgreSQL. A small deployment needs:

- **Runtime:** Node 24 or a compatible SSR host for the Nuxt/Nitro server.
- **Database:** PostgreSQL for users, source subscriptions, article metadata,
  preferences, timeline rows, and reading state.
- **Required environment:** `DATABASE_URL` and `AUTH_JWT_SECRET`.
- **Optional environment:** `NUXT_REGISTRATION_INVITE_CODE` enables
  invite-code registration, `NUXT_CRAWLER_API_KEY` protects crawler
  endpoints (**`/api/crawler/ingest`**, **`/api/crawler/source-status`**, **`/api/crawler/sources`**)
  and the periodic timeline rescore endpoint
  (**`/api/cron/recompute-timeline-scores`**, headers `X-Crawler-Key`,
  `x-infl0-cron-key`, or `Authorization: Bearer ...`), and
  `NUXT_OPERATOR_EMAILS` gates the operator status board
  (**`/operator/sources`**, **`/api/operator/source-statuses`**) by
  comma-separated email allowlist. Empty / unset ⇒ operator routes return
  `403` for everyone; the server prints the parsed allowlist size and any
  invalid entries once at boot. See [`OPERATOR.md`](./OPERATOR.md) for the
  access model, columns, filters, and troubleshooting.
- **Seeded operator accounts (optional):** `prisma db seed` can also create a
  dedicated operator account via `OPERATOR_SEED_EMAIL` / `OPERATOR_SEED_NAME`
  (+ SRP salt/verifier envs). To grant access, include that email in
  `NUXT_OPERATOR_EMAILS`.
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
runs Prisma migrations, then seeds two demo accounts plus sample articles so
both demo logins work out of the box:

| Email | Password | Role |
|-------|----------|------|
| `dev@localhost` | `dev` | regular user (2 sample feeds + 3 articles via `npm run devData`) |
| `operator@localhost` | `dev` | operator (granted by `NUXT_OPERATOR_EMAILS=operator@localhost` on the deployment) |

Seed mechanics:

1. `npx dotenv -e .env.e2e -- npx prisma db seed` upserts both users with
   the committed `.env.e2e` SRP pairs plus the `dev@localhost`
   source-health matrix. Both committed demo SRP pairs match password
   `dev`.
2. `npx dotenv -e .env.e2e -- npm run devData` adds the article /
   timeline fixtures for `dev@localhost`.

The seed runs **on every deployment**, including production, because this
repository is intended as a demo / playground instance. For a non-demo
production, add a `NUXT_OPERATOR_EMAILS` GitHub Actions secret (comma-separated
real operator emails) to override the demo allowlist, and rotate the seed
passwords by regenerating the `DEV_SRP_*` and `OPERATOR_SRP_*` pairs in
`.env.e2e` (see [`OPERATOR.md`](./OPERATOR.md) → *Demo / preview
deployments*).

Repository setup required once:

1. Create or connect a Vercel project on the Hobby plan and a Neon Postgres
   project on the Free plan.
2. Add these GitHub Actions secrets: `VERCEL_TOKEN`, `VERCEL_ORG_ID`,
   `VERCEL_PROJECT_ID`, `NEON_API_KEY`, `PRODUCTION_DATABASE_URL`, and
   `AUTH_JWT_SECRET`.
3. Add the GitHub Actions variable `NEON_PROJECT_ID`.
4. Optionally add `NUXT_REGISTRATION_INVITE_CODE` and `NUXT_CRAWLER_API_KEY`
   as GitHub Actions secrets if those flows should work on deployed previews.
5. Optionally add `NUXT_OPERATOR_EMAILS` as a GitHub Actions secret to
   override the demo allowlist (`operator@localhost`) with real operator
   emails for a non-demo production deployment.

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
