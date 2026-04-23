# Geplante Feature-Pakete

Hier liegen **konkrete Umsetzungspakete**: abgrenzbarer Scope, Reihenfolge,
Akzeptanzkriterien — getrennt von der großen Ideensammlung in
[`../ROADMAP.md`](../ROADMAP.md).

## Konvention

- **Eine Datei pro Paket** (oder pro größerem Thema), z. B.
  `shortcuts-help.md`, `onboarding-welcome-timeline.md`.
- Oben: **Ziel**, **Nicht-Ziele**, **Abhängigkeiten**, optional **Schätzung /
  Risiko**.
- Unten: **User Stories** oder Checkliste, **Definition of Done**, Links zu
  PRs/Issues wenn vorhanden.
- Neues Paket: Kopie von [`_template.md`](./_template.md), Dateiname in
  `kebab-case.md`.

## Index

| Paket | Kurzbeschreibung | Status |
|-------|------------------|--------|
| [`shortcuts-help.md`](./shortcuts-help.md) | Hilfetext + zentrale Shortcuts-Übersicht (v. a. Lesbarkeits- und App-Kürzel) | Entwurf |
| [`onboarding-welcome-timeline.md`](./onboarding-welcome-timeline.md) | Willkommen per festen Kacheln (Shortcuts, Themes, Quellen, App-Logik), Grundlage für E2E mit Registrierung+Login | Entwurf |

*(Weitere Pakete: Zeile hinzufügen, wenn ein neues Markdown angelegt wird.)*

## Reihenfolge (Vorschlag, nicht verbindlich)

1. Shortcuts / Hilfe (`shortcuts-help.md`) und ggf. Onboarding-
   Einführung (`onboarding-welcome-timeline.md`) — wenig
   Seiteneffekte, verbessert Auffindbarkeit und Testbarkeit.
2. Später: explizites „Capture“ (Sammlung / Wissen) **ohne** LLM, dann
   größere Produktblöcke (Wissen-Menü, Suche, …) je eigenes Paket (siehe
   `ROADMAP.md`).
