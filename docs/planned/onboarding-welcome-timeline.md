# Package: onboarding · welcome timeline · E2E foundation

## Status

Draft

## Goal

**Users:** Newly registered accounts get **immediately** a useful, explanatory
**starting timeline** — not an empty screen and not hand-seeded dev data.
Prefabricated cards introduce the app’s **core idea**, **keyboard
shortcuts**, **themes / customisation** (pointer to settings), **sources
(feeds)**, and **basic behaviour** (reading, timeline, etc.). Content is
**reading cards** (like real articles) so the same surfaces (front, back, and
full text where applicable) and interactions apply that matter day to day.

**Product / QA:** End-to-end tests that need a **signed-in** session will run
on a **predictable, production-like** path: **sign-up (or a guaranteed clean
onboarding account) → sign in → work against fixed onboarding
cards** (shortcuts, settings, reading flow). That removes dependency on
`devData` / manual seeds for timeline E2E insofar as those tests align with
**the same** cards.

## Non-goals

- A full interactive tutorial with wizards, gamification, or mandatory
  checklists between steps (prefer an **optional, scrollable** intro in the
  normal timeline).
- Replacing all existing E2E scenarios in one go: migrate gradually; this
  package provides **target state** and **priority** for E2E work.
- Duplicate maintenance: onboarding copy should have **one** source (e.g. i18n
  + server-provided “system articles”), not copy-paste drift from the help
  page.
- A detailed chapter plan for all future E2E tests — that stays in each
  spec; here only the **frame** (cards, auth path, same article IDs/handles).

## Dependencies

- **Account creation** and SRP sign-in (already there); possible extension if
  “first login” should be tracked (flag `onboardingVersion` or similar).
- **Server-side or deterministic reference** to **exactly N** (e.g. **four**)
  fixed article or timeline entries per new user — schema/migration, `upsert`
  after registration, or user-bound seeding tied to a defined `crawlKey` /
  “System/Welcome” source.
- **Readability / UI** work (themes, surfaces) only as **content** references
  on the cards; low technical dependency as long as card and reader work.
- Related docs: [`shortcuts-help.md`](./shortcuts-help.md) (shortcut copy
  should stay consistent with onboarding).

## Acceptance criteria

1. **Four clearly separated cards** (at least four; theme and order
   defined) covering intro, shortcuts, themes/settings, sources/behaviour —
   copy and structure in **DE/EN** (or defined so i18n is unambiguous).
2. **New users** see these cards **in their own** timeline, without manual
   `devData` or subscribing to feeds (mechanism in the package, e.g.
   `user_timeline` after sign-up, fixed content, versioning).
3. **E2E frame** documented: specs that need auth use **sign-up + sign in**
   and target **known** `data-testid` / article IDs / fixed titles for the
   onboarding cards; readability shortcuts, etc. run on **this** timeline, not
   random RSS articles.
4. **Stable selectors** for E2E: cards must be **reliably** findable in tests
   (e.g. fixed `article.id`, `data-testid` on `ArticleView`, or slug per
   onboarding content).
5. **No break** for power users who want to hide content: optional later
   “onboarding done” / dismiss; MVP can be “first session only” or similar
   (state explicitly, don’t hide the trade-off).
6. **Definition of done (E2E migration slice):** at least one authed E2E (e.g.
   readability shortcuts) is green using only onboarding fixture + auth, no
   prerequisite `devData`, once enabled (this package describes the cutover;
   implementation can be same or a follow-up PR).

## Implementation notes

- **Content:** per card, one clear learning message; pointer to **settings**
  for appearance; **shortcuts** in short form (full table in the help/
  shortcuts package).
- **Four themes** (proposal, refine in detail): (1) welcome / what is the
  timeline, (2) keyboard & readability, (3) themes & personalisation in
  settings, (4) adding sources & how articles reach the timeline.
- **E2E:** Playwright: auth fixture with **one** fresh user per run (or
  disable parallel runs for the same email) to avoid collisions; random email +
  same password policy as production if needed. **devData** and manual DB
  seeds stay optional for developers; authed E2E without onboarding does not
  depend on a fixed Playwright seed step.
- **Risk:** long timelines when onboarding and real feeds combine; order /
  “pin” welcome articles to the top.
- **Rollback:** reverse onboarding flags and inserted article references via
  migration; keep E2E on seeds until the switch.

## E2E strategy (target)

| Today (transition) | Goal (after package) |
|--------------------|------------------------|
| `devData` + fixed three-user timeline in some runs | Fresh user, after login only **fixed** onboarding cards (known IDs) |
| Shortcut tests tied to `.article` + local state | Shortcuts on **card N** with stable selector + same `ArticleView` logic |
| Double handling of `DEV_SRP_*` / seeds | SRP sign-up in test; `.env.e2e` still consistent for the server |

## Links

- PR: *(TBD)*
- Discussion: onboarding, welcome content, E2E refit; see also
  [`shortcuts-help.md`](./shortcuts-help.md), [`../ROADMAP.md`](../ROADMAP.md)
