# Roadmap / Known follow-ups

Gedächtnisdokument für geplante, aber noch nicht umgesetzte Änderungen
an der App. Bevor wir einen Punkt umsetzen, bekommt er eine kurze
Problem­beschreibung, ein Zielbild und – falls möglich – eine Skizze,
wie wir das testen. Ist ein Eintrag abgearbeitet, streichen wir ihn
nicht, sondern verschieben ihn in den Abschnitt „Erledigt".

> Konvention: Einträge sind grob nach *Usability / Accessibility*,
> *Architektur* und *Doku* gruppiert. Innerhalb einer Gruppe liegt oben,
> was uns am meisten stört.

## Usability & Accessibility

### 1. Weitere bekannte A11y-Lücken aus der Erst-Analyse

Noch offen aus der ursprünglichen Auditrunde (Sprint 1 hat nur die
wichtigsten Sprachthemen adressiert):

- `<header>` / `<nav>` / `<footer>` (ergänzend zu `<main>`) auf weiteren
  Seiten prüfen (teilweise erledigt: `layouts/app.vue` + `AppUserMenu`;
  `pages/settings/*` mit Seiten-`<header>` und `SettingsPageFooter`;
  `pages/feeds.vue` mit gemeinsamer `AppFooterShortcuts`-Komponente).
  Offen z. B. neue Layout-Seiten ohne diese Baseline.

## Architektur

### 2. `/api/*` darf nie an die Nuxt-SPA weitergereicht werden

**Bereits umgesetzt (Stand Code):**

- SPA: `utils/auth-middleware.ts` / `middleware/auth.global.ts` — keine
  Auth-Redirects für Pfade unter `/api/*`.
- Unbekannte Routen: `server/api/[...path].ts` → `404` + JSON; Unit-Test
  in `tests/unit/api-catchall.test.ts`.
- Ohne Session: `server/api/auth/me.get.ts` → `401` via `createError`;
  Tests in `tests/unit/api-auth-me.test.ts`.
- Nitro: `server/middleware/00-api-json-content-type.ts` setzt für
  `/api/**` standardmäßig `Content-Type: application/json; charset=utf-8`.

**Noch offen / optional:**

- **CORS** explizit dokumentieren oder zentral setzen, falls wir
  Browser-Clients von anderen Origins unterstützen.
- **Nitro- oder E2E-Checks** (curl/Playwright) gegen einen laufenden
  Server, die `Content-Type` + Status für `/api/not-existing` und
  `/api/auth/me` ohne Cookie festnageln (über die bestehenden Unit-Tests
  hinaus).

### 4. Echte Integrationstests für `help.vue`

Der aktuelle Guard (`tests/unit/help-page-auth-coupling.test.ts`) ist
statisch. Sobald `@nuxt/test-utils/runtime` o. ä. eingezogen ist:
  - Mount `help.vue` in einer Mini-Nuxt-Instanz.
  - Assertion: keine Fetch-Anfrage an `/api/auth/me` geht raus.
  - Assertion: Back-Link-`href` ist `/`.

## Doku & Prozess

### 5. Testing-Philosophie

- **Grundsatz:** Tests prüfen *Verhalten*, nicht Implementierungs-
  interna. Source-Regex-Regressionsguards sind brüchig — sie
  scheitern bei harmlosen Refactors und übersehen echte Bugs, weil
  sie das Markup statisch matchen statt die App zu rendern.
- **Wann ein statischer/Regex-Test trotzdem OK ist:** wenn er eine
  *Architektur-Konvention* durchsetzt, die man nicht über Verhalten
  ausdrücken kann (z. B. „`help.vue` importiert nichts aus
  `~/server/auth`" — das ist eine Grenzziehung, kein Rendering).
  Solche Tests bleiben kurz, haben einen sprechenden Namen und einen
  Kommentar, *warum* sie Konvention und nicht Verhalten prüfen.
- **Für UI-/A11y-Invarianten:** auf Komponenten-Mount-Tests (`@vue/
  test-utils` + `happy-dom`) oder einen Playwright-/axe-Smoke setzen
  (siehe Sprint 7 in „Erledigt“). Nicht per Regex auf `.vue`-Source suchen.
- Quelle der Diskussion: Review-Runde nach Sprint 5. Vorher
  existierten u. a. `index-page-show-read`, `app-user-menu-show-
  read`, `personalization-color-redundancy`, `landmarks-and-skip-
  link` als reine Source-Regex-Guards — diese sind entfernt; die
  zugrunde liegenden Eigenschaften werden jetzt durch Composable-/
  Pure-Function-Tests, Doku und Review abgesichert.

### 6. Commit-/Branch-Konvention explizit machen

Aktuell gemischte Stile in `git log`. Festlegen (z. B. Conventional
Commits, deutsches oder englisches Imperativ) und in
`docs/DEVELOPING.md` dokumentieren.

### 7. Roadmap-Pflege

- Jeder neue Sprint zieht relevante Punkte aus diesem Dokument.
- Wenn wir im Review oder Gespräch eine neue Idee haben, landet sie
  **zuerst hier**, nicht direkt im Code. So vermeiden wir „angefangene,
  nie fertige" Refactors.

## Erledigt

*(Ab hier nur umgesetzte Punkte, mit Referenz auf den Commit oder PR.)*

- **Sprint 1 — Plain language & Help centre.** Jargon raus,
  `InfoPopover` / `SecurityBadge`, Hilfeseite `/help`,
  Editorial-Guidelines in `CONTENT_AND_A11Y.md`.
- **Sprint 1.1 — Auth-Entkopplung & TDD.** `definePageMeta({ auth })`,
  pure `resolveAuthDecision`, `runAuthMiddleware`, Regressions-Tests
  inkl. erstem Komponenten-Test (`InfoPopover`). README auf
  Projekt-Konventionen getrimmt.
- **Sprint 2 — Timeline-Toggle „Gelesene anzeigen".** Schwebendes
  Overlay entfernt, Toggle in `AppUserMenu` unter einer neuen
  Sektion „Ansicht" verschoben, gemeinsamer Zustand via
  `useTimelinePreferences` (pure Helper + Nuxt-Wrapper mit
  `localStorage`-Hydration). Tastenkürzel `r` zum Umschalten; im
  Hilfe-Eintrag `shortcuts` dokumentiert. Regressions-Tests in
  `index.vue` und `AppUserMenu.vue` sowie Composable-Test in
  happy-dom.
- **Sprint 2.1 — Robustheit aus externem Review (Teil 1).**
  - `useTimelinePreferences` persistiert jetzt über einen
    writable `computed`-Setter statt eines `watch()`. Dadurch
    überlebt die Persistenz Mount/Unmount/Remount (vorher: Watcher
    starb mit dem ersten Component-Scope, `hydrated`-Flag
    verhinderte Neu-Registrierung). Regressionstest in
    `tests/component/useTimelinePreferences.test.ts`.
  - `pages/index.vue`-Regression kompakter: ein einziger
    „kein `<Teleport>`"-Guard mit ausführlichem *Warum*-Kommentar,
    statt mehrerer Punktchecks auf die konkrete Alt-Implementierung.
- **Sprint 5 — Farb-unabhängige Score-Richtungen.** In
  `pages/settings/personalization.vue` wurden Delta- und
  Contribution-Zahlen bisher nur per `text-emerald-300` / `text-
  amber-300` unterschieden – ein klassischer WCAG-1.4.1-Fall für
  Rot-Grün-Schwäche. Neue pure Helfer `scoreDirection` /
  `scoreGlyph` (`utils/score-indicator.ts`) liefern eine
  farb-unabhängige Richtung plus ein Form-Glyph (▲/▼/·/—). Die
  Seite rendert jetzt signiertes Zahlenformat (`fmtSigned`),
  Glyph (`aria-hidden`) und übersetztes `sr-only`-Label – Farbe
  ist die vierte, rein dekorative Ebene. Abgesichert durch
  `tests/unit/score-indicator.test.ts` (Helfer: Direction-
  Mapping + „vier verschiedene, nicht-leere Glyphen"). Der
  konkrete Glyph wird bewusst **nicht** gepinnt — ein
  Designwechsel soll nicht jedes Mal den Test brechen.
- **Sprint 5.1 — Glyph-Baseline-Fix, `<ScoreDelta>` & Test-
  Entschlackung.**
  - Baseline-Versatz des Dreieck-Glyphs in der Personalization-
    Seite behoben: Glyph + Zahl rendern als plain inline spans,
    nicht mehr in `inline-flex items-center`. Triangles und
    Ziffern haben unterschiedlich hohe Inline-Boxen; Flex-Zentrierung
    hat den Glyph sichtbar nach oben versetzt.
  - Render-Muster in `components/ScoreDelta.vue` extrahiert
    (signed number + aria-hidden Glyph + `sr-only`-Label). Die
    Personalization-Seite ruft es an den beiden vorherigen
    Stellen auf. Damit wandert die WCAG-Absicherung der
    redundanten Richtungs-Cues aus Source-Regex in echte
    Component-Mount-Tests (`tests/component/ScoreDelta.test.ts`):
    Verhalten statt Template-Strings.
  - Source-Regex-Regressionsguards zusammengestrichen (siehe
    Testing-Philosophie in Abschnitt 5): entfernt wurden
    `tests/unit/index-page-show-read.test.ts`,
    `tests/unit/app-user-menu-show-read.test.ts`,
    `tests/unit/personalization-color-redundancy.test.ts`
    (ersetzt durch den Mount-Test auf `ScoreDelta`),
    `tests/unit/landmarks-and-skip-link.test.ts` (wandert nach
    4.1 in einen Playwright-Smoke; bis dahin Review).
    `tests/unit/focus-visible-baseline.test.ts` auf einen
    Ein-Zeilen-Smoke reduziert; die Doku wurde angepasst, damit
    sie nicht mehr mehr verspricht, als der Test prüft.
    `tests/unit/score-indicator.test.ts` prüft nur noch
    Eigenschaften, nicht mehr die konkreten Unicode-Glyphen.
- **Sprint 4 — Einheitliche Fokus-Ringe.** Globaler `:where(...)
  :focus-visible`-Layer in `assets/css/tailwind.css`: jedes `<a>`,
  `<button>`, `<summary>`, Formular­feld und `[role="button|switch|
  menuitem|…"]` bekommt automatisch einen `outline: 2px solid
  currentColor` mit `outline-offset: 2px`. Spezifität null, damit
  Komponenten-Overrides ohne `!important` gewinnen. Regel in
  `docs/CONTENT_AND_A11Y.md` dokumentiert; ein schlanker Smoke-
  Test in `tests/unit/focus-visible-baseline.test.ts` stellt nur
  sicher, dass die Regel überhaupt noch existiert — die visuelle
  Qualität verantwortet Review und (perspektivisch) der
  Playwright-Smoke aus 4.1.
- **Sprint 3 — Skip-Link + `<main>`-Landmark app-weit.** Einheitlicher
  Skip-Link (`common.skipToMain` → `#main`) plus
  `<main id="main" tabindex="-1">` auf jeder Seite. `layouts/app.vue`
  stellt beides zentral bereit; layoutlose Seiten (`help`, `login`,
  `register`) tragen eigene Kopien. `help.vue` hat die historische
  `help-main`-ID abgelegt und nutzt jetzt die gemeinsame `main`-ID.
  Regel in `docs/CONTENT_AND_A11Y.md` kodifiziert; Durchsetzung
  bis zum Playwright-Smoke per Review.
- **Sprint 6.1 — `<dialog>`-Close-Sync.**
  - Externes Review nach Sprint 6 hat einen State-Desync-Bug
    aufgedeckt: `<dialog>` hat drei native Schließpfade
    (`Escape`, Backdrop, `<form method="dialog">`-Button), die
    das Script überspringen. `modalVisible` blieb damit nach
    einem User-Dismiss auf `true`, `useModalStack().anyOpen`
    ebenfalls, und die Hintergrund-Shortcuts (`w/s`, Pfeile,
    `r`, `e`) blieben stumm, obwohl das Modal zu war. Besonders
    unangenehm, weil die UI den Esc-Pfad explizit bewirbt
    (`article.modalKeyboardHint`).
  - Fix in `components/ArticleView.vue`: `@close` und `@cancel`
    an das `<dialog>`-Element gebunden, Handler `onDialogClose`
    ist jetzt der alleinige Schreiber auf `modalVisible = false`.
    Programmatische `.close()`-Aufrufe mutieren `modalVisible`
    nicht mehr selbst, damit es nur einen Pfad gibt.
    `resolveEngagementSegment()` zieht sich dadurch automatisch
    von `body` zurück (der Watcher auf `modalVisible` feuert
    jetzt auch im Native-Close-Fall).
  - Neue Behavioural-Regression
    `tests/component/modal-stack-dialog-sync.test.ts`: Harness
    mit derselben Verdrahtung wie ArticleView (Stack-
    Registrierung + `@close`/`@cancel` auf `<dialog>`); prüft
    Open-/Programm-Close-/Native-Close- und Cancel-Pfade sowie
    das Reopen-nach-Dismiss, damit kein stale State bleibt.
  - Regel in `docs/CONTENT_AND_A11Y.md` ergänzt: jede
    `<dialog>`-Surface im Modal-Stack muss `@close`/`@cancel`
    zurücksynchronisieren; programmatisches Mutieren der
    `isOpen`-Ref ist verboten.
- **Sprint 7 — Playwright/axe Smoke für A11y-Layout-Invarianten.**
  - Browser-Smoke eingeführt: `tests/e2e/a11y-layout-smoke.spec.ts`
    prüft für `/`, `/help`, `/login` die Struktur-/Fokus-Invarianten:
    genau ein `<main id="main">`, Skip-Link-Fokusfluss (`Tab` →
    Skip-Link → `Enter` fokussiert `<main>`), sichtbarer Focus-Ring
    und keine `critical`/`serious` axe-Verstöße.
  - Tooling ergänzt: `playwright.config.ts`, npm-Script `test:e2e`,
    Dependencies `@playwright/test`, `@axe-core/playwright`,
    `start-server-and-test`.
  - Laufzeit-Setup: `test:e2e` baut zuerst (`npm run build`) und
    startet dann Nitro aus `.output/server/index.mjs` auf
    `127.0.0.1:4275`. `start-server-and-test` wartet auf
    `http://127.0.0.1:4275/help` (öffentliche 200-Route; `/` allein
    würde ausgeloggt nach `/login` redirecten und `wait-on` nie 200
    sehen), bevor Playwright ausgeführt wird. So vermeiden
    wir den früheren `EMFILE`-Watcher-Fehler aus `nuxt dev`.

- **Sprint 7.1 — Reduced motion + App-Chrome-Landmarks.**
  - `prefers-reduced-motion: reduce`: Kartenflip per sofortiger
    Flächenumschaltung statt 3D-Keyframes (`ArticleView.vue`), kein
    Dauer-Puls (`FlipArrow.vue`), Toasts ohne Slide (`ToastHost.vue`),
    Falt-Ecke ohne Transition (`CornerFold.vue`). Kurz dokumentiert
    unter „Motion & sensory load“ in `docs/CONTENT_AND_A11Y.md`.
  - `layouts/app.vue`: schwebendes Menü in `<header>` (per Teleport an
    `body`). `AppUserMenu.vue`: Panel in `<nav aria-label>`, Strings
    `menu.navLandmark` in `i18n/locales/{de,en}.json`.

- **Sprint 7.2 — Settings: Footer-Landmark + Kurznavigation.**
  - Gemeinsame Komponente `components/SettingsPageFooter.vue`: `<footer>`
    mit `<nav aria-label>` (`settingsCommon.footerNav`) und Links zu `/`
    sowie `/help`; per **`Teleport` zu `body`** (plus `ClientOnly`), damit
    der Footer **nicht** innerhalb von `<main>` liegt und als Seiten-
    **`contentinfo`**-Landmark zählen kann.
  - `pages/settings/personalization.vue` (Breite `container-max="4xl"`),
    `privacy.vue`, `timeline-score.vue`.
  - Komponententest `tests/component/SettingsPageFooter.test.ts`
    (Teleport vs. `<main>`).
  - `docs/CONTENT_AND_A11Y.md` (Struktur-Baseline) und offener Punkt §1
    in diesem Dokument angepasst.

- **Sprint 7.3 — Feeds: gleiche Footer-Kurznavigation + Extrakt `AppFooterShortcuts`.**
  - Markup in `components/AppFooterShortcuts.vue` ausgelagert; Wrapper
    `SettingsPageFooter.vue` setzt `data-testid="settings-page-footer"`.
  - `pages/feeds.vue` nutzt `AppFooterShortcuts` (`data-testid="feeds-page-footer"`).
  - Authed Playwright: `settings-smoke.spec.ts` prüft `/feeds`-Footer.

- **Sprint 7.4 — `/api/*` JSON-Baseline (Nitro-Middleware).**
  - `server/middleware/00-api-json-content-type.ts`: für `/api/**`
    `Content-Type: application/json; charset=utf-8` als Default.
  - ROADMAP §2 auf „größtenteils erledigt“ gekürzt; CORS / Server-E2E
    bleiben optional.

- **Sprint 6 — Modal-Stack & Shortcut-Scoping (vormals §3).**
  - Fachlicher Bug: Öffnen des Volltexts zu einem Artikel und
    anschließendes `w`/`s` ließen den Hintergrund-Artikel
    wechseln – der Volltext im Modal passte danach nicht mehr
    zum Hintergrund.
  - Lösung: `defineShortcuts` hat jetzt ein `when: () => boolean`
    und ein `skipEditableTarget: boolean`. Der neue Composable
    `useModalStack()` (plus `useModalStackRegistration(isOpen)`)
    ist die zentrale „irgendein Overlay offen?"-Wahrheit. Die
    Timeline-Shortcuts (`w/s/↑/↓/r`) und die Card-Flip-Keys
    (`e`, `Escape` zum Zurückdrehen) gaten auf
    `!anyModalOpen.value` — der Modal-eigene `q`-Toggle bleibt
    ausgenommen. `<dialog>` im `ArticleView` und `InfoPopover`
    registrieren sich beim Öffnen/Schließen im Stack.
  - Bypass-Stelle geräumt: `InfoPopover.vue` hört nicht mehr
    direkt auf `keydown`, sondern ruft `defineShortcuts` mit
    `{ when: () => open.value, skipEditableTarget: true }`. Der
    Modifier-Chord-Guard greift damit auch für Popover-Escape
    (kein `Cmd+Escape`-Missbrauch mehr).
  - UX-Signal: Oben im Volltext-Modal steht ein dezenter
    Tastatur-Hinweis („Esc schließt · w/s navigieren nach dem
    Schließen") — Nutzer:innen mit ADHS/Autismus müssen nicht
    raten, warum ihre gewohnten Keys hier pausieren. Hilfetext
    `help.items.shortcuts.details` nachgezogen.
  - Abgesichert durch `tests/component/useShortcuts.test.ts`
    (neue Suites für `when`-Scope und `skipEditableTarget`),
    `tests/component/useModalStack.test.ts` (Counter- und
    Registrierungs-Verhalten inkl. Auto-Release bei Unmount)
    und `tests/component/InfoPopover.test.ts` (Cmd+Escape
    schließt nicht; `<input>` im Popover + Escape schließt doch).

- **Sprint 2.2 — Shortcut-Hygiene in `defineShortcuts`.**
  - Shortcuts feuern nicht mehr, wenn der Fokus in `<input>`,
    `<textarea>`, `<select>` oder einem `contenteditable` liegt —
    stimmt endlich mit der Zusage im Hilfe-Eintrag überein. Pure
    Helper in `utils/editable-target.ts` mit eigenen Unit-Tests.
  - Shortcuts feuern nicht mehr, wenn `Ctrl`, `Meta` oder `Alt`
    gehalten werden. Ursache des konkreten Bugs: `Cmd+R` (Seite
    neuladen) hat zusätzlich den `r`-Shortcut ausgelöst und
    `showRead` bei jedem Reload geflippt. `Shift` bleibt erlaubt
    (Casing-Modifier, kein Chord).
  - Abgesichert durch Mount-/Dispatch-Tests in
    `tests/component/useShortcuts.test.ts`.
