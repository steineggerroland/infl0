# Content, plain language and accessibility

This document is the house style for everything that reaches the user: UI
strings, help centre entries, error messages, field hints and the components
that carry them. It is opinionated on purpose: the app is built for people
with different attention and perception needs (including ADHD, autism, colour
vision deficiencies, screen reader users, motor impairments). Consistency is
itself an accessibility feature.

Read this before you touch `i18n/locales/*.json`, the `pages/help.vue`
content, or any user-facing component.

## Editorial principles

1. **Plain language first.** Every user-facing string should make sense to a
   non-technical reader. If a concept has a technical name, hide it in a
   help-centre detail block – never in the main UI.
2. **Progressive disclosure.** The default view answers the most common
   question in one sentence. Details live behind an expandable block
   ("Details for the curious"), a popover, or a help page.
3. **One vocabulary per concept.** Pick one term (e.g. "source", "sorting",
   "importance") and use it everywhere. Do not mix synonyms across screens.
4. **Action-oriented labels.** Buttons describe what happens ("Save source",
   "Turn on reading tracking"), not the tool ("Submit").
5. **Respect the user's time.** Put the most important information first.
   Avoid second sentences that add nothing.
6. **Never leak internals.** Strings like `SRP-6a`, `insertedAt`, `α/β`,
   `RSS/Atom`, placeholder factors, raw score floats, or HTTP paths do not
   belong in the main UI. They are welcome in the help centre under
   "Details for the curious".

### Quotation marks inside translation strings

JSON strings are delimited by straight double quotes (`"`). Never use a
straight `"` *inside* a translated value — the parser will close the string
early and the dev server will fail to boot.

- Prefer typographic quotes around UI labels, chosen per language:
  - German: `„Privatsphäre"` (U+201E opening, U+201C closing)
  - English: `"Privacy"` (U+201C opening, U+201D closing)
- If you do want straight quotes (e.g. inside code snippets), escape them:
  `"unter \"Privatsphäre\" abschalten"`.
- Quick validation before committing:
  ```bash
  node -e "JSON.parse(require('fs').readFileSync('i18n/locales/de.json','utf8'))"
  ```

### Writing checklist for new strings

- [ ] Does the sentence work for a tired reader on the first try?
- [ ] Is there a technical term that could be replaced with an everyday word?
- [ ] If the string introduces a security or privacy feature, is there also
      a help-centre entry it can link to via `SecurityBadge` or `InfoPopover`?
- [ ] Are German and English versions in sync (tone, length, terminology)?
- [ ] Is there at most one exclamation mark per screen? (Usually zero.)

## Page auth mode (`definePageMeta({ auth })`)

Every page declares how the global auth middleware should treat it. This
keeps "which routes are public?" a property of the page itself rather
than an allowlist in the middleware, which is easy to forget when new
pages are added.

| Mode                 | Use for                                         | Middleware behaviour                                    |
|----------------------|-------------------------------------------------|---------------------------------------------------------|
| `'public'`           | Pages independent of the account (`/help`)      | **No** call to `/api/auth/me`; always allowed.          |
| `'entry'`            | `/login`, `/register`                           | Calls `/api/auth/me`; signed-in users → `/`.            |
| `'required'` (default) | Everything else (timeline, settings, feeds…) | Calls `/api/auth/me`; signed-out users → `/login?redirect=…`. |

Declare it near the top of the page's `<script setup>`:

```vue
<script setup lang="ts">
definePageMeta({
  auth: 'public', // or 'entry' | 'required'
})
</script>
```

Rules of thumb:

- A "public" page must not import `useAuth…`, call `/api/auth/me`, or
  otherwise react to the sign-in state. If it needs to, it is not
  actually public — use `'required'` or `'entry'`.
- Never rely on an allowlist inside `middleware/auth.global.ts`. The
  middleware intentionally only reads `to.meta.auth` and delegates to the
  pure resolver in `utils/auth-decision.ts`.
- Back links on public pages stay neutral (`/`, labelled "Back"). Do not
  branch the target on the sign-in state; the middleware handles the
  redirect from `/` when needed.

Regression tests live in `tests/unit/auth-decision.test.ts`,
`tests/unit/auth-middleware.test.ts`, and
`tests/unit/help-page-auth-coupling.test.ts`. When touching the
middleware or adding a new `auth` mode, extend them first (TDD).

## Help centre (`/help`)

The help centre is data-driven via i18n. Do not fork the page markup to add
new topics.

### Adding a help entry

1. Add the copy to both `i18n/locales/de.json` and `i18n/locales/en.json`
   under `help.items.<id>` with the shape:
   ```json
   {
     "title": "Short question in the user's voice",
     "simple": "Two to four sentences in plain language.",
     "details": "Optional longer explanation with the precise technical details."
   }
   ```
2. The `<id>` becomes the URL anchor (`/help#<id>`). Keep it in
   `camelCase`, stable, and descriptive. Changing it breaks external links
   and `SecurityBadge` props.
3. Link to the entry from the feature it describes. Prefer
   `SecurityBadge` for security / privacy features and a plain `NuxtLink`
   otherwise.
4. If a topic is still in flux, do not publish it yet. Empty `details`
   blocks are fine — just omit the key.

### When to use what

| Surface                            | Use this                               |
|------------------------------------|----------------------------------------|
| Security / privacy feature promise | `SecurityBadge` near the control       |
| One-sentence "why" for a widget    | `InfoPopover` next to the widget       |
| Long explanations, background      | `/help#<anchor>` entry                 |
| Field validation errors            | Inline text next to the field          |
| Transient success / failure        | Toast via `useToast()`                 |

## UI components for explanations

### `SecurityBadge`

Use on any screen that introduces a privacy- or security-relevant feature
(password handling, data retention, sharing, export). Defaults describe the
SRP-based password protection; override `i18nPrefix` and `helpAnchor` to
reuse for another feature. Example:

```vue
<SecurityBadge
  i18nPrefix="security.dataResidency"
  helpAnchor="whereDataLives"
/>
```

The badge is a small pill with a lock icon, a single reassuring sentence, an
info trigger that opens a popover with two to four sentences of detail, and
a link to the full help entry. Do not use it for generic info — use
`InfoPopover` instead.

### `InfoPopover`

Use for short, contextual clarifications that are not security-related. The
trigger must carry a descriptive `triggerLabel` (e.g. "How we compute the
score", not "Info"). Pair the popover with a link to the full help entry
whenever the explanation has any depth.

## Accessibility baseline (WCAG 2.2 AA target)

New UI must satisfy at least this list. Reviewers should flag PRs that
regress any of it.

### Structure & semantics

- Every page has exactly one `<h1>`; heading levels do not skip.
- Primary content lives in a `<main id="main" tabindex="-1">` landmark;
  navigation in `<nav>`. The `tabindex="-1"` is not about tab order – it
  exists so the skip link can move keyboard / screen-reader focus into
  the content (without it, browsers only scroll).
- Every page carries a visible-on-focus **skip link** as the first
  element in the tab order. The link targets `#main` and is labelled
  with the shared i18n key `common.skipToMain` (never hard-coded).
  - Pages that use `layouts/app.vue` inherit both the landmark and the
    skip link from the layout – they must **not** render their own
    top-level `<main>` (double landmarks confuse assistive tech).
  - Pages with `definePageMeta({ layout: false })` (e.g. `help.vue`,
    `login.vue`, `register.vue`) provide both themselves.
  - There is currently **no automated check** for this contract –
    it is enforced by review. An automated Playwright / axe smoke
    is tracked in `docs/ROADMAP.md` §4.1. Until then, landmark and
    skip-link changes deserve explicit reviewer attention.
- Lists are `<ul>/<ol>`, not stacks of `<div>`s.
- Interactive elements are `<button>` or `<a>`, never a `<div>` with
  `@click`. The `tabindex` attribute is only for managing focus order on
  real controls, never to fake interactivity.

### Keyboard

- Every action reachable by mouse is reachable by keyboard.
- Visible focus on every interactive element. A **single baseline
  rule** in `assets/css/tailwind.css` gives every `<a>`, `<button>`,
  `<summary>`, form control and `[role="button|switch|menuitem|…"]` a
  `focus-visible` ring using `outline: 2px solid currentColor` +
  `outline-offset: 2px`. The rule lives inside `:where(...)` so its
  specificity stays at (0,0,0) and any component-level style still
  wins without `!important`. A minimal smoke test
  (`tests/unit/focus-visible-baseline.test.ts`) checks that the rule
  still exists at all; the *visual quality* of the ring is not
  automated yet and is covered by review until the Playwright / axe
  smoke from `docs/ROADMAP.md` §4.1 lands.
  - Don't turn off the baseline ring on a new component "because the
    design mockup doesn't show one". If a ring clashes with the
    design, change the colour via a Tailwind `focus-visible:outline-*`
    class on the component; never drop the ring entirely.
  - Programmatic focus targets (`tabindex="-1"`, e.g. our `<main>`)
    are excluded from the baseline – they're not controls.
- Global shortcuts (`w/s/e/q`, arrow keys) must not fire while a form
  control has focus. When adding new shortcuts, document them in
  `help.items.shortcuts` and show them in a future on-screen cheat sheet.
- Dialogs and popovers close on `Escape` and return focus to the trigger.

### Screen reader

- Buttons that only contain an icon need an `aria-label`. Decorative icons
  are `aria-hidden="true"`.
- Do not convey state through colour, position or shape alone — always add
  text, a symbol or `aria-*` attributes (e.g. score deltas use a
  sign and a symbol, not only colour).
- Tooltips via `data-tip` (DaisyUI) are CSS-only and invisible to screen
  readers. Mirror the information in text or `aria-label`.
- Loading and error states use `aria-busy` / `role="status"` /
  `role="alert"` where appropriate.

### Colour & contrast

- Minimum contrast 4.5:1 for body text, 3:1 for large text and UI chrome.
  Check with the browser devtools contrast picker before shipping.
- Never use red/green alone to carry meaning. Use red **and** a minus sign
  **and** a downward arrow.
- For numeric score directions (deltas, contributions, any
  increase/decrease indicator) use the shared `<ScoreDelta>`
  component (`components/ScoreDelta.vue`). It owns the three
  redundant cues in one place: the signed number, the shape-based
  glyph (hidden from assistive tech), and the translated
  `sr-only` direction label passed in by the caller. Colour stays
  at the call site via a `:class` on the enclosing element so the
  same component can be themed per page. Behavioural coverage
  lives in `tests/component/ScoreDelta.test.ts` – that is the
  single source of truth for "all three cues really render".
- Direction tokens and their glyph mapping come from
  `utils/score-indicator.ts` (`scoreDirection` / `scoreGlyph`).
  The concrete glyphs (currently ▲ / ▼ / · / —) are a product
  decision, not an API contract; tests pin properties (four
  distinct non-empty glyphs), not specific Unicode codepoints.
- Render glyph and number as **plain inline spans** (what
  `ScoreDelta` does), never `inline-flex items-center`. Triangles
  and digits have different intrinsic inline-box heights, and
  `items-center` will push them off each other's baseline –
  looks like a subtle layout bug to sighted users and confuses
  cognitive-load users who expect digits and indicator to line up.
- Light text on mid-grey backgrounds (`text-gray-500` on `bg-gray-400`) is
  almost always too low — push one shade further.

### Motion & sensory load

- Respect `prefers-reduced-motion`. Any animation longer than ~150 ms needs
  a reduced-motion fallback (typically a cross-fade or no animation).
- Scroll-snap should be `proximity`, not `mandatory`, unless we are certain
  users can still free-scroll.
- Avoid auto-playing video, parallax, or background motion.

### Forms

- Every input has a visible `<label>` (not just a placeholder).
- Required fields are marked textually, not only with colour.
- Inline errors are tied to the input via `aria-describedby` and
  `aria-invalid`.
- Password fields have `autocomplete="current-password"` /
  `"new-password"` as appropriate.

## Reviewer checklist

Before approving a PR that changes user-facing copy or UI, check:

- [ ] No new technical jargon in the main UI; jargon lives under
      `help.items.*`.
- [ ] New security / privacy features link to a help entry via
      `SecurityBadge`.
- [ ] Every interactive element is reachable and operable with keyboard
      only.
- [ ] Colour is never the sole carrier of meaning.
- [ ] Animations honour `prefers-reduced-motion`.
- [ ] German and English copy are in sync.

## Pointers

- Component: `components/SecurityBadge.vue`
- Component: `components/InfoPopover.vue`
- Page: `pages/help.vue`
- Strings: `i18n/locales/{de,en}.json` (`help.*`, `security.*`,
  `menu.help`)
- Developer setup: [`DEVELOPING.md`](./DEVELOPING.md)
