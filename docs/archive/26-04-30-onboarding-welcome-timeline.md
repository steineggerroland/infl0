# Package: onboarding · welcome timeline · behavioral-test foundation

## Status

Completed (archived)

## Goal

**Users:** Newly registered accounts get an **immediate**, explanatory starting
timeline instead of an empty state or hand-seeded dev data. Fixed onboarding
cards introduce core idea, sources, scoring transparency, and themes across the
same front/back/full-text surfaces used in day-to-day reading.

**Product / QA:** Authenticated test flows run on a predictable, production-like
path: **sign-up (or fresh onboarding account) → sign in → fixed onboarding
cards**. User-visible behavior is specified primarily in BDD feature files,
while E2E is reduced to smoke/setup coverage.

## Non-goals

- A full interactive tutorial with wizards, gamification, or mandatory
  checklists between steps (prefer an **optional, scrollable** intro in the
  normal timeline).
- Replacing all existing E2E scenarios in one go: migration remains gradual.
- Duplicate maintenance: onboarding copy should have **one** source (i18n +
  onboarding catalog), not copy-paste drift from the help
  page.
- A detailed chapter plan for all future tests — that stays in each feature /
  spec; here only the implementation frame and migration result.

## Dependencies

- **Account creation** and SRP sign-in (already there); possible extension if
  “first login” should be tracked (flag `onboardingVersion` or similar).
- **Deterministic onboarding card catalog** (currently four topics) available
  for new users via inflow response.
- **Readability / UI** work (themes, surfaces) only as **content** references
  on the cards; low technical dependency as long as card and reader work.
- Related docs: `docs/archive/26-04-27-shortcuts-help.md` (shortcut copy should
  stay consistent with onboarding).

## Acceptance criteria

1. **Four clearly separated cards** with stable order and selectors (`intro`,
   `sources`, `scoring`, `themes`) exist in **DE/EN**.
2. **New users** see these cards **in their own** timeline, without manual
   `devData` or feed subscriptions.
3. **Behavioral coverage moved to BDD** in `features/**/*.feature`, with shared
   and domain-specific step split in `features/**/*.js`.
4. **E2E suite reduced to smoke/setup focus**; overlapping feature-behavior
   assertions removed from onboarding E2E spec.
5. **Mobile/desktop copy consistency:** mobile variants use touch-first CTAs;
   keyboard shortcuts are desktop hints, not mobile primary actions.
6. **Stable selectors** remain available for automation (`data-onboarding-*`,
   topic-based targeting).

## Implementation notes

Key implemented notes:

- Onboarding copy is i18n-driven and topic-based (`front` / `back` / `full`),
  including desktop/mobile intro variants.
- Reader links for onboarding full text are explicit and navigable.
- Cucumber setup uses default-oriented `features/**/*.feature` + glue
  `features/**/*.js`.
- EN locale is enforced for BDD browser context and assertions where required.
- E2E onboarding spec now covers smoke-level rendering only.

## Test strategy snapshot

| Layer | Current role |
|-------|--------------|
| Unit/component | Fast behavior and rendering contracts |
| E2E | Smoke + setup/auth infrastructure |
| BDD | Primary user-facing behavior specification |

## Links

- Follow-up proposal is tracked separately after archive move (see chat
  agreement).
- Related docs:
  - `docs/DEVELOPING.md`
  - `features/README.md`
  - `docs/archive/26-04-27-shortcuts-help.md`
