# Package: BDD persona coverage wave 3 — Privacy and Power User personas

## Status

Draft

## Goal

Add persona-led BDD coverage for privacy-sensitive and power-reader workflows,
building on the Screenplay Tasks and Questions extracted in wave 2.

## Non-goals

- Repeating New User onboarding coverage from wave 1.
- Testing implementation internals or database state directly.
- Turning every settings option into a persona scenario.

## Dependencies

- Wave 1 New User / Screenplay foundation.
- Wave 2 migration of shared flows into reusable Screenplay Tasks and
  Questions.
- Stable privacy, tracking, personalization, source-management, and shortcut
  UI behavior.

## Acceptance criteria

1. Privacy-sensitive persona has 2-4 meaningful scenarios covering tracking
   choices, personalization visibility, and confidence that passive reading
   does not create unwanted engagement.
2. Power-reader persona has 2-4 meaningful scenarios covering source
   management, read filtering, keyboard-heavy reading, and return context.
3. Scenarios use named actors and shared Screenplay Tasks / Questions.
4. Product gaps discovered during scenario authoring are either implemented or
   represented as `@pending` with a one-line rationale.
5. `npm run test:bdd` stays green for all non-pending scenarios.

## Implementation notes

- Favor end-to-end user intent over duplicating existing low-level settings or
  reader assertions.
- Use API setup only for external-system fixtures such as crawler ingest; avoid
  direct database access.
- Update `features/README.md` gaps as scenarios move from planned to covered.

## Links

- PR:
- Discussion:
