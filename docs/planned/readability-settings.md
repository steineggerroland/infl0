# Paket: Lesbarkeit, Theme, Motion (Settings)

## Status

Entwurf

## Ziel

Nutzerinnen können **Leseabstand**, **Schriftgröße** (und optional Schriftart),
**Hell/Dunkel/System** sowie **reduzierte Bewegung** unabhängig vom
OS-`prefers-reduced-motion` zentral in den Einstellungen steuern — mit
sofort sichtbarer Wirkung in der App und ohne FOUC beim Theme-Wechsel.

## Nicht-Ziele

- Komplettes Redesign aller Screens; nur Tokens / Root-Attribute / bestehende
  Komponenten anbinden.
- Eigene Schriftarten hosten (erst einmal System-Stack oder bestehende
  Webfonts, falls schon im Projekt).

## Abhängigkeiten

- Bestehende Settings-Navigation und Persistenz-Pattern (z. B. analog
  Timeline-/Privacy-Prefs).
- Abstimmung mit `docs/CONTENT_AND_A11Y.md` (Fokus, Kontrast, Motion).

## Akzeptanzkriterien (MVP)

1. Theme: mindestens **Hell**, **Dunkel**, **System**; Auswahl persistiert
   (Account oder Gerät — festlegen).
2. „Reduzierte Bewegung“: App-weites Flag (z. B. `data-reduced-motion` oder
   Klasse am Root), das **zusätzlich** zum Media-Query greift, wenn in den
   Settings aktiviert.
3. Leseparameter: mindestens **Schriftgröße** und **Zeilenabstand** in
   diskreten Stufen; wirkt auf Artikel- und Hilfetext (Scope im PR
   festnagel).
4. Keine Regression der bestehenden A11y-Smokes; neue Einstellungen in
   Hilfe oder Kurztooltip verlinkt, wo sinnvoll.

## Links

- Produktkontext: `docs/ROADMAP.md` (Darstellung / Settings).
- Nach Umsetzung: Eintrag unter `docs/CHANGELOG.md` → `[Unreleased]`.
