# Package: BDD persona coverage wave 2 — migrate existing tests to Screenplay

## Status

Draft

## Goal

Move the existing behavior-focused BDD suite toward the persona / Screenplay
structure introduced in wave 1, so future tests share Actor, Task, Question,
and screen-object language instead of growing parallel step implementations.

## Non-goals

- Changing product behavior.
- Rewriting every scenario in one pass if the migration would become too large.
- Removing domain-level feature files before their persona replacement is
  demonstrably equivalent.

## Dependencies

- Wave 1 Screenplay foundation:
  `features/support/screenplay/*`,
  `features/support/onboarding-journey.js`.
- Existing BDD feature files and screen objects.

## Acceptance criteria

1. Onboarding BDD steps use `OnboardingJourney` as their single navigation /
   return-context implementation.
2. Registration/login, sources, reader return-context, and card presentation
   flows have reusable Screenplay Tasks and Questions where they are shared by
   persona scenarios.
3. Existing feature behavior remains covered and `npm run test:bdd` stays green.
4. Step wording is language-consistent within each feature; no new `I`/`they`/
   named-actor mix is introduced.
5. Any feature not migrated yet is listed explicitly as a follow-up, not left
   implicit.

## Implementation notes

- Prefer extracting Tasks/Questions behind existing screen/page objects rather
  than moving selectors into step definitions.
- Migrate by behavior cluster: onboarding, auth, sources, reader, content
  presentation.
- Keep domain feature files while migrating internals; only rename/reorganize
  feature files when the user-facing story becomes clearer.

## Links

- PR:
- Discussion:
