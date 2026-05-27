# Package: BDD persona coverage wave 3 — remaining privacy and power workflows

## Status

Implemented — Robin, Shorty, Priya, Mira, Eli, Sam source-weighting, Sam
focused working sets, Ingo integrator observability, and Oblivia recovery
email/password reset scenarios are implemented on `feat/wave-3-pending-bdd`.

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
   mid-session reading-control changes. Shorty's `@pending` covers timeline `r`
   (show-read); mid-session font shortcuts are already green in Shorty's
   article/episode shortcut scenarios.
3. Sam's source-weighting scenario covers saved preference and reader ranking;
   focused working sets cover narrowing the reader to one source and returning
   to the full inflow.
4. Ingo's integrator dashboard scenarios cover recent successful ingest,
   accepted article/episode/subscriber counts, auth rejection without key
   exposure, invalid structure previews, and unsupported section diagnostics.
5. Oblivia's recovery scenarios cover recovery email verification, recovery
   after sign-out, unverified-email refusal, and invalid-code refusal.
6. Scenarios use named actors and shared Screenplay Tasks / Questions.
7. Product gaps discovered during scenario authoring are either implemented or
   represented as `@pending` with a one-line rationale.
8. `npm run test:bdd` stays green for all non-pending scenarios.

## Implementation notes

- Favor end-to-end user intent over duplicating existing low-level settings or
  reader assertions.
- Use API setup only for external-system fixtures such as crawler ingest; avoid
  direct database access.
- Update `features/README.md` gaps as scenarios move from planned to covered.

## Links

- PR: #49
- Discussion:
