# Package: BDD persona coverage wave 1

## Status

Draft

## Goal

Expand behavioral coverage around three core personas so product behavior is
specified from user perspective, not technical implementation detail:

- new user
- privacy-sensitive user
- power user

Create a first prioritized BDD wave that improves confidence in real usage
paths and complements existing smoke E2E checks.

## Non-goals

- 100% persona coverage in one package.
- Replacing all existing unit/component tests.
- Defining every future BDD scenario upfront.

## Dependencies

- Existing Cucumber setup in `features/**/*.feature` and `features/**/*.js`.
- Stable selectors and deterministic onboarding/auth test context.
- Product decisions from onboarding completion/return-context package.

## Acceptance criteria

1. For each of the three personas, at least 2-4 meaningful scenarios are
   specified in feature files with clear user outcome.
2. Shared steps remain reusable; duplication across persona scenarios is reduced.
3. Scenario wording remains product-facing and language-consistent.
4. Added scenarios run green in `test:bdd` (or explicitly marked pending with
   rationale if blocked by open product decisions).

## Implementation notes

- Prefer scenario depth over raw scenario count.
- Keep files organized by user goal/domain, not by UI component.
- Track remaining BDD gaps in `features/README.md`.

## Links

- PR:
- Discussion:
