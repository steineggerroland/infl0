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

**Covered now:** `new_user_first_reading_session.feature`.

**Next expectations:** keep onboarding changes in Nora's Screenplay journey
unless a later feature clearly belongs to another persona.

### Priya — privacy-sensitive reader

**Need:** Understand what is tracked, decide consciously, and verify passive
use does not create unwanted reading-behavior data.

**Covered now:** `persona_privacy_expectations.feature` covers tracking toggle,
personalization entry point, scoring transparency, and control links. Passive
reader start/read-state behavior is covered by Robin.

**Planned tests:** passive use without engagement data and deeper
personalization signal inspection remain pending in
`persona_privacy_expectations.feature`.

### Robin — active returning reader

**Need:** Re-enter a reading session quickly, use shortcuts, open original
articles/podcast details, and return without losing context.

**Covered now:** `persona_active_reader_expectations.feature` covers sign-in,
sign-out, reader start, resume, return context, read feedback, read shortcut,
and read-without-tracking. `content_presentation.feature` still covers
article/episode presentation and card shortcuts.

**Planned tests:** none on Robin for episode keyboard; see Shorty.

### Shorty — keyboard shortcut enthusiast

**Need:** Learn every shortcut from the help reference, then verify they work
on real timeline cards (articles and episodes) without mouse-only workarounds.

**Covered now:** `persona_shorty_expectations.feature` — rich episode card
surfaces (chapters, shownotes, details tabs), help catalog
(`#shortcuts-reference`), article and episode card shortcuts, read-state
toggle via `m`. Episode dialog keyboard/tabs and timeline `r` (show-read) remain `@pending`
in `persona_shorty_expectations.feature`.

**Note:** Mira still owns onboarding-card readability shortcuts (before real
articles); Shorty owns the central catalog and in-flow timeline shortcuts.

### Mira — sensory customizer

**Need:** Tune colors, type, density, and motion before reading so infl0 feels
comfortable and legible.

**Covered now:** `persona_customizer_expectations.feature` covers display
preferences, custom card colors, and onboarding readability shortcuts.

**Planned tests:** fuller low-stimulation reading setup remains pending.

### Eli — curious explorer

**Need:** Explore navigation, onboarding detail, help, settings sections, and
install affordances before committing to a reading routine.

**Covered now:** `persona_explorer_expectations.feature` covers settings deep
links, wide-layout section navigation, and phone install affordance. HTTP-only
PWA manifest behavior remains in `add_infl0_to_home_screen.feature`.

**Planned tests:** full onboarding exploration remains pending.

### Sam — timeline curator

**Need:** Actively manage feeds and podcasts, understand source health, weight
sources, pause/resume, and eventually curate filters or favorites.

**Covered now:** `persona_timeline_curator_expectations.feature` covers
feeds/sources management, source health, pause/resume, and crawler health
explanations.

**Planned tests:** `persona_timeline_curator_expectations.feature`.

### Oli — operator

**Need:** Keep the running infl0 instance healthy. Oli needs a protected,
attention-first overview of source and crawler health without entering a
reader's personal timeline.

**Covered now:** `persona_operator_expectations.feature` covers allowlist
protection, summary visibility, attention-first ordering, and filters for
source statuses.

**Planned tests:** `persona_operator_expectations.feature`.

### Oblivia — forgetful reader with verified recovery

**Need:** Prove a recovery email is hers before relying on it, then reset a
forgotten password via that address without operator help.

**Wordplay:** *Oblivia* ≈ *oblivious* — forgot the password, not the recovery
setup.

**Covered now:** optional unverified recovery email at registration; settings
show sign-in name and stored recovery email (Robin).

**Planned tests:** `persona_oblivia_expectations.feature` — verify in settings,
OTP by SMTP, sign out, forgot-password flow. Package:
[`oblivia-recovery-email-verification.md`](./oblivia-recovery-email-verification.md).

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
- Wave 2 should finish migrating content presentation into reusable Screenplay
  internals before Wave 3 expands the remaining privacy, active-reader, and
  timeline-curator breadth.

## Links

- PR:
- Discussion:
