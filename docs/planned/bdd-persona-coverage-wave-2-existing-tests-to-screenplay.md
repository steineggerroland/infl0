# Package: BDD persona coverage wave 2 — migrate existing tests to Screenplay

## Status

In progress — most existing browser behavior has moved into persona-led
Screenplay scenarios. Remaining scope is the article / episode content
presentation feature.

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

1. Done: onboarding flows use `OnboardingJourney` through Screenplay Tasks /
   Questions in the Nora, Mira, and Priya persona scenarios.
2. Done: registration/login, sources, reader return-context, operator
   observability, privacy controls, display settings, install affordances, and
   settings navigation have reusable Screenplay Tasks / Questions where they are
   shared by persona scenarios.
3. Done: existing migrated behavior remains covered and `npm run test:bdd`
   stays green.
4. Done: migrated feature wording is named-actor based and avoids new
   `I`/`they` mixes.
5. Remaining: `content_presentation.feature` still uses classic `I` wording and
   should be migrated into Robin/content-card Screenplay coverage.

## Implementation notes

- Prefer extracting Tasks/Questions behind existing screen/page objects rather
  than moving selectors into step definitions.
- Migrate by behavior cluster: onboarding, auth, sources, reader, operator,
  then content presentation.
- Keep domain feature files while migrating internals; only rename/reorganize
  feature files when the user-facing story becomes clearer.

## Links

- PR:
- Discussion:
