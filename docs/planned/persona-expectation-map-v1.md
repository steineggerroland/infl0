# Package: Persona expectation map v1

## Status

Draft

## Goal

Make infl0's user expectations explicit before more feature work starts. The
BDD suite should show not only what UI elements work, but which persona need
each behavior serves and which future behavior is intentionally planned.

## Non-goals

- Implementing all persona scenarios in this package.
- Replacing existing domain feature files immediately.
- Treating personas as marketing segments; they are working models for
  product needs and BDD expectations.

## Dependencies

- Screenplay foundation from the New User package.
- Existing domain BDD coverage for onboarding, reader return context, settings,
  content presentation, feeds/sources, PWA install, and operator views.
- Default Cucumber `not @pending` filter so planned scenarios can live next to
  executable behavior without breaking CI.

## Persona map

### Nora — first-session reader

**Need:** Register, understand enough, add a source, and reach the first
article quickly without feeling lost.

**Covered now:** `new_user_first_reading_session.feature`,
`auth_registration_login.feature`, onboarding feature files.

**Next expectations:** reduce overlap between domain onboarding features and
Nora's Screenplay journey during the wave 2 migration.

### Priya — privacy-sensitive reader

**Need:** Understand what is tracked, decide consciously, and verify passive
use does not create unwanted reading-behavior data.

**Covered now:** tracking toggle, personalization entry point, passive reader
start/read-state behavior.

**Planned tests:** `persona_privacy_expectations.feature`.

### Robin — active returning reader

**Need:** Re-enter a reading session quickly, use shortcuts, open original
articles/podcast details, and return without losing context.

**Covered now:** reader return context, card shortcuts, article/episode
presentation.

**Planned tests:** `persona_active_reader_expectations.feature`.

### Mira — sensory customizer

**Need:** Tune colors, type, density, and motion before reading so infl0 feels
comfortable and legible.

**Covered now:** display preferences, onboarding readability shortcuts.

**Planned tests:** `persona_customizer_expectations.feature`.

### Eli — curious explorer

**Need:** Explore navigation, onboarding detail, help, settings sections, and
install affordances before committing to a reading routine.

**Covered now:** onboarding detail scenarios, settings hub navigation, PWA
install listing.

**Planned tests:** `persona_explorer_expectations.feature`.

### Sam — timeline curator

**Need:** Actively manage feeds and podcasts, understand source health, weight
sources, pause/resume, and eventually curate filters or favorites.

**Covered now:** feeds/sources management, source health, operator observability
for technical views.

**Planned tests:** `persona_timeline_curator_expectations.feature`.

### Oli — operator

**Need:** Keep the running infl0 instance healthy. Oli needs a protected,
attention-first overview of source and crawler health without entering a
reader's personal timeline.

**Covered now:** `operator_sources.feature` covers allowlist protection,
summary visibility, attention-first ordering, and filters for source statuses.

**Planned tests:** `persona_operator_expectations.feature`.

### Ingo — integrator

**Need:** Verify whether TopicKnowledgeCrawler delivery works from the outside
and debug failures quickly. E2E tests continue to protect API integrity; Ingo
needs an operator-protected dashboard that explains recent ingest requests,
accepted/rejected outcomes, content counts, and failure details.

**Covered now:** API integrity is covered by
`tests/e2e/authed/crawler-ingest-contract.spec.ts` and TKC JSON fixtures.

**Planned tests:** `persona_integrator_expectations.feature`; concrete product
package: `integrator-ingest-observability-dashboard.md`.

## Acceptance criteria

1. Persona names, needs, current coverage, and planned expectations are recorded
   in one planned package.
2. Planned persona expectations are represented as `@pending` Gherkin
   scenarios, not only prose.
3. Existing implemented coverage remains green because pending scenarios are
   excluded by the default Cucumber profile.
4. Roadmap points to this package as the living bridge between product
   direction and executable BDD work.

## Implementation notes

- `@pending` scenarios should be written as real acceptance tests, not notes.
- Once a scenario becomes implementable, remove `@pending`, implement shared
  Screenplay Tasks/Questions, and keep the persona wording intact.
- Wave 2 should migrate existing domain tests into reusable Screenplay
  internals before Wave 3 expands Privacy and Power User breadth.

## Links

- PR:
- Discussion:
