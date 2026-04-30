# Test coverage matrix (Unit / E2E / BDD)

This document maps product behavior to the primary test layer and highlights BDD expansion priorities.

## Layer intent

- Unit/component: protect domain invariants, helper behavior, architecture boundaries, isolated interaction logic.
- E2E smoke: validate app startup, route reachability, and auth/setup plumbing.
- BDD: specify and validate user-visible product behavior and guided journeys.

## Current feature coverage map

- **Onboarding welcome flow**
  - Primary layer: BDD (`tests/bdd/features/onboarding_welcome_journey.feature`)
  - Supporting layer: E2E smoke (`tests/e2e/onboarding/welcome.spec.ts`) for page-load/render smoke only
  - Notes: feature-level assertions intentionally moved to BDD.

- **Onboarding scoring transparency**
  - Primary layer: BDD (`tests/bdd/features/onboarding_scoring_transparency.feature`)
  - Supporting layer: unit/component assertions for rendering contracts
  - Notes: includes settings/tracking/why-top behavior messaging.

- **Onboarding readability shortcuts**
  - Primary layer: BDD (`tests/bdd/features/onboarding_readability_shortcuts.feature`)
  - Supporting layer: component tests for control-level regression safety
  - Notes: user-visible shortcut behavior anchored in BDD.

- **Registration and login**
  - Primary layer: BDD (`tests/bdd/features/auth_registration_login.feature`)
  - Supporting layer: E2E auth setup (`tests/e2e/auth.setup.ts`, `tests/e2e/onboarding-auth.setup.ts`)
  - Notes: BDD owns user journey; setup specs own infra/session bootstrapping.

- **Public and authed page smokes**
  - Primary layer: E2E (`tests/e2e/a11y-layout-smoke.spec.ts`, `tests/e2e/authed/settings-smoke.spec.ts`)
  - Supporting layer: unit/component checks where available
  - Notes: retain high signal smoke checks, avoid feature duplication.

## Prioritized BDD backlog (gaps)

1. **Privacy-sensitive user journey**
   - Cover tracking disabled/enabled decisions and resulting timeline explanation affordances.
2. **Power-user personalization journey**
   - Cover sorting preference tuning and resulting expectation framing in UI copy.
3. **Returning-user onboarding completion behavior**
   - Cover post-skip/post-complete behavior consistency across sessions.
4. **Feed/source management behavior**
   - Cover source add/remove and visible timeline consequences from a user perspective.

## Definition of done for behavior changes

- Any change to user-visible behavior must update or add matching BDD scenarios.
- E2E should only keep smoke/setup checks after equivalent feature behavior exists in BDD.
