# Package: CI remote E2E smoke strategy

## Status

Draft

## Goal

Define a reliable strategy to run smoke-level E2E checks in CI against a real,
reachable app environment, without depending on fragile local runner setup.

Target outcome: predictable release confidence with practical runtime and
maintenance cost.

## Non-goals

- Migrating the full BDD suite into browser E2E.
- Building a complete deployment platform redesign in this package.
- Forcing all smoke tests into PR gates before environment constraints are solved.

## Dependencies

- Deployment target for CI-accessible app instances (preview/staging/remote app).
- CI secrets and environment variable management.
- Smoke-test scope agreement (which checks are mandatory where).

## Acceptance criteria

1. A documented decision exists for where smoke E2E runs (PR preview, staging,
   nightly, release gate, or split model).
2. Required environment constraints and secrets are documented so runs are
   reproducible.
3. Clear gating policy is defined (what blocks PRs, what blocks releases, what
   runs best-effort/nightly).
4. Initial workflow update proposal is captured with rollback plan.

## Implementation notes

- Evaluate at least two practical options (e.g. preview-per-PR vs staging/nightly).
- Keep smoke scope intentionally small and high-signal.
- Rollback path should allow reverting to current CI gates quickly.

## Links

- PR:
- Discussion:
