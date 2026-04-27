# Releases (GitHub)

## What runs automatically

- **`CI`** (`.github/workflows/ci.yml`) runs on every push and PR to
  `main`: `npm ci` (which runs **`postinstall`**: `nuxt prepare` then
  `prisma generate`), lint, unit tests, typecheck.
- **`Release`** (`.github/workflows/release.yml`) runs when a **tag** such as
  `v0.2.0` is **pushed**: it creates a **GitHub Release** using that version's
  `docs/CHANGELOG.md` entry as the release description.

**No** build artifacts are attached — infl0 is typically built yourself
(`npm run build`) and deployed with your own `DATABASE_URL`.
If you later want to attach e.g. `docker build` logs or SBOMs, extend
the release job.

## Cut a first (or next) release

1. On `main` (or a release branch), make sure **CI is green**.
2. Maintain **`docs/CHANGELOG.md`**: add operator-relevant items under
   `[Unreleased]`; for a release, move them under a new heading
   **`## [0.x.y] — YYYY-MM-DD`** (Keep a Changelog style).
3. Optionally set **`package.json`** → **`version`** to the same Semver
   (without a `v` prefix) so the repo and tag stay aligned.
4. Create and push the tag:

   ```bash
   git tag -a v0.2.0 -m "Release v0.2.0"
   git push origin v0.2.0
   ```

5. Check **Releases** on GitHub; edit the text manually if needed.

**Convention:** tag name = `v` + Semver from `CHANGELOG` / `package.json`.

## Permissions

For private repos: the default `GITHUB_TOKEN` in the action is enough for
releases as long as the workflow permission is **Read and write** for
“Contents”
(Repository → Settings → Actions → General → Workflow permissions).
