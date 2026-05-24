# Package: BDD persona coverage wave 1 — New User + Screenplay foundation

## Status

Done (2026-05-24)

## Goal

Introduce persona-led BDD coverage with a first, coherent New User journey and
a small Screenplay foundation that future persona waves can reuse.

## Non-goals

- Completing Privacy-sensitive and Power User persona coverage in this slice.
- Migrating every existing BDD feature to Screenplay immediately.
- Replacing domain-level BDD scenarios that still document useful behavior.

## Dependencies

- Existing Cucumber + Playwright setup in `features/**/*.feature`.
- Existing registration, sources, reader, and onboarding UI flows.
- TopicKnowledgeCrawler ingest API test setup for content delivery.

## Acceptance criteria

1. New User onboarding is covered by multiple persona scenarios, not a single
   monolithic journey.
2. Screenplay support exists for Actor, browser ability, Tasks, and Questions.
3. Concrete UI selectors remain behind screen/page objects.
4. New User can register through the UI, see onboarding, keep onboarding
   context across reload, finish onboarding from a later card, add a source,
   receive crawler content, start reading deliberately, and return to the same
   article.
5. The new scenarios run green in the production-like BDD suite.

## Implementation notes

- Added `features/new_user_first_reading_session.feature` with five
  Screenplay-style New User scenarios.
- Added `features/support/screenplay/*` for Actor, browser ability, Tasks, and
  Questions.
- Added `features/support/onboarding-journey.js` and reused it from both
  persona steps and existing onboarding steps to reduce duplicate navigation /
  return-context logic.
- `@screenplay` scenarios use a dedicated Cucumber `Before` hook that starts a
  browser without pre-registering an API user; the persona registers through
  the UI.
- Onboarding can now be finished from any onboarding card. The user-facing
  action copy is `Finish introduction` / `Einführung beenden`.
- Default Cucumber commands exclude `@pending`, preparing future persona
  skeleton scenarios without breaking CI.
- Verification: `npm run lint -- --quiet`, `npm test -- OnboardingCardView`,
  `npm test -- onboarding-cards`, targeted
  `features/new_user_first_reading_session.feature`, and `npm run test:bdd`
  (`60 scenarios / 464 steps`).

## Links

- PR:
- Discussion:
