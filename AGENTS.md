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

## Session Workflow

- Before presenting code, always run `npm run check` (lint --quiet + vitest dot
  reporter + typecheck). This is fast (~4s) and quiet.
- `test:bdd` and `test:e2e` use `build:quiet` (suppressed output, errors only)
  and `start-server-and-test --silent` for a calm run. Cucumber uses the
  `progress` formatter (from `cucumber.mjs`). Playwright uses `list` reporter.
- Vue/i18n console warnings are suppressed in vitest by a setup file; other
  warnings are sanitized before logging (`tests/setup/sanitize-console-warnings.ts`).
- `npm run check` includes: `eslint . --quiet` → `vitest run --reporter dot` →
  `nuxi typecheck`.
