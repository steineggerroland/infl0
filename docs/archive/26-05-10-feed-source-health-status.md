# Package: Feed source health status — UX iteration & source weighting

## Status

**Shipped** (2026-05-10). See [`CHANGELOG.md`](../../CHANGELOG.md) **[Unreleased]**.

## Goal

Make `/feeds` actually useful for a reader: triage problematic sources at a
glance, understand **what is wrong** and **what to do next**, see **when new
content is expected**, see **how dominant or under-represented** a source is in
your inflow, and **steer** that mix with a simple per-source weighting that has
**noticeable** effect on ranking.

Users should be able to answer:

- Has this source been processed yet?
- Did the last processing run work?
- When can I expect new content?
- Is this source quiet, blocked, or still being configured? **What can I do?**
- How dominant is this source in my inflow? How many of its articles have I read?
- Can I tell my inflow to bring **more** or **less** of this source?

## Non-goals

- Do not build an operator/admin dashboard in this package.
- Do not expose technical crawler logs to regular users.
- Do not let users edit crawler policies yet.
- Do not add free-text source rating or per-article voting.

## Dependencies

- [`../archive/26-05-10-source-health-api-contract.md`](../archive/26-05-10-source-health-api-contract.md) (Prisma `SourceStatus`, `GET /api/source-statuses`, `POST /api/crawler/source-status`)
- Existing `/feeds` page, `GET /api/feeds`, `DELETE /api/feeds/:id`
- Existing scoring pipeline: `utils/timeline-score-*`, `server/utils/recompute-timeline-scores.ts`
- Existing per-feed implicit engagement: `UserFeedEngagement` (independent from
  the new explicit weighting — this slice is **additive**)
- DaisyUI components: [`status`](https://daisyui.com/components/status/),
  [`alert`](https://daisyui.com/components/alert/), [`stat`](https://daisyui.com/components/stat/),
  [`badge`](https://daisyui.com/components/badge/), [`button`](https://daisyui.com/components/button/),
  [`join`](https://daisyui.com/components/join/), [`tooltip`](https://daisyui.com/components/tooltip/)
- House style: [`docs/CONTENT_AND_A11Y.md`](../CONTENT_AND_A11Y.md)
- TopicKnowledgeCrawler contract: [`docs/SOURCE_STATUS_API.md`](../../../TopicKnowledgeCrawler/docs/SOURCE_STATUS_API.md)

## Acceptance criteria

### Already shipped (initial slice)

1. **`/feeds`** shows source status information for each active feed/source.
2. Status labels are user-facing (i18n, EN/DE) and match the
   [`TopicKnowledgeCrawler` contract](../../../TopicKnowledgeCrawler/docs/SOURCE_STATUS_API.md).
3. Stable behavior anchor `data-source-health` on
   `[data-testid="feed-source-health"]` (one of `pending` / `needs_setup` /
   `healthy` / `quiet` / `degraded` / `failing` / `blocked` / `paused` /
   `no_snapshot` / `missing`).
4. Page remains accessible: status not color-only; labels screen-reader
   understandable.

### A — Triage at a glance (this iteration)

5. **Sort order on `/feeds`** is severity-first:
   `failing` → `blocked` → `degraded` → `needs_setup` → `pending` →
   `quiet` → `paused` → `healthy`. Tie-break: `createdAt` ASC.
6. **Attention banner** above the source list when at least one source is
   in a triage state (`failing`, `blocked`, `degraded`, `needs_setup`).
   Copy: *“1 Quelle braucht Aufmerksamkeit.”*
   (DaisyUI [`alert alert-warning alert-soft`](https://daisyui.com/components/alert/),
   `role="status"`, polite live region.)
7. **Left accent stripe** on rows whose status is in the triage set, in the
   matching health tone (`error` for `failing`/`blocked`, `warning` for
   `degraded`, `neutral` for `needs_setup`/`pending`).
8. **Prominent next-check line** directly under the status label whenever
   `nextAllowedCrawlAt` is set and not `healthy`. Format: relative time
   (`vor 2 Stunden`, `in 3 Stunden`) with absolute timestamp on hover via
   `<time>` + DaisyUI [`tooltip`](https://daisyui.com/components/tooltip/).
9. **Copy polish**: rename *“Stand: …”* → *“Zuletzt aktualisiert vor …”*;
   *“Technische Details”* → *“Mehr Infos”*. No `seed_*` / `e2e_*` /
   `fixture_*` strings reach the UI.
10. **Seed data** uses friendlier display titles (*„Beispielquelle · Aktuell“*,
    *„Beispielquelle · braucht Einrichtung“*, …) instead of `Seed · pending`.

### B — Clarity: what is the problem and what can I do? (this iteration)

11. Each TKC status has **two short user-facing texts** under
    `feeds.health.help.<status>.{what,action}`:
    - `pending` — what: „Wir haben diese Quelle noch nicht abgerufen.“
      action: „Nichts zu tun. Wir starten beim nächsten geplanten Abruf.“
    - `needs_setup` — what: „Diese Quelle braucht eine kurze Einrichtung,
      bevor wir sie regelmäßig abrufen.“ action: „Bitte melde dich kurz beim
      Support-Team.“
    - `healthy` — kein Block (still gut).
    - `quiet` — what: „Die Quelle wird abgerufen, hatte zuletzt aber keine
      neuen Artikel.“ action: „Nichts zu tun.“
    - `degraded` — what: „Einige Artikel konnten zuletzt nicht geladen
      werden.“ action: „Schau in ein paar Stunden noch einmal vorbei. Bleibt
      es, bitte beim Support melden.“
    - `failing` — what: „Der letzte Abruf hat nicht geklappt. Wir versuchen
      es weiter.“ action: „Du kannst die Quelle pausieren oder ersetzen.“
    - `blocked` — what: „Der Anbieter blockt uns gerade.“
      action: „Du musst nichts tun — wir versuchen es später wieder.“
    - `paused` — what: „Der automatische Abruf ist derzeit pausiert.“
      action: „Setze den Abruf fort, sobald du wieder Inhalte willst.“
12. **Pause / Resume** action per source as a `btn-ghost` button next to
    *„Entfernen“*. Mapped to `UserFeed.active`. (Pause flips `active=false`,
    Resume sets `active=true`. Inflow already filters on `active=true`.)
13. Component or BDD coverage: a row in `failing` shows the failing what/action
    text and renders the *„Pausieren“* button.

### C — Dominance & reading history (this iteration)

14. New endpoint **`GET /api/me/feed-stats`**, session-authed, returns one row
    per active `UserFeed`:

    ```ts
    type UserFeedStatsRow = {
      feedId: string
      crawlKey: string
      sharePercent: number       // share of inflow articles, 0..100
      inflowCount: number        // total UserTimelineItem rows
      unreadCount: number        // inflow rows where readAt is null
      readCount: number          // inflow rows where readAt is set
      lastReadAt: string | null  // ISO of latest readAt for this source
    }
    ```

    `sharePercent` rounds to one decimal; total share across all rows ≈ 100 %
    (rounding error allowed).

15. On `/feeds` each source row shows two compact figures via DaisyUI
    [`stats` / `stat`](https://daisyui.com/components/stat/) (or a simpler
    inline `dl` for parity with the rest of the UI):
    - **Anteil im Inflow** (e.g. „rund 14 %“). Tooltip explains it’s the share
      of articles in your inflow right now.
    - **Gelesen / im Inflow** (e.g. „3 von 18 gelesen“). When `lastReadAt` is
      set: subtitle „zuletzt gelesen vor 2 Tagen“.
16. Empty state: *„Noch keine Artikel im Inflow.“* when `inflowCount === 0`.

### D — Layout, accessibility, hygiene

17. Status dot uses [`status` component](https://daisyui.com/components/status/)
    `status-md` in the matching tone (already in place in `status-sm` —
    enlarge for legibility; behavior anchor unchanged).
18. Tooltips for all timestamps via [`tooltip`](https://daisyui.com/components/tooltip/)
    (relative + absolute), not bare `title=""`.
19. Health metadata that does not help end users (`crawlFetchErrorCount`,
    `crawlLlmFailedCount`, `consecutiveErrorCount`, `pipelineState`,
    `runStatus`, `lastSuccessfulCrawlAt`) **does not** surface in the
    user-facing summary at all — that telemetry is operator territory and
    will live on the operator dashboard instead. The only payload field
    we still expose verbatim is `lastCrawlError`, and only when it is
    present and non-empty.
20. Keep `aria-live` quiet on per-row updates; only the top attention banner
    is `role="status"`.

### D′ — Compact, collapsible rows (refinement)

Follow-up to A–D once the rows turned out too tall on mobile to scan a
larger source list comfortably:

- Each `/feeds` row is a native `<details>` so the body can be **scanned
  in seconds and expanded on demand**. Collapsed shows:
  - chevron (rotates `90°` when open),
  - **title** (or URL when no display title), single line, `truncate`,
  - **URL** (when display title present), single line, `truncate`,
  - **Pause / Remove** action buttons inline at the row's right edge
    (`@click.stop` so the action doesn't toggle the disclosure).
- The expanded body holds the full `FeedSourceHealthSummary`,
  `FeedSourceStatsRow`, and `FeedSourceWeighting`. Default state is
  collapsed; the **left accent stripe** (rule 7) is the cue inviting the
  reader to expand attention rows. No auto-expand — staying compact even
  when something is wrong is the calm choice.
- The summary keeps **no health dot of its own** — the left accent
  stripe carries the same signal and the saved horizontal space goes to
  the title/URL on small displays. The behavior anchor
  (`data-testid="feed-source-health"` + `data-source-health="<key>"`)
  sits on the `<details>` element itself so tests can read the status
  without expanding the row, and the `FeedSourceHealthSummary` wrapper
  uses `data-testid="feed-source-health-detail"` to keep the two roles
  separate.
- Mobile density pass: `<summary>` uses `px-0` on small screens and only
  pads to `sm:px-3` from the small breakpoint up, panel containers drop
  from `p-6` to `p-3 sm:p-6`, and the disclosure body uses
  `px-2 sm:px-3`. Result: noticeably less truncation of titles/URLs on
  phone widths without changing the desktop layout.
- Truncation vs. tap conflict: while collapsed the title and URL stay on
  one truncated line each (the at-a-glance affordance the disclosure
  pattern needs), but they switch to `whitespace-normal break-words` /
  `break-all` via `group-open:` once the row is expanded — long titles
  and URLs are then fully readable on any width without any JS toggle.
- Real action affordances live in the body, not the toggle: the
  disclosure body opens with a small action row exposing **„Quelle
  öffnen"** (`<a target="_blank" rel="noopener noreferrer">`) and
  **„URL kopieren"** (clipboard button with a 2 s „Kopiert"-flash and a
  graceful toast on `Clipboard API unavailable`). Both elements sit
  outside `<summary>`, so tapping them never toggles the disclosure.
  Behavior anchors: `data-testid="feed-source-open-<feedId>"` and
  `feed-source-copy-<feedId>"` (with `data-copied="true|false"`).
- The weighting hint (*„Mehr davon zieht …"*) is delivered per breakpoint:
  on `md` and up it lives behind a small **`InfoPopover`** trigger next
  to the *„Wie viel von dieser Quelle?"* legend (keeps the desktop row
  tight); on phone widths the popover is hidden (`md:hidden` /
  `hidden md:inline-flex`) and the same hint is shown directly under the
  slider as a muted inline paragraph. Reason: a `~20 rem` popover panel
  anchored to a trigger in the middle of a 414 px viewport can't fit on
  either side, so a viewport-aware *trigger* doesn't actually help —
  the right move is to use a different surface for the same explanation.

### D″ — Calm summary copy (refinement)

`FeedSourceHealthSummary` was originally driven by the full TKC payload —
status, pipeline state, reason, last/next/last-successful timestamps, run
status, processed/error counts, consecutive-error streak, attention. Each
field had its own line and its own font size, so even a healthy source
felt loud. The reworked layout reduces the user-facing summary to five
clear blocks and **two** font sizes (`text-sm` body, `text-xs` muted
secondary):

1. **Status line** — DaisyUI `status status-md` dot inline with a bold
   label, vertically centred. The dot is the affordance, the label is
   the headline.
2. **Helper paragraph** — `feeds.health.help.<status>.what` and
   `.action` are merged into a single sentence. One paragraph, body
   colour, no separate styling for the action half.
3. **Timestamps** — `lastCrawlFinishedAt` and `nextAllowedCrawlAt` as
   two muted lines with absolute-time tooltips. Other timestamps from
   the payload are not user-relevant and stay hidden.
4. **Last error** — only when `lastCrawlError` is a non-empty string,
   shown as a small monospace box with a dezent error tint.
5. **Operator attention** — only when `operatorAttention === true`,
   styled as a soft warning panel.

Removed user-facing surfaces on purpose:

- `pipelineState` (already implied by the status label),
- `runStatus` (same),
- `lastSuccessfulCrawlAt`, `crawlProcessedCount`, `crawlFetchErrorCount`,
  `consecutiveErrorCount` (operator telemetry),
- the *„Mehr Infos / Infos ausblenden"* disclosure inside the summary
  (it only hid a tiny duplicate of information already covered above),
- the dynamic `feeds.health.reasons.<code>` line (the helper paragraph
  already speaks plain language; a translated machine code added noise
  rather than clarity).

Wording: `feeds.health.values.needs_setup` is now *„Wird vorbereitet" /
„Getting ready"* (from *„Einrichtung nötig" / „Setup required"*) and
the matching help texts make explicit that the *system* is doing the
preparation — there is no user task hidden in this status.

### E — Source weighting (after A–D, this package)

21. Per-subscription explicit preference: new column
    **`UserFeed.userPreferenceWeight: Float @default(0)`**, range
    **`-1 .. +1`** in **`0.25` steps**, persisted unchanged for inactive feeds.
    Migration: additive `ALTER TABLE`.
22. New endpoint **`PATCH /api/feeds/:id/preference`** (session-authed,
    owner check). Body: `{ value: number }`; rejects values outside the
    quantized set. On success, runs `recomputeTimelineScoresForUser` and
    returns `{ feedId, userPreferenceWeight }`.
23. **`GET /api/source-statuses`** also returns `feed.userPreferenceWeight`
    so `/feeds` renders without an extra round-trip.
24. **Score integration** in `recomputeTimelineScoresForUser`:

    ```ts
    score = computeWeightedScore(features, weights)
          + pref * SOURCE_PREFERENCE_BONUS
    ```

    `SOURCE_PREFERENCE_BONUS = 0.5` exported from
    `utils/timeline-score-factors.ts`. Result: a `+1` rating adds **+0.5** to
    `rank_score`, a `-1` rating subtracts the same. Steps of `0.25` give
    distinct nudges (`±0.125`, `±0.25`, …) without drowning out content
    signals.
25. **UI on `/feeds`**: a quantized control that maps to the seven values
    `{-1, -0.75, -0.5, -0.25, 0, +0.25, +0.5, +0.75, +1}` (DaisyUI
    `range` styled as steps, or an alternative join-button-group with
    `−` / `Passt` / `+` plus secondary slider). Behavior anchor:
    `data-testid="feed-weighting"`, `data-pref-value="<float>"`. Optimistic
    update with rollback on API error and a low-key toast „Quelle gewichtet —
    wirkt im nächsten Inflow-Refresh.“.
26. The new explicit weight is **independent** of the existing implicit
    `UserFeedEngagement` aggregation. Both can be on at the same time
    (no double-counting, separate code paths).
27. Tests:
    - Unit (`recomputeTimelineScoresForUser`): two items same source,
      `pref=+1` raises rank by `~SOURCE_PREFERENCE_BONUS` vs `pref=0`,
      mirrored for `-1`; intermediate `0.25` steps scale linearly.
    - Unit (PATCH): 401 unauth, 400 invalid value (`0.3`, `2`, `null`), 404
      on foreign feed, 200 happy path.
    - Unit (`GET /api/source-statuses`): includes `userPreferenceWeight`.
    - BDD: rate a source up → article from that source moves up in the
      inflow list (verified via stable IDs).

## Implementation notes

### Triage sort

```ts
const TRIAGE_ORDER: Record<string, number> = {
  failing: 0,
  blocked: 1,
  degraded: 2,
  needs_setup: 3,
  pending: 4,
  quiet: 5,
  paused: 6,
  healthy: 7,
}
```

Unknown / `no_snapshot` rows fall after `healthy` but before nothing — keep
them visible so users can spot a source we have not heard from yet.

### Pause / Resume

`UserFeed.active` already exists and is honoured by `GET /api/feeds`,
`GET /api/source-statuses`, and the inflow query. Reusing it keeps the model
small. Visual cue: a `paused` row uses `opacity-70` and a `Resume` button.

### `feed-stats` query shape

One DB round-trip per user; SQL or Prisma `groupBy` over `UserTimelineItem`
joined to `Article.crawlKey`. Cache-busting on PATCH preferences not required
(read freshness is fine, recomputed on next request).

### Score adjustment vs. existing slider

`engagement_positive` / `engagement_negative` (default 0) stay untouched. The
new bonus is additive, outside `computeWeightedScore`, with its own constant —
so its effect is independent of slider state. This matches the user’s mental
model: *“Mehr davon”* is a direct command, not a knob.

## Future follow-up

- Show preference next to article cards (e.g. „Mehr davon“ as a card-level
  micro-action) once `/` UX confirms the current granularity is right.
- Per-category and per-tag weighting following the same shape.
- Operator dashboard for `failing` / `blocked` clusters.

## Links

- PR(s): _to be added during implementation_
- Related: [`../archive/26-05-10-source-health-api-contract.md`](../archive/26-05-10-source-health-api-contract.md), [`operator-source-observability.md`](./operator-source-observability.md)
