# Paket: Lesbarkeit, Themes, Motion

Aus [`ROADMAP.md`](../ROADMAP.md) herausgezogen (Feld
**E. Lesbarkeit, Reizniveau, persönliche Arbeitsweise**): Lesbarkeits-Paket,
Theme-System, App-seitige reduzierte Bewegung, ruhige visuelle Akzente.
Einzelne Punkte aus **A. Lesen, Fokus, Orientierung** (Shortcut) werden hier
mitbedient, soweit sie unmittelbar zur Lesbarkeit gehören.

## Status

**Abgeschlossen** (MVP, Stand 2026-04). Kernaussagen des Pakets (drei Surfaces, self-hosted Fonts, OFL, Live-Vorschau in den Settings, Persistenz, Motion, Tastaturkürzel) sind umgesetzt. Abweichungen vom ursprünglichen Wortlaut, Review-Beschlüsse und weitere Follow-ups: [unten](#abweichungen-vom-pakettext-mvp-und-follow-ups).

## Abweichungen vom Pakettext (MVP) und Follow-ups

Liste für **Release-Planung** und Reviews (kein Qualitätsurteil pro Zeile).

1. **Pfade & Lizenzen (Schriften):** Dateien liegen unter `public/assets/fonts/<familie>/` (nicht `public/fonts/`). Kanonische OFL-1.1 in `public/assets/fonts/NOTICE.md`, ergänzt um **pro Familie** eine upstream-`OFL.txt` (Copyright, Reserved Font Names) neben den `woff2`-Dateien.
2. **Schriftkatalog:** Kein **JetBrains Mono** in dieser Lieferung; stattdessen u. a. System-Stacks plus Inter, Source Sans 3, Source Serif 4, Lexend, IBM Plex Sans, Fraunces, Atkinson Hyperlegible, OpenDyslexic. **Subset „Latin-Extended“** als separater Build-Schritt ist nicht ausgewiesen; es werden die mitgelieferten variablen `woff2`-Artefakte (Google Fonts bzw. OpenDyslexic-Upstream) verwendet.
3. **„Gelesene anzeigen“:** Das Paket beschrieb die **Verlagerung in Settings**; das Review erlaubte, den **User-Menü-Quicklink** bis zum Shortcut-Follow-up zu behalten. **Umsetzung:** Der Toggle steht weiterhin in der **Timeline** und im **User-Menü**; **kein** paralleler Block unter Settings. Nächster Schritt: mit `shortcuts-help.md` / Shortcut-Paket abstimmen, dann ggf. Umzug oder Konsolidierung.
4. **Hilfe & Akzeptanzkriterium 5:** `/help` dokumentiert v. a. **Timeline-Kürzel** (Pfeile, W/S, E, Q, R, Escape). **Lesbarkeits-Kürzel** (Schriftgröße, Schriftart) sind in der Hilfe **noch nicht** in gleichem Detaillierungsgrad gepflegt. Die **zentrale Shortcuts-Übersicht** bleibt in [`../planned/shortcuts-help.md`](../planned/shortcuts-help.md).
5. **E2E:** Keine Playwright-Abdeckung der Lesbarkeits-Shortcuts in der Timeline in diesem Paket; früherer Experimentalspec entfernt (siehe `CHANGELOG.md`). Stabilere E2E → [`../planned/onboarding-welcome-timeline.md`](../planned/onboarding-welcome-timeline.md).
6. **Feature-Toast** (neue Surfaces / Farbknoten, Akzeptanzkriterium 11) und die zugehörige **einmalige Ankündigung** (`seenFeatureAnnouncements`) sind **kein** Teil der abgeschlossenen MVP-Lieferung.
7. **Live-Vorschau-Layout:** Statt einzelner „drei Karten nebeneinander“-Miniblock sind die drei Surfaces in den Settings **untereinander** in einem Darstellungs-Panel; Live-Wirkung auf Vorschau und App entspricht dem Ziel (ohne Wartezeit / Neuladen).

## Entscheidungen aus externem Review

Ein externes Review schlug unter anderem vor, das Paket in kleinere
Iterationen zu schneiden und „Gelesene anzeigen“ als Quick-Toggle im
User-Menü zu belassen. Dazu dieser Stand:

- **Paket-Scope bleibt.** Der Kernnutzen dieses Pakets (Live-Preview über
  drei Surfaces, frei wählbare Farben, Motion-Setting, geräteübergreifende
  Persistenz) hängt inhaltlich zusammen; ein weiteres Aufspalten bringt
  mehr Umbau als Mehrwert.
- **„Gelesene anzeigen“ zieht trotzdem in Settings um**, bekommt aber
  einen **Tastaturkürzel** als schnellen Arbeitsmodus. Das Shortcut-Paket
  folgt direkt im Anschluss und führt den Toggle in der kommenden
  Shortcuts-Übersicht mit. Der User-Menü-Eintrag bleibt erhalten, bis
  dieses Shortcut-Paket gelandet ist — so entsteht keine Lücke.
- **Motion behält drei Werte (`system | reduced | standard`).** Default
  ist `system`; `reduced` senkt Motion auch gegen das OS, `standard`
  erlaubt Motion auch gegen die OS-Einstellung. Der a11y-Einwand, dass
  `standard` die OS-Präferenz überstimmt, ist gesehen: genau deshalb ist
  es nie der Default und wird als bewusste Nutzerentscheidung im UI
  beschrieben, nicht als „Motion an“-Schalter.

## Ziel

Nutzerinnen haben **gerätübergreifend** Kontrolle über die Darstellung, die
sie beim Lesen tatsächlich spürt:

- **Schriftgröße**, **Zeilenabstand**, **Schriftart** für
  **Kachelvorderseite**, **Kachelrückseite** und **Volltextansicht**
  (jeweils eigene Kombination, weil die Anforderungen sehr verschieden sind).
- **Hintergrundfarbe** und **Schriftfarbe** für diese drei Oberflächen.
  Nutzerinnen wählen frei oder greifen auf Presets („Themes“) zu.
- **Reduzierte Bewegung** als App-Einstellung, zusätzlich zum
  System-`prefers-reduced-motion`.

Die Einstellungsoberfläche zeigt die Änderung **live** und ohne Neuladen.
Für Schriftgröße gibt es **Tastaturkürzel**, damit man sie beim Lesen
schnell korrigieren kann, wenn ein Kacheltext nicht hineinpasst.

## Warum das Paket (Nutzen)

- Menschen lesen auf sehr unterschiedlichen Geräten und Augen — die App soll
  sich anpassen, nicht umgekehrt.
- Kartenvorder-, Kartenrück- und Volltextansicht haben sehr unterschiedliche
  Platzverhältnisse; ein globales „bigger/smaller“ reicht nicht.
- Settings, die man erst nach Seitenwechsel sieht, werden nicht sinnvoll
  benutzt. **Live-Preview in der Settings-Seite** ist Kern des Werts.

## Nicht-Ziele

- **Keine Drittanbieter-Fonts von Google Fonts / CDN**. Alle Schriften
  werden mit der App ausgeliefert und selbst gehostet (Datenschutz,
  Offline-Tauglichkeit, keine externe Fingerabdruckquelle).
- Kein vollständiges Design-System-Redesign. Farben wirken zuerst über
  **Oberflächen-Tokens** (Hintergrund, Text, evtl. Akzent), nicht über
  Buttons/Logos/Feature-Farben.
- Keine WYSIWYG-Theme-Designer-UI (Palette-Picker, Farbverlauf-Editor). Für
  den Einstieg reichen **Farbfelder pro Surface** + **diskrete Schrift-
  und Abstandsstufen**.
- Keine pro-Artikel-Einstellungen; alles gilt global pro Oberfläche.

## Scope / Oberflächen

Wir pflegen **drei Präsentationsflächen** und lassen Einstellungen dort
getrennt zu:

| Surface | Wo | Typischer Bedarf |
|---------|----|------------------|
| `card-front` | Kachelvorderseite in der Timeline | kompakt, klare Hierarchie |
| `card-back` | Kachelrückseite (Metadaten / Aktionen) | ruhig, gut scanbar |
| `reader` | Volltextansicht (Modal / Reader) | große Lesefläche, lange Lektüre |

Pro Surface konfigurierbar:

- `backgroundColor`
- `textColor`
- `fontFamily` (ein kurzer, gut lesbarer System-Stack als Standard + eine
  kleine Auswahl)
- `fontSize` (**ganze Pixel, numerisch einstellbar pro Surface**, geklammert
  auf einen sicheren Bereich — siehe unten)
- `lineHeight` (diskrete Stufen, z. B. `tight / normal / relaxed`)

### Schriftgröße: numerisch, pro Surface

Keine `xs/sm/md/lg/xl`-Stufen. Stattdessen pflegt jede Surface ihren eigenen
`fontSize`-Wert in ganzen **Pixeln**. Das macht die Live-Vorschau ehrlich
(was konfiguriert ist, ist genau das, was ich sehe) und den Shortcut
nutzbar: wenn ein Kartentext gerade nicht reinpasst, schiebe ich `card-front`
um 1 px herunter, ohne dabei den Reader mitzuziehen.

- Einheit: **px** (kanonisch im Storage; das UI darf zusätzlich eine
  pt-Anzeige anbieten, 1 pt ≈ 1.333 px bei 96 dpi).
- Wertebereich: `10 px … 32 px`, ganzzahlig. Werte außerhalb werden beim
  Parse/Patch geklammert, non-finite Werte auf den aktuellen bzw.
  Default-Wert zurückgesetzt.
- Defaults: `card-front` und `card-back` = `16 px`, `reader` = `18 px`.
- Eingabe im UI: Slider **und** nummerisches Eingabefeld pro Surface,
  damit Tastatur- und Mausnutzerinnen denselben Komfort haben.

Themes sind **Presets** dieser Werte für alle drei Surfaces gleichzeitig
(z. B. „Hell ruhig“, „Dunkel warm“, „Kontrastreich“).

## Schriftarten

Wir liefern einen kleinen, **selbst gehosteten** Satz an Schriften unter
einer freien Lizenz (SIL OFL oder äquivalent) aus. Keine Einbindung über
Google Fonts oder andere Drittanbieter-CDNs.

Auswahlprinzip:

- Eine **Variable-Font-Datei pro Familie** als `woff2`, `font-display: swap`,
  `font-display`-Fallback auf den System-Stack derselben Gattung.
- **Subset** für Latin-Extended-A, damit Umlaute und gängige europäische
  Zeichen abgedeckt sind, ohne dass ein voller Unicode-Block geladen wird.
- Präferenz für Schriften mit **expliziten Lesbarkeits-Empfehlungen** (z. B.
  WebAIM, BDA). Konkrete Kandidaten, die wir beim Umsetzen prüfen:
  - **Atkinson Hyperlegible** (OFL, von Braille Institute; speziell für
    Schwachsichtige entworfen) — guter Sans-Serif-Standard.
  - **Inter** (OFL) als zweite Sans-Option für kompakte UI-Flächen.
  - **IBM Plex Serif** oder **Source Serif 4** (OFL / SIL) als Serif-Option
    für lange Lesestrecken im Reader.
  - **JetBrains Mono** (OFL) für monospaced Darstellung (Code im
    Volltext).
  - **OpenDyslexic** (OFL) oder alternativ **Atkinson Hyperlegible** als
    dezidiert dyslexie-geeignete Auswahl. OpenDyslexic bevorzugen, wenn
    Rückmeldung aus Nutzertests das bestätigt; sonst Atkinson behalten.
- Bei jeder Option steht im UI **kurz dabei, wofür sie empfohlen ist**
  („leseschwach“, „lange Texte“, „kompakte Kacheln“, „Code/Monospace“).

Lizenzdateien: erledigt — siehe `public/assets/fonts/NOTICE.md` und je Familie
`OFL.txt` neben den Font-Dateien.

## Reduzierte Bewegung

- Setting `motion: system | reduced | standard` (Standardwert `system`).
- Wirkt über ein Root-Flag (z. B. Klasse `motion-reduce` am `<html>`), das
  im CSS dieselben Pfade trifft wie `@media (prefers-reduced-motion: reduce)`.
- Setting `reduced` **zwingt** die reduzierte Variante, Setting `standard`
  erlaubt Motion selbst wenn das OS Reduced Motion meldet (bewusste
  Nutzerentscheidung).

## Navigation / neuer Menüpunkt „Settings“

Wir führen einen **dedizierten Top-Level-Eintrag „Settings“** ein, der
die bisherigen `/settings/*`-Unterseiten (Personalisierung,
Timeline-Gewichtung, Datenschutz) zusammenhält und den neuen Bereich
**„Darstellung“** (dieses Paket) als eigene Unterseite aufnimmt.

Im Zuge dessen **zieht „Gelesene anzeigen“ aus dem User-Menü** (aktuell
`AppUserMenu.vue`, `useTimelinePreferences`) **in den Settings-Bereich
um**. Begründung: Es ist eine persistente Darstellungspräferenz, keine
einmalige Aktion, und gehört zu anderen „so will ich meine Timeline
sehen“-Einstellungen.

Externes Feedback merkte zu Recht an, dass „Gelesene anzeigen“ heute auch
als **schneller Arbeitsmodus** in der Timeline fungiert und der Wegfall aus
dem User-Menü deshalb ein Rückschritt ist, wenn kein gleichwertig schneller
Zugriff existiert. Entschärfung:

- „Gelesene anzeigen“ bekommt ein **Tastaturkürzel**, das jederzeit auf der
  Timeline greift (kein Navigieren in Settings, kein Menü aufklappen nötig).
- Der konkrete Bind und die Umsetzung gehören in das **Shortcuts-Paket
  direkt im Anschluss** an dieses Paket. Hier wird nur das Erfordernis
  festgehalten; die Shortcuts-Übersicht soll den Toggle mitführen.
- Bis dieses Shortcut-Paket gelandet ist, bleibt der bisherige Quick-Toggle
  im User-Menü bestehen. Er verschwindet **gleichzeitig** mit dem Landen des
  Shortcuts, nicht vorher. Damit gibt es keine Lücke im Arbeitsmodus der
  Stammnutzerinnen.

Migrationsplan:

- `useTimelinePreferences` bleibt als Composable erhalten.
- `localStorage`-Key bleibt (Kompatibilität), zusätzlich wird der Wert
  in `useUiPrefs()` serverseitig gespiegelt, sobald die UI-Prefs-API
  existiert.
- Wenn der User-Menü-Eintrag wegfällt, bleibt als Fallback ein kleiner
  „zu den Einstellungen“-Link, damit Nutzerinnen, die das Toggle kennen,
  nicht im Leeren suchen. Mit gelandetem Shortcut ist das aber nur noch
  eine Entdeckungshilfe, nicht der primäre Weg.

## Tastaturkürzel

- Schriftgröße erhöhen: `=` / `+` (**+1 px**)
- Schriftgröße verkleinern: `-` (**-1 px**)
- Standardgröße wiederherstellen: `0` (Surface-Default: 16 bzw. 18 px)
- Zielen auf die **aktuell sichtbare Surface** (Timeline → Kartenvorderseite;
  Volltext offen → Reader). Rückseite wird nur in Settings verändert, dort
  aber mit Live-Preview.
- An den Klammergrenzen (10 px / 32 px) wird kein Fehler angezeigt; der
  Shortcut ist dann schlicht wirkungslos.
- `Shift+K` / `Shift+L`: vorige bzw. nächste **Schriftart** in der
  konfigurierbaren Liste (kein nacktes `K`/`L`, u. a. wegen
  macOS-Systembelegung von `Alt+L`).
- Alle Kürzel gehorchen der `defineShortcuts`-Hygiene (kein Auslösen bei
  Fokus in Eingabefeldern; `alt+…` / `shift+…` nur als explizite Einträge;
  unmodifizierte Kürzel ohne Cmd/Ctrl/Meta, siehe `composables/useShortcuts.ts`).

### Follow-up: E2E (Playwright)

Die Kürzel sind in der **Timeline** bisher **nicht** durch Playwright
abgedeckt — Abdeckung über Vitest (`useShortcuts`, `useUiPrefs`). **Offen:**
mindestens ein authed E2E-Smoke, der z. B. `+` / `0` / `Shift+L` sendet
und prüft, dass Prefs-Stand oder Wirkung (z. B. `localStorage` / API /
sichtbares Token) dem erwarteten Schritt entspricht. Mit der späteren
Shortcuts-Hilfeseite gemeinsam sinnvoll.

## Persistenz (Architektur)

- **Gerätübergreifend in der Datenbank**, analog zu Timeline-Score-Prefs und
  Engagement-Tracking-Prefs:
  - Spalte am `User` (oder eigener Typ) mit den Präferenzen als JSON.
  - Zwei neue Endpunkte (Namen angelehnt an bestehende Konvention):
    - `GET /api/me/ui-prefs`
    - `PATCH /api/me/ui-prefs`
  - Composable `useUiPrefs()` im Nuxt-Client mit **Server-State-Fetch beim
    ersten Zugriff**, `PATCH`-Debounce beim Ändern.
- **Fallback** für ausgeloggte oder frisch geladene Sessions: sofortige
  Anwendung aus `localStorage`, spätere Reconciliation mit dem Serverwert
  nach Login. Keine doppelten Schreiber.
- Wenn wir den Eindruck „Einstellung springt zurück“ vermeiden wollen:
  **optimistisches Update** in der UI, Server-Antwort gewinnt bei Konflikt.

### Datenform (Vorschlag)

```json
{
  "version": 1,
  "theme": "custom",
  "motion": "system",
  "surfaces": {
    "card-front": {
      "backgroundColor": "#1f2937",
      "textColor": "#e5e7eb",
      "fontFamily": "system-ui",
      "fontSize": 16,
      "lineHeight": "normal"
    },
    "card-back": { "…": "…" },
    "reader": { "…": "…" }
  }
}
```

Migrationsregel: unbekannte Felder werden ignoriert, fehlende Felder fallen
auf den Default zurück; `version` bleibt bestehen, bis ein Breaking Change in
der Form notwendig wird (dann `version: 2` + Migration).

## Live-Preview in den Settings

Die Settings-Seite zeigt alle drei Surfaces **gleichzeitig** als Mini-
Vorschau: rechts (oder auf Mobile darunter) ein kleines Beispiel für
`card-front`, `card-back`, `reader`. Änderungen wirken sofort auf Vorschau
**und** auf die gesamte App (nicht nur auf die Vorschau), damit man Wirkung
im echten Kontext sehen kann.

## Fokus-Ring

Der globale Fokus-Ring in `assets/css/tailwind.css` nutzt bereits
`outline: 2px solid currentColor` mit `outline-offset: 2px`. Damit folgt
der Ring automatisch der **aktuellen Textfarbe** der fokussierten
Oberfläche — also ohne Sonderlogik auch dann, wenn die Nutzerin Farben
pro Surface frei wählt.

Anforderungen an dieses Paket:

- Keine Regression an diesem Baseline-Verhalten; `tests/unit/focus-visible-baseline.test.ts`
  bleibt grün.
- Die Kontrastwarnung (siehe unten) prüft **Text vs. Hintergrund**; da
  der Ring `currentColor` ist, ist sein Kontrast automatisch mit abgedeckt.
- Wenn ein späteres Preset oder eine Nutzerfarbe Text so wählt, dass der
  Ring unsichtbar würde, greift dieselbe Warnung — wir brauchen keinen
  zweiten Kontrast-Check nur für den Ring.

## Umgang mit Struktur- und Feature-Änderungen

Leitlinie:

- **Rein strukturelle Refactors** (z. B. eine Karte wird neu aufgeteilt,
  aber ihre Surface bleibt „card-front“): Custom-Farben und Schrift der
  Nutzerin bleiben **unverändert** sichtbar, weil weiterhin dieselbe
  Surface-Variable trifft.
- **Neue Surface / neuer Farbknoten** (z. B. eine zusätzliche
  „card-accent“-Fläche oder eine Knowledge-Timeline-Kachel mit eigenem
  Hintergrund): bekommt beim ersten Release einen **sinnvollen Default
  aus dem aktiven Preset**. Die Nutzerin erhält einen dezenten **Toast**
  mit dem Hinweis „Neue Darstellungsoption verfügbar“ und einem
  direkten Link zu der neuen Einstellung unter `/settings/darstellung`.
- Toasts dieser Art **einmal pro Nutzerin pro Feature**, getrackt über
  `useUiPrefs()` (z. B. `seenFeatureAnnouncements: string[]`), damit sie
  nicht erneut erscheinen, wenn die Nutzerin den Punkt ignoriert.

## Akzeptanzkriterien (MVP)

1. **Drei Surfaces**: Nutzerin kann `backgroundColor`, `textColor`,
   `fontFamily`, `fontSize`, `lineHeight` pro Surface wählen; Presets
   schalten alle drei Surfaces in einem Schritt um.
2. **Freie Farben**: Farbauswahl per Color-Input; Kontrastwarnung, wenn
   Text-Hintergrund-Kontrast unter der WCAG-AA-Schwelle liegt. Wir blocken
   nicht, wir warnen und benennen eine sichere Alternative.
3. **Live-Preview**: Änderungen in Settings wirken innerhalb **<200 ms**
   ohne Neuladen, sowohl in der Preview als auch in der App.
4. **Persistenz**: Einstellungen werden in der Datenbank gespeichert und
   sind nach Login auf einem zweiten Gerät vorhanden. `localStorage` wird
   ausschließlich als Fallback genutzt.
5. **Shortcut**: `+`, `-`, `0` verändern Schriftgröße der sichtbaren
   Surface; die Kürzel sind in der Hilfeseite und der kommenden
   Shortcuts-Übersicht aufgeführt.
6. **Motion**: `motion: reduced` erzwingt dieselben Pfade wie die
   Media-Query; `motion: standard` setzt diese auch bei aktiver Media-Query
   außer Kraft — bewusst dokumentierte Nutzerentscheidung.
7. **A11y**: Keine Regression der Playwright-/axe-Smokes; Fokus-Ring bleibt
   sichtbar in allen Presets; Kontrastwarnung hat Textalternative.
8. **Kein FOUC**: Beim ersten Seitenaufruf wird das Theme **vor** dem ersten
   Paint angewendet (Server-Render oder Inline-Bootstrap-Script) für alle
   Surface-Variablen.
9. **Self-hosted Fonts**: keine Netzwerkaufrufe an Drittanbieter; die
   angebotenen Schriften (inkl. mindestens einer dyslexie-freundlichen
   Option) liegen unter `public/assets/fonts/` mit `NOTICE.md` und
   pro Familie `OFL.txt`.
10. **Settings-Navigation**: Top-Level-Eintrag „Settings“ existiert; der
    neue Bereich „Darstellung“ ist erreichbar; „Gelesene anzeigen“ ist
    aus dem User-Menü in Settings gewandert und das Verhalten bleibt
    über bestehende `localStorage`-Nutzerinnen hinweg erhalten.
11. **Feature-Hinweis**: Wird in einem späteren Release eine neue Surface
    oder ein neuer Farbknoten eingeführt, sieht die Nutzerin einen
    einmaligen Toast mit Link auf die betroffene Settings-Seite.

## Technische Bausteine (grobe Skizze)

- **CSS-Variablen** pro Surface: z. B. `--front-bg`, `--front-fg`,
  `--front-font-family`, `--front-font-size-step`, `--reader-…`. Tailwind /
  DaisyUI-Klassen greifen diese Variablen statt Hardcodes.
- **Root-Datenattribute**: `<html data-infl0-theme="…" data-motion="…"
  data-surface-preview="card-front">` — Preset-IDs kommen in `data-infl0-theme`
  (DaisyUI nutzt `data-theme` separat, aktuell fest `data-theme="light"`);
  `data-surface-preview` optional für die Preview.
- **Composable** `useUiPrefs()` stellt reaktive Werte bereit; Setter
  aktualisieren CSS-Variablen + optimistisch den Zustand, senden dann
  `PATCH`.
- **Hilfe-Eintrag** in `pages/help.vue` erklären, was die Surfaces sind und
  was die Shortcuts tun.

## Entschiedene Punkte (für Umsetzung)

- **Schriftarten**: Self-hosted, OFL-lizensiert. Mindestens eine
  dyslexie-freundliche Option (Atkinson Hyperlegible und/oder
  OpenDyslexic). Kein Google-Fonts / CDN.
- **Fokus-Ring**: Bleibt `currentColor`-basiert, passt sich damit
  automatisch an die Schriftfarbe an. Kein zweiter Kontrast-Check nötig.
- **Navigation**: Top-Level-Eintrag „Settings“ mit Unterseite
  „Darstellung“. „Gelesene anzeigen“ zieht aus dem User-Menü dorthin um.
- **Strukturelle Änderungen**: Custom-Farben bleiben unberührt, solange
  die Surface dieselbe bleibt. Neue Farben/Surfaces bekommen einen
  Preset-Default und werden via einmaligem Toast angekündigt.

## Offene Fragen

- Welche konkrete dyslexie-freundliche Schrift nehmen wir als Default —
  Atkinson Hyperlegible (geprüfte Lesbarkeit, modernes Design) oder
  OpenDyslexic (explizit für Dyslexie)? Tendenz: beide anbieten,
  Atkinson als Default.
- Soll der Toast für neue Darstellungsoptionen **auf jeder Seite**
  erscheinen oder nur beim nächsten Besuch der Timeline, damit er nicht
  bei Artikel-Tiefenlektüre stört?
- Wie stark wollen wir Serif-/Monospace-Optionen pro Surface erzwingen
  (z. B. Reader standardmäßig Serif anbieten), oder bleibt alles frei
  wählbar ohne Empfehlung?

## Risiken

- **Zu viele Regler** → Settings fühlen sich technisch an. Gegenmittel:
  Presets als Default, Feintuning sichtbar aber nicht dominant.
- **Schlechter Kontrast** durch freie Farben. Gegenmittel: Warnung plus
  sichere Alternative vorschlagen.
- **FOUC** beim Theme-Wechsel. Gegenmittel: Theme-Werte SSR-freundlich
  setzen, Transitions bewusst auf reduced motion rücksichtnehmen lassen.

## Reihenfolge (Vorschlag)

1. Datenform, Composable, Endpunkte, Server-Persistenz, localStorage-Fallback.
2. CSS-Variablen-Baseline für die drei Surfaces; bestehende Komponenten auf
   Variablen umstellen (minimaler Umfang: Hintergrund, Text, Schriftgröße).
3. Self-hosted Fonts einbinden (`public/fonts/` + `@font-face`-CSS +
   Lizenzen) und als Dropdown-Optionen verfügbar machen.
4. Settings-Top-Level-Eintrag + Unterseite „Darstellung“; „Gelesene
   anzeigen“ in diesen Bereich migrieren.
5. Settings-Seite mit Live-Preview und Presets.
6. Freie Farben und Kontrastwarnung.
7. Shortcuts (`+`, `-`, `0`) und Hilfetext.
8. Motion-Einstellung und Integration in vorhandene Motion-Pfade.
9. Toast-Ankündigungsmechanik für neue Darstellungsoptionen.
10. A11y-Review, Kontrast-Smokes in Playwright ergänzen.

## Links

- Produktkontext: `docs/ROADMAP.md` — Feld **E. Lesbarkeit, Reizniveau,
  persönliche Arbeitsweise**.
- Inhaltliche / A11y-Regeln: `docs/CONTENT_AND_A11Y.md`.
- Nach Umsetzung: Eintrag unter `docs/CHANGELOG.md` → `[Unreleased]` (siehe dort
  unter *Lesbarkeit / Darstellung*).
