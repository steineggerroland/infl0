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
- Fokus-Ringe auf **allen** interaktiven Elementen sichtbar und
  konsistent (aktuell uneinheitlich, v. a. in Einstellungen und
  Timeline-Chips).
- Reduced-motion-Unterstützung: keine dauerhaften Animationen ohne
  `prefers-reduced-motion`-Fallback.
- Landmark-Struktur (`<header>`, `<nav>`, `<main>`, `<footer>`)
  konsistent über alle Seiten prüfen.
- Skip-Link `#main` auch auf der App-Timeline (nicht nur auf `/help`).

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

### 3. Echte Integrationstests für `help.vue`

Der aktuelle Guard (`tests/unit/help-page-auth-coupling.test.ts`) ist
statisch. Sobald `@nuxt/test-utils/runtime` o. ä. eingezogen ist:
  - Mount `help.vue` in einer Mini-Nuxt-Instanz.
  - Assertion: keine Fetch-Anfrage an `/api/auth/me` geht raus.
  - Assertion: Back-Link-`href` ist `/`.

## Doku & Prozess

### 4. Commit-/Branch-Konvention explizit machen

Aktuell gemischte Stile in `git log`. Festlegen (z. B. Conventional
Commits, deutsches oder englisches Imperativ) und in
`docs/DEVELOPING.md` dokumentieren.

### 5. Roadmap-Pflege

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
