# Codex project notes

These notes mirror the always-on Cursor rules in `.cursor/rules/` and are
intended as the fast entry point for Codex sessions.

## Git

- Do not commit or push unless the user explicitly asks for it.
- Before editing, assume the worktree may contain user changes. Do not revert
  unrelated changes.

## Runtime: Node, npm, npx

- This repository pins Node.js in `.nvmrc` (currently Node 24). Before running
  any Node-based project command, load that version with `nvm use`.
- This applies to `node`, `npm`, `npx`, `nuxt`, `eslint`, `vitest`,
  `playwright`, Prisma commands, installs, and lockfile-changing commands.
- Do not diagnose lint, test, install, or postinstall failures from the system
  Node version. Homebrew Node 16 is too old for this toolchain; ESLint and
  related packages expect Node 24.

Preferred command pattern from the repo root:

```bash
zsh -lc 'source ~/.nvm/nvm.sh && nvm use && <command>'
```

When available, this repo helper is also acceptable:

```bash
./scripts/with-nvm.sh npm run lint
./scripts/with-nvm.sh npx prisma migrate dev
```

If `nvm` is missing, do not run `npm install`, `npm ci`, `npm update`, `npx`, or
other commands that mutate `node_modules` or `package-lock.json`. Ask the user
to run them with their local `nvm use` setup.

Read-only checks such as inspecting files or `node -v` are fine, but project
commands should still use `.nvmrc`.

## Code Design

- Prefer small, named units over long functions.
- Name things by domain intent, not mechanics. Avoid vague buckets such as
  generic `helpers` when a domain/screen/task name exists.
- Keep side effects at the edges: DB, HTTP, Nuxt/Nitro, filesystem, and UI
  adapters. Keep core logic pure where practical.
- Prefer explicit data flow over hidden globals or implicit coupling.
- Use meaningful domain errors or typed outcomes; never swallow failures.

## DDD Language

- Use the product language consistently across UI, tests, code, and docs:
  examples include `Engagement`, `TimelineScore`, `Source`, `Reader`,
  `Inflow`, `Return Context`, and `Operator`.
- Separate concerns:
  - Domain logic: deterministic helpers/services.
  - Application layer: orchestration, validation, mapping.
  - Infrastructure: DB, HTTP, framework adapters.
- Prefer domain types and small value objects over stringly typed plumbing.

## Testing Strategy

- Behavior-first: tests should protect user-visible behavior and domain
  invariants, not incidental implementation.
- Unit tests cover pure domain helpers and decision logic.
- Component tests cover isolated UI behavior, interaction, ARIA, and focus.
- BDD/Cucumber is the executable product specification for journeys and
  persona expectations.
- Playwright E2E is smoke/API/infrastructure coverage. Do not put detailed UI
  interaction behavior there when it belongs in BDD.

Avoid brittle tests that assert exact Tailwind classes, private component
structure, internal watchers, composable wiring, or source-string scans. If a
test would fail on a harmless refactor that preserves behavior, it is probably
too technical.

Technical/architectural tests are acceptable only for explicit constraints
that cannot be expressed as user behavior, such as API auth boundaries, SSR
deadlock risks, or forbidden cross-layer coupling. Keep them minimal and state
why the constraint must be structural.

For Playwright and accessibility:

- Prefer user-path checks: keyboard navigation, focus movement, dialog
  open/close, and screen-reader-relevant state.
- Prefer behavioral reduced-motion checks over CSS selector assertions.

## Cursor Cloud specific instructions

### Services overview

| Service | How to start | Notes |
|---------|-------------|-------|
| PostgreSQL 16 | `docker compose up -d postgres` | Must be running before the app or any test suite |
| Nuxt dev server | `npm run dev` (with `.env` sourced) | Runs at `http://127.0.0.1:3000`; requires `DATABASE_URL` and `AUTH_JWT_SECRET` |

### Environment setup

- Docker must be running before `docker compose up -d postgres`. In Cloud Agent
  VMs, start the daemon with `sudo dockerd &>/tmp/dockerd.log &` and
  `sudo chmod 666 /var/run/docker.sock` if needed.
- `.env` is created from `.env.example`. To avoid `.env` empty values masking
  `.env.e2e` defaults during E2E tests, comment out (rather than leave empty)
  any key you want `.env.e2e` to supply: `DEV_SRP_SALT_HEX`,
  `DEV_SRP_VERIFIER_HEX`, `OPERATOR_SRP_SALT_HEX`, `OPERATOR_SRP_VERIFIER_HEX`,
  `E2E_LOGIN_PASSWORD`, `OPERATOR_LOGIN_PASSWORD`. The `dotenv-cli` used by
  `test:e2e` / `test:bdd` does **not** override earlier files.
- Before running any npm/npx command, activate Node 24:
  `export NVM_DIR="${NVM_DIR:-$HOME/.nvm}" && . "$NVM_DIR/nvm.sh" && nvm use`

### Running tests and lint

Standard commands from `package.json` (see also `docs/DEVELOPING.md`):

- **Lint**: `npm run lint`
- **Unit tests**: `npm run test` (Vitest, 487 tests)
- **Typecheck**: `npm run typecheck`
- **Full verify**: `npm run verify` (lint + test + typecheck)
- **E2E**: `npm run test:e2e` (builds, starts Nitro on :4275, runs Playwright)
- **BDD**: `npm run test:bdd` (builds, starts Nitro on :4275, runs Cucumber)

### Database seeding

- `npx prisma migrate deploy` applies the schema.
- For dev data (sample feeds/articles for manual testing): source `.env` then
  `npm run devData`.
- For E2E seed users with SRP credentials: `npx dotenv -e .env -e .env.e2e -- npx prisma db seed`.
  Make sure the shell does not already export empty SRP vars, or `unset` them first.

### Known caveats

- The `[chromium-onboarding] welcome.spec.ts` test may fail because
  fresh-registered users are redirected to `/inflow/onboarding/intro` instead
  of the inline onboarding expected by the assertion. This is a pre-existing
  test/code mismatch, not an environment issue.
- `devData` and Prisma seed scripts need `DATABASE_URL` in the process
  environment (they do not auto-load `.env`). Either `source .env` before
  running or use `dotenv -e .env --`.
