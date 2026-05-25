# Package: BDD persona coverage wave 3 — remaining privacy and power workflows

## Status

Draft

## Goal

Fill the remaining persona-led BDD gaps after the existing suite migration:
deeper privacy confidence, richer active-reader / episode workflows, and
power-reader adjustments that are still intentionally `@pending`.

## Non-goals

- Repeating New User onboarding coverage from wave 1.
- Testing implementation internals or database state directly.
- Turning every settings option into a persona scenario.

## Dependencies

- Wave 1 New User / Screenplay foundation.
- Wave 2 migration of shared flows into reusable Screenplay Tasks and Questions
  for existing behavior.
- Stable privacy, tracking, personalization, source-management, and shortcut
  UI behavior.

## Acceptance criteria

1. Priya's remaining scenarios cover passive open without unwanted engagement
   and useful explanation of personalization signals after opt-in.
2. Robin's remaining scenarios cover episode dialog keyboard/tab behavior and
   mid-session reading-control changes.
3. Sam's remaining scenarios cover source weighting and focused working sets
   once those product affordances are ready.
4. Scenarios use named actors and shared Screenplay Tasks / Questions.
5. Product gaps discovered during scenario authoring are either implemented or
   represented as `@pending` with a one-line rationale.
6. `npm run test:bdd` stays green for all non-pending scenarios.

## Implementation notes

- Favor end-to-end user intent over duplicating existing low-level settings or
  reader assertions.
- Use API setup only for external-system fixtures such as crawler ingest; avoid
  direct database access.
- Update `features/README.md` gaps as scenarios move from planned to covered.

## Links

- PR:
- Discussion:
