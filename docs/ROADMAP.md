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

- Farb­abhängige Zustände im Timeline-Score prüfen (kein „nur Farbe").
- Reduced-motion-Unterstützung: keine dauerhaften Animationen ohne
  `prefers-reduced-motion`-Fallback.
- `<header>` / `<nav>` / `<footer>` (ergänzend zu `<main>`)
  konsistent über alle Seiten prüfen (aktuell uneinheitlich – z. B.
  kein `<nav>` in `AppUserMenu`, Überschrift-`<header>` auf Settings-
  Seiten nur innerhalb der Karte statt oben auf der Seite).

## Architektur

### 2. `/api/*` darf nie an die Nuxt-SPA weitergereicht werden

- **Symptom:** Ein Aufruf einer nicht existierenden `/api/...`-Route
  (oder einer, für die der Benutzer nicht eingeloggt ist) zeigt aktuell
  die Login-Seite, weil die globale Auth-Middleware auf die Seite
  wirkt. Für API-Clients ist das falsch: sie erwarten JSON und einen
  HTTP-Statuscode, keinen HTML-Redirect.
- **Warum das schlecht ist:**
  - Verletzt die Erwartung „`/api/*` ist immer ein strukturierter
    API-Endpunkt".
  - Erschwert Debugging (curl bekommt HTML).
  - Koppelt serverseitige Middleware an clientseitige Routen.
- **Zielbild:**
  - Eine **Server-Middleware** für `/api/**` (Nitro
    `server/middleware/api-*.ts`), die:
    - Nicht existierende API-Pfade direkt mit `404` + JSON
      beantwortet (`{ statusCode: 404, message: 'Not found' }`).
    - Bei fehlendem Auth-Cookie mit `401` + JSON antwortet
      (statt auf `/login` umzuleiten).
    - CORS / Content-Type konsistent auf `application/json` setzt.
  - Die Route-Middleware `auth.global.ts` rührt **ausschließlich**
    SPA-Seiten an – nie `/api/*`.
- **Akzeptanzkriterien:**
  - `curl -i http://localhost:3000/api/not-existing` → `404`,
    Content-Type `application/json`.
  - `curl -i http://localhost:3000/api/auth/me` ohne Session →
    `401`, JSON-Body.
  - `GET /api/...` führt unter keinen Umständen zur Login-Seite.
  - Bestehende Endpunkte verhalten sich unverändert.
- **Tests (geplant):**
  - Nitro-Integrationstests (`@nuxt/test-utils/e2e` oder manuell per
    `supertest`) für `/api/unknown`, `/api/auth/me` ohne Session, und
    einen geschützten Endpunkt mit Session.
  - Abgrenzungstest: Route-Middleware `runAuthMiddleware` wird für
    `/api/…`-Pfade **nicht** aufgerufen (bzw. kurz vorher abgelehnt).

### 3. Keydown-Listener außerhalb `defineShortcuts` als Invariante festigen

- **Hintergrund:** Der globale Guard gegen Modifier-Chords (`Ctrl`,
  `Meta`, `Alt`) und fokussierte Eingabefelder wirkt nur für
  Tastenkürzel, die durch `defineShortcuts` registriert werden.
  Eigene `document.addEventListener('keydown', …)`-Stellen umgehen
  ihn und können die gleiche Fehlerklasse zurückbringen (z. B.
  `Cmd+R` löst App-Logik statt Page-Reload aus).
- **Bekannte Bypass-Stelle:** `components/InfoPopover.vue` hört
  global auf `Escape`, um das Popover zu schließen. Als
  Dismiss-Konvention (ARIA) ist das vertretbar, aber nicht
  dokumentiert und nicht getestet gegen Modifier-Kombinationen.
- **Zielbild (eine Option wählen):**
  1. `defineShortcuts` um einen Scope-/Bedingungs-Parameter
     erweitern (z. B. `when: () => open.value`) und InfoPopover
     darauf umstellen. Dann gilt der zentrale Guard automatisch.
  2. Ausnahme belassen, aber in `docs/CONTENT_AND_A11Y.md`
     kodifizieren: „Neuer roher `addEventListener('keydown')`
     braucht einen Kommentar mit Begründung plus Test gegen
     Modifier-Chords." Optional eigene ESLint-Regel.
- **Akzeptanzkriterien:**
  - Beim Hinzufügen einer neuen Keyboard-Interaktion fällt einem
    Reviewer sofort auf, ob sie durch `defineShortcuts` geht oder
    nicht.
  - Für jede Bypass-Stelle existiert ein Test, der `Cmd+<Key>`
    bzw. `Ctrl+<Key>` und Eingabefeld-Fokus abdeckt.
- **Tests (geplant):** Komponententest für InfoPopover, der
  bestätigt, dass `Cmd+Escape` das Popover **nicht** schließt und
  ein `<input>` darin mit `Escape` weiter das Popover schließen
  darf (Standard-Dismiss-Verhalten).

### 4. Echte Integrationstests für `help.vue`

Der aktuelle Guard (`tests/unit/help-page-auth-coupling.test.ts`) ist
statisch. Sobald `@nuxt/test-utils/runtime` o. ä. eingezogen ist:
  - Mount `help.vue` in einer Mini-Nuxt-Instanz.
  - Assertion: keine Fetch-Anfrage an `/api/auth/me` geht raus.
  - Assertion: Back-Link-`href` ist `/`.

## Doku & Prozess

### 5. Commit-/Branch-Konvention explizit machen

Aktuell gemischte Stile in `git log`. Festlegen (z. B. Conventional
Commits, deutsches oder englisches Imperativ) und in
`docs/DEVELOPING.md` dokumentieren.

### 6. Roadmap-Pflege

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
- **Sprint 4 — Einheitliche Fokus-Ringe.** Globaler `:where(...)
  :focus-visible`-Layer in `assets/css/tailwind.css`: jedes `<a>`,
  `<button>`, `<summary>`, Formular­feld und `[role="button|switch|
  menuitem|…"]` bekommt automatisch einen `outline: 2px solid
  currentColor` mit `outline-offset: 2px`. Spezifität null, damit
  Komponenten-Overrides ohne `!important` gewinnen. Regel in
  `docs/CONTENT_AND_A11Y.md` dokumentiert, abgesichert durch
  `tests/unit/focus-visible-baseline.test.ts`.
- **Sprint 3 — Skip-Link + `<main>`-Landmark app-weit.** Einheitlicher
  Skip-Link (`common.skipToMain` → `#main`) plus
  `<main id="main" tabindex="-1">` auf jeder Seite. `layouts/app.vue`
  stellt beides zentral bereit; layoutlose Seiten (`help`, `login`,
  `register`) tragen eigene Kopien. `help.vue` hat die historische
  `help-main`-ID abgelegt und nutzt jetzt die gemeinsame `main`-ID.
  Regel in `docs/CONTENT_AND_A11Y.md` kodifiziert und durch
  `tests/unit/landmarks-and-skip-link.test.ts` abgesichert.
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
