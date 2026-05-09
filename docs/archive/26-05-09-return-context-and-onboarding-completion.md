# Package: Return context and onboarding completion

## Status

Done (2026-05-09)

## Goal

Navigation away from the inflow and back should feel stable and predictable.
Users should return to the card/article context they just had, instead of being
thrown to a different position or the first onboarding card.

Define a clear onboarding completion model that is understandable for users and
consistent with the same return behavior used for normal article reading.

## What shipped

- **Reader start + resume + local return anchor** were implemented earlier (see
  [`26-05-02-reader-start-return-context.md`](./26-05-02-reader-start-return-context.md)
  and Cucumber **`reader_return_context.feature`**).
- **Onboarding completion** is expressed as **`User.uiPrefs.onboardingHidden`**:
  Skip on the intro card and the Settings “Welcome cards” control both PATCH the
  same flag; re-show onboarding by turning that control back on in Settings.
- **SPA return from `/feeds`, `/help`, and `/settings*`** while an active reader
  session is running sets a **same-tab sessionStorage flag**; reopening `/`
  skips the reader start screen and runs **`restoreInflowContext()`** so the
  last article/onboarding anchor is restored when it still appears in the
  current inflow. Full reload still shows reader start when appropriate.
- **Resume (“Jump to last article”) vs. read filter:** the stored anchor can be a
  **read** row while **“hide read articles”** is on, so it would never appear in
  `GET /api/inflow`. **`GET /api/me/articles/:articleId/resume-eligibility`**
  (same `showRead` semantics as the inflow) gates **`canResumeReader`**; the
  resume control is **hidden** when the anchor is not eligible. **`resumeReader`**
  and **`restoreInflowContext`** no longer use **`fallbackIndexForStoredContext`**
  for **article** anchors (that offset heuristic jumped to unrelated cards); if
  the article still cannot be found after paging, the reader opens at the **first
  visible article**. **`fallbackIndexForStoredContext`** remains only for
  **onboarding** anchors when needed.
- **`refreshResumeEligibility()`** on `pages/index.vue` after initial load,
  **`showRead`** changes, and timeline refresh so the resume button tracks filter
  changes without a full reload.
- **Cucumber (`reader_return_context.feature`):** Help navigation uses the
  teleported header **`<details>` / Help link** (`When I open the floating menu and go to Help`)
  instead of fragile `getByRole('button', { name: 'Menu' })`; scenario **resume
  hidden when the stored anchor is read but read articles are hidden**.

## Behavioral tests (feeds harness, same BDD run)

- **`features/steps/feeds.steps.js`:** add-source step uses **`#feed-url-input` /
  `#feed-display-input`**, waits for **`POST /api/feeds`**, and surfaces non-OK
  responses so flaky failures are diagnosable (stabilises
  **`feeds_sources.feature`** in the same suite as reader return-context).

## Acceptance criteria (original) — note

1. Met for Settings / Help / Feeds via session flag + restore (see above).
2. **Refined for articles:** “nearest neighbor” via stored list offsets is **not**
   used for missing **article** anchors (misleading scroll); first inflow article
   or no resume offer when filtered out. **Onboarding** may still use offset
   fallback when the card id is gone.
3. Onboarding completion via **`onboardingHidden`** (unchanged).
4. Covered by **`reader_return_context.feature`** and related steps; feeds add
   flow covered by **`feeds_sources.feature`**.

## Non-goals

- Reworking timeline ranking logic itself.
- Full redesign of onboarding copy or card visuals.
- Introducing mandatory tutorial flows.

## Dependencies

- Timeline/inflow focus state handling.
- Onboarding card state model (`topic`, surface state).
- UI preferences/session persistence strategy.

## Links

- Cucumber: `features/reader_return_context.feature` (Help via floating menu → home;
  resume eligibility when read + hide read).
- Implementation: `pages/index.vue`, `utils/inflow-return-context.ts`,
  `server/api/me/articles/[articleId]/resume-eligibility.get.ts`,
  `server/utils/inflow-handler.ts` (`queryShowRead` export for the eligibility route).
- Unit tests: `tests/unit/inflow-return-context.test.ts`,
  `tests/unit/api-resume-eligibility.test.ts`.
