# Paket: Onboarding · Welcome-Timeline · E2E-Grundlage

## Status

Entwurf

## Ziel

**Nutzerinnen:** Frisch registrierte Accounts erhalten **sofort** eine sinnvolle, erklärende **Start-Timeline** — nicht eine leere Fläche und nicht von Hand eingespielte Dev-Daten. Vorgefertigte Kacheln führen in die **Kernidee** der App, **Tastaturkürzel**, **Themes / Anpassbarkeit** (Hinweis auf Settings), **Quellen (Feeds)** und die **grundsätzliche Funktionsweise** (Lesen, Timeline, o.ä.) ein. Die Inhalte sind **Lese-Kacheln** (wie echte Artikel), damit dieselben Flächen (Vorder- und Rückseite, ggf. Volltext) und Interaktionen genutzt werden, die im Alltag zählen.

**Produkt / Qualitätssicherung:** End-to-end-Tests, die **einen angemeldeten Zustand** brauchen, laufen künftig auf einem **vorhersagbaren, produktionsnahen** Pfad: **Registrierung (oder Garantie eines leeren Onboarding-Accounts) → Anmeldung → Arbeit auf den festspezifizierten Onboarding-Kacheln** (Shortcuts, Einstellungen, Lesefluss). So entfällt die Abhängigkeit von `devData` / manuellen Seeds für Timelines in E2E, soweit diese Tests inhaltlich an **dieselben** Kacheln andocken.

## Nicht-Ziele

- Vollständiges interaktives Tutorial mit Wizard, Gamification oder Pflicht-Checklisten zwischen einzelnen Schritten (eher **optionale, scrollbare** Einführung in der normalen Timeline).
- Ersetzung aller bisherigen E2E-Szenarien in einem Rutsch: Migration schrittweise; Paket liefert **Zielbild** und **Priorität** für E2E-Umstellung.
- Doppelte Pflege: Onboarding-Texte sollten **eine** Quelle (z. B. i18n + serverseitig bereitgestellte „System-Artikel“) haben, keine copy-paste-Abweichung zur Hilfeseite.
- Detaillierte Kapitel-Struktur aller zukünftigen E2E-Tests — das bleibt den jeweiligen Specs; hier nur **Rahmen** (Kacheln, Auth-Pfad, Nutzung derselben Artikel-IDs/Handles).

## Abhängigkeiten

- **Kontoanlage** und SRP-Login (bereits vorhanden); ggf. Erweiterung, wenn „erster Login“ getrackt werden soll (Flag `onboardingVersion` o.ä.).
- **Serverseitige oder deterministische Referenz** auf **genau N** (z. B. **vier)** feste Artikel- oder Timeline-Einträge pro neuem User — Schema/Migration, `upsert` nach Registrierung, oder `User`-gebundene Einspeisung, gekoppelt an eine **definierte** `crawlKey`/Quelle „System/Welcome“.
- **Lesbarkeits- / UI-Pakete** (Themes, Surfaces) nur als **inhaltliche** Verweise in den Kacheln; technische Abhängigkeit gering, solange Kartenfläche und Reader funktionieren.
- Bestehende oder geplante Doku: [`shortcuts-help.md`](./shortcuts-help.md) (Kürzel-Inhalt soll mit Onboarding inhaltlich harmonieren).

## Akzeptanzkriterien

1. **Vier sinnvoll getrennte Kacheln** (mindestens vier; Abgrenzung pro Thema, Reihenfolge definiert), die zusammen Einstieg, Shortcuts, Themes/Settings, Quellen/Funktionsweise abdecken — Text und Struktur in **DE/EN** (oder so im Paket vorgegeben, dass i18n klar ist).
2. **Neue Nutzer** sehen diese Kacheln **in der eigenen** Timeline, ohne manuelles `devData` oder Feed-Subscriben (Mechanismus im Paket: z. B. `user_timeline` nach Sign-up, fester Inhalt, Versionierung).
3. **E2E-Rahmen** dokumentiert: Specs, die authed Features testen, nutzen **Registrierung + Login** und wechseln auf **bekannte** `data-testid` / Artikel-IDs / feste Titel, die zu den Onboarding-Kacheln gehören; Lesbarkeits-Shortcuts o.ä. werden auf **dieser** Timeline ausgeführt, nicht auf zufälligen RSS-Artikeln.
4. **Stabile Selektoren** für E2E: Kacheln müssen in Tests **zuverlässig** auffindbar sein (z. B. fester `article.id`, `data-testid` an `ArticleView`, oder slug pro Onboarding-Content).
5. **Kein Bruch** für Power-User, die Inhalte ausblenden wollen: optional später „Onboarding abgeschlossen“ / Ausblendung; im MVP kann ein einfaches „erste Session nur“ o. dergl. reichen (im Paket festhalten, nicht vertuschen).
6. **Definition of Done (DoD) für E2E-Migration (Teilziel):** mindestens ein authed E2E (z. B. Readability-Shortcuts) läuft grün ausschließlich über Onboarding-Fixture + Auth, ohne vorgeschaltetes `devData`, sobald technisch freigeschaltet (dieses Paket beschreibt den Cutover; Umsetzung kann Teil desselben oder eines Folge-PR sein).

## Umsetzungshinweise

- **Inhalte:** pro Kacheln: eine klare Lern-Message; Verweis auf **Settings** für Darstellung; **Shortcuts** in Kurzform (vollständige Tabelle in Hilfe/Shortcuts-Paket).
- **Vier Themen** (Vorschlag, im Detail zu schärfen): (1) Willkommen / Was ist die Timeline, (2) Tastatur & Lesbarkeit, (3) Themes & persönliche Anpassung in Settings, (4) Quellen hinzufügen & wie Artikel in die Timeline kommen.
- **E2E:** Playwright-Projekte: Auth-Fixture aus **einem** frischen User pro Lauf (oder abgeschaltetes Parallellaufen für dieselbe E-Mail) vermeidet Kollisionen; ggf. zufällige E-Mail + gleiche Passwort-Policy wie Produktion. **devData** bzw. manuelle DB-Seeds bleiben bis dahin freiwillig für Entwickler; authed E2E ohne Onboarding hängt nicht von einem festen Playwright-Seed-Schritt ab.
- **Risiko:** längere Timelines, wenn Onboarding + echte Feeds; Reihenfolge/„pin“ der Welcome-Artikel oben.
- **Rollback:** Onboarding-Flags und eingefügte Artikel-Referenzen per Migration rückgängig machen; E2E bis zur Umstellung weiter mit Seed.

## E2E-Strategie (Zielbild)

| Heute (Übergang) | Ziel (nach Paket) |
|------------------|-------------------|
| `devData` + feste Dreibenutzer-Timeline in einigen Läufen | Frischer User, nach Login nur **feste** Onboarding-Kacheln (IDs bekannt) |
| Shortcuts-Tests hängen an `.article` + lokalem Zustand | Shortcuts an **Kachel N** mit stable selector + gleicher `ArticleView`-Logik |
| Doppelte Sorge um `DEV_SRP_*` / Seeds | SRP-Registrierung im Test; Konsistenz mit `.env.e2e` bleibt für Server |

## Links

- PR: *(noch offen)*
- Diskussion: Onboarding, Welcome-Content, E2E-Refit; ggf. [`shortcuts-help.md`](./shortcuts-help.md), [`../ROADMAP.md`](../ROADMAP.md)
