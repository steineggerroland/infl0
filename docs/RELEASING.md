# Releases (GitHub)

## What runs automatically

- **`CI`** (`.github/workflows/ci.yml`) runs on every push and PR to
  `main`: `npm ci` (which runs **`postinstall`**: `nuxt prepare` then
  `prisma generate`), lint, unit tests, typecheck.
- **`Release`** (`.github/workflows/release.yml`) runs when a **tag** such as
  `v0.2.0` is **pushed**: it creates a **GitHub Release** using that version's
  `docs/CHANGELOG.md` entry as the release description.
- **`Deploy Vercel`** (`.github/workflows/deploy-vercel.yml`) runs on every
  push to `main`, every same-repository PR targeting `main`, and manual
  dispatch. It deploys the Nuxt SSR app to Vercel and seeds the demo account.
- **`Cleanup Preview Database`** (`.github/workflows/cleanup-preview-db.yml`)
  runs when a same-repository PR closes and deletes the matching Neon preview
  branch.

**No** build artifacts are attached — infl0 is typically built yourself
(`npm run build`) and deployed with your own `DATABASE_URL`.
If you later want to attach e.g. `docker build` logs or SBOMs, extend
the release job.

## Deployments

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

## Test gates before tagging

Current CI gate on PR/push includes lint, unit/component tests, and typecheck.
BDD and E2E smoke are currently treated as release-readiness gates run before tagging:

- `npm run test:bdd`
- `npm run test:e2e`

If you decide to promote BDD to a mandatory CI gate, add `npm run test:bdd`
to `.github/workflows/ci.yml` (same Node/env merge assumptions as local runs).

## Cut a first (or next) release

1. On `main` (or a release branch), make sure **CI is green**.
2. Run release-readiness behavior checks:

   ```bash
   npm run test:bdd
   npm run test:e2e
   ```

3. Maintain **`docs/CHANGELOG.md`**: add operator-relevant items under
   `[Unreleased]`; for a release, move them under a new heading
   **`## [0.x.y] — YYYY-MM-DD`** (Keep a Changelog style).
4. Optionally set **`package.json`** → **`version`** to the same Semver
   (without a `v` prefix) so the repo and tag stay aligned.
5. Create and push the tag:

   ```bash
   git tag -a v0.2.0 -m "Release v0.2.0"
   git push origin v0.2.0
   ```

6. Check **Releases** on GitHub; edit the text manually if needed.

**Convention:** tag name = `v` + Semver from `CHANGELOG` / `package.json`.

## Permissions

For private repos: the default `GITHUB_TOKEN` in the action is enough for
releases as long as the workflow permission is **Read and write** for
“Contents”
(Repository → Settings → Actions → General → Workflow permissions).
