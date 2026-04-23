# Geplante Feature-Pakete

Hier liegen **konkrete Umsetzungspakete**: abgrenzbarer Scope, Reihenfolge,
Akzeptanzkriterien — getrennt von der großen Ideensammlung in
[`../ROADMAP.md`](../ROADMAP.md).

## Konvention

- **Eine Datei pro Paket** (oder pro größerem Thema), z. B.
  `readability-settings.md`, `shortcuts-overview.md`.
- Oben: **Ziel**, **Nicht-Ziele**, **Abhängigkeiten**, optional **Schätzung /
  Risiko**.
- Unten: **User Stories** oder Checkliste, **Definition of Done**, Links zu
  PRs/Issues wenn vorhanden.
- Neues Paket: Kopie von [`_template.md`](./_template.md), Dateiname in
  `kebab-case.md`.

## Index

| Paket | Kurzbeschreibung | Status |
|-------|------------------|--------|
| [`readability-settings.md`](./readability-settings.md) | Lesbarkeit pro Surface (Karten/Reader), freie Farben + Presets, Motion, Shortcuts | Umgesetzt *(Hilfe/Kürzelliste → shortcuts-help; E2E → Onboarding-Paket)* |
| [`shortcuts-help.md`](./shortcuts-help.md) | Hilfetext + Shortcuts-Übersicht (Follow-up; Kürzel-Doku außerhalb des Lesbarkeits-Pakets) | Entwurf |
| [`onboarding-welcome-timeline.md`](./onboarding-welcome-timeline.md) | Willkommen per festen Kacheln (Shortcuts, Themes, Quellen, App-Logik), Grundlage für E2E mit Registrierung+Login | Entwurf |

*(Weitere Pakete: Zeile hinzufügen, wenn ein neues Markdown angelegt wird.)*

## Reihenfolge (Vorschlag, nicht verbindlich)

1. Lesbarkeit / Theme / Motion in den Settings (schneller Nutzen, wenig
   Abhängigkeiten).
2. Onboarding / Welcome-Timeline (feste Einführungskacheln, optional E2E-
   Umstellung weg von reiner Dev-Seed).
3. Explizites „Capture“ (Sammlung / Wissen) **ohne** LLM.
4. Größere Produktblöcke (Wissen-Menü, Suche, …) jeweils eigenes Paket.
