# Paket: Tastaturkürzel, Hilfe & Übersicht

## Status

Entwurf — folgt auf die **gelieferte** Darstellungs- und Lesbarkeitsfunktion
in der App; Details und Akzeptanzkriterien werden separat abgestimmt.

## Ziel

Lesbarkeits- und App-Kürzel sind **für Nutzerinnen nachvollziehbar** dokumentiert: wo sie gelten, welche Taste was tut, und wie sie in der (oder den) zentralen **Shortcuts-/Hilfe-Oberfläche(n)** erscheinen. Das schließt die Lücke zur bisherigen Hilfeseite (dort: Timeline-Kürzel, aber noch keine vollständige Lesbarkeits-Matrix) — **hier** liegt die Konsolidierung.

## Nicht-Ziele

- Eine vollständige, produktweite Tastatur-Map aller künftigen Aktionen (kann iterativ wachsen).
- Änderung der `defineShortcuts`- oder Fokus-Regeln — bleibt im jeweiligen Feature-/Refactoring-Kontext.

## Abhängigkeiten

- Stabilisierung der in der **App** eingeführten Lesbarkeits-Tasten (`ArticleView`, `useShortcuts`), soweit noch nachgezogen.
- Entscheidung, ob **eine** zentrale Hilfeseite, ein Modal oder ein eigenes Untermenü die „Shortcuts-Übersicht“ trägt.

## Akzeptanzkriterien

1. Kürzel für Lesbarkeit (Schriftgröße, Schriftart wechseln, o.ä., wie in der App umgesetzt) sind an **einem** vereinbarten Ort in der Hilfe beschrieben.
2. Tastenbelegungen und Einschränkungen (z. B. nur bei fokussierter/gewählter Kachel, kein Triggern in Eingabefeldern) sind für Nutzerinnen **in Klartext** erkennbar.
3. (Optional) E2E-Smoke prüft lediglich, dass der Hilfepfad/Anker **lädt** und die dokumentierte Sektion **vorhanden** ist — ohne die gesamte Shortcut-Matrix in Playwright abzubilden.

## Umsetzungshinweise

- Relevante Pfade: `pages/help.vue`, `composables/useShortcuts.ts`, ggf. i18n.
- Risiko: doppelte oder veraltete Listen — eine Quelle (z. B. geteilte Konstanten oder generierte Tabelle) ist langfristig sinnvoll, nicht Teil dieses Entwurfs.

## Links

- PR: *(noch offen)*
- Diskussion: `ROADMAP.md`, `planned/README.md`
