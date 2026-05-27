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
  `NUXT_OPERATOR_USERNAMES` gates the operator status board
  (**`/operator/sources`**, **`/api/operator/source-statuses`**) by
  comma-separated username allowlist. Empty / unset ⇒ operator routes return
  `403` for everyone; the server prints the parsed allowlist size and any
  invalid entries once at boot. See [`OPERATOR.md`](./OPERATOR.md) for the
  access model, columns, filters, and troubleshooting.
- **Transactional email (recovery OTP):** when users verify a recovery address
  in **Settings → Account** or request **Forgot password** on the login page,
  infl0 **sends outbound plain-text email** with a six-digit one-time code.
  This is **not optional** for those flows to work: set **`NUXT_SMTP_HOST`**,
  **`NUXT_SMTP_USER`**, and **`NUXT_SMTP_PASS`** on every deployment where
  recovery should be available. Without SMTP, the API rejects the request and
  **no mail is sent**. Optional tuning: `NUXT_EMAIL_OTP_TTL_SECONDS`,
  `NUXT_EMAIL_OTP_RESEND_COOLDOWN_SECONDS`, and
  `NUXT_PUBLIC_EMAIL_OTP_RESEND_COOLDOWN_SECONDS` (UI resend countdown). See
  [Transactional email (recovery OTP)](#transactional-email-recovery-otp) below.
- **Seeded operator accounts (optional):** `prisma db seed` creates `dev` and
  `operator` via `DEV_SEED_USERNAME` / `OPERATOR_SEED_USERNAME` (+ SRP envs).
  To grant operator access, include the operator username in
  `NUXT_OPERATOR_USERNAMES`.
- **Expected load:** currently sized and tested for personal or small-group
  use. Treat larger public instances as unmeasured until database, crawler,
  and serverless/runtime limits are observed under real traffic.

See [`.env.example`](../.env.example) and [`docker-compose.yaml`](../docker-compose.yaml)
for the local/prod-like configuration shape.

## Transactional email (recovery OTP)

Recovery email verification and password reset depend on **outbound SMTP**.
infl0 sends **plain-text transactional mail** (six-digit OTP codes) when:

- a signed-in user requests verification for a recovery address in Settings, or
- a visitor starts **Forgot password** on the login page (verified recovery
  email required).

**Operators must configure SMTP** on any instance where these user flows should
work. If `NUXT_SMTP_HOST`, `NUXT_SMTP_USER`, or `NUXT_SMTP_PASS` is missing or
wrong, the recovery API returns an error and **no email is sent**.

| Variable | Required | Purpose |
|----------|:--------:|---------|
| `NUXT_SMTP_HOST` | yes | SMTP server; optional `:port` (default TLS port `465`) |
| `NUXT_SMTP_USER` | yes | SMTP auth user; also used as the From address |
| `NUXT_SMTP_PASS` | yes | SMTP password |
| `NUXT_EMAIL_OTP_TTL_SECONDS` | no | Code validity (default 600) |
| `NUXT_EMAIL_OTP_RESEND_COOLDOWN_SECONDS` | no | Minimum seconds between sends per email (default 60) |
| `NUXT_PUBLIC_EMAIL_OTP_RESEND_COOLDOWN_SECONDS` | no | UI resend countdown; should match server cooldown |

Privacy / abuse notes: codes are single-use, hashed server-side, and rate-limited.
Do not point SMTP at a shared mailbox unless you accept that recovery traffic
will deliver there. For local BDD with real mail, see [`DEVELOPING.md`](./DEVELOPING.md).

## What runs automatically

- **`Deploy Vercel`** (`.github/workflows/deploy-vercel.yml`) runs on every
  push to `main`, every same-repository PR targeting `main`, and manual
  dispatch. It deploys the Nuxt SSR app to Vercel, seeds the demo account,
  and then runs the remote Playwright smoke job against the deployed URL.
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

| Username | Password | Role |
|----------|----------|------|
| `dev` | `dev` | regular user (2 sample feeds + 3 articles via `npm run devData`) |
| `operator` | `dev` | operator (granted by `NUXT_OPERATOR_USERNAMES=operator` on the deployment) |

Seed mechanics:

1. `npx dotenv -e .env.e2e -- npx prisma db seed` upserts both users with
   the committed `.env.e2e` SRP pairs plus the `dev` source-health matrix.
   Both committed demo SRP pairs match password `dev`.
2. `npx dotenv -e .env.e2e -- npm run devData` adds the article /
   timeline fixtures for `dev`.

The seed runs **on every deployment**, including production, because this
repository is intended as a demo / playground instance. For a non-demo
production, add a `NUXT_OPERATOR_USERNAMES` GitHub Actions secret (comma-separated
real operator usernames) to override the demo allowlist, and rotate the seed
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
5. Optionally add `NUXT_OPERATOR_USERNAMES` as a GitHub Actions secret to
   override the demo allowlist (`operator`) with real operator usernames
   for a non-demo production deployment.

The workflow skips external fork PRs because GitHub does not expose repository
secrets to them. A separate cleanup workflow deletes the matching Neon preview
branch when a PR closes; the main database is never deleted by automation.

## Remote tests after deployment

The `Deploy Vercel` workflow exposes the final Vercel URL as a job output. A
follow-up `remote-smoke` job installs Chromium and runs:

```bash
PLAYWRIGHT_BASE_URL=<deployed-url> npm run test:e2e:remote-smoke
```

Scope is intentionally small and high-signal:

- public app shell / accessibility smoke (`/`, `/help`, `/login`);
- seeded `dev` login through SRP setup;
- authenticated settings and feeds landmark checks.

The smoke job runs for same-repository PR previews, pushes to `main`, and
manual deployment dispatches. Fork PRs skip deployment and therefore skip
remote tests.

For same-repository PR previews, two additional jobs run against the same
isolated Vercel + Neon preview instance:

```bash
PLAYWRIGHT_BASE_URL=<deployed-url> npm run test:e2e:remote
E2E_BASE_URL=<deployed-url> npm run test:bdd:remote
```

These full remote gates intentionally do **not** run on production/main
deployments. They register fresh test accounts, add/remove sources, post
crawler status, ingest content, and mutate reader/settings state. That is
appropriate on the disposable PR Neon branch, but too noisy for production.

The smoke/full-test results are part of the deployment workflow status. A
failing smoke or PR remote test does not roll back an already-created Vercel
deployment, but it marks the workflow red and should block merging or release
tagging until investigated.

Free-tier notes: Vercel Hobby is intended for personal, non-commercial projects,
and Neon Free has resource limits. See the official docs for
[Vercel Hobby](https://vercel.com/docs/plans/hobby),
[Neon pricing](https://neon.com/pricing),
[Neon create-branch-action](https://github.com/neondatabase/create-branch-action),
and
[Neon delete-branch-action](https://github.com/neondatabase/delete-branch-action).
