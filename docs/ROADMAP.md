# Roadmap — Produktlandkarte für infl0

infl0 soll nicht "noch ein Feed-Reader mit KI" werden, sondern eine
**ruhige Leselern-App**: klar, vertrauenswürdig, barrierearm und bewusst.
Dieses Dokument sammelt die Ideen, die diese Richtung stärken, ohne sie schon
zu früh in Releases, Sprints oder halbfertige Tickets zu pressen.

Es ist absichtlich keine Chronik und kein Umsetzungspaket.

- **Was bereits geliefert ist** steht in [`CHANGELOG.md`](./CHANGELOG.md).
- **Was konkret gebaut werden soll** landet als Paket in
  [`planned/`](./planned/) — mit Scope, Akzeptanzkriterien und Reihenfolge.

---

## Wozu diese Roadmap da ist

Die Roadmap soll drei Dinge leisten:

1. **Richtung geben**: Wofür steht infl0 als Produkt?
2. **Ideen festhalten**: Welche Chancen sehen wir, ohne sie sofort zu
   committen?
3. **Arbeit vorbereiten**: Welche zusammenhängenden Blöcke lohnen sich als
   nächstes Paket in `planned/`?

Wenn eine Idee reif wird, wird sie aus dieser Landkarte **herausgezogen** und
als konkretes Paket beschrieben. Diese Datei bleibt bewusst auf Produktniveau.

---

## North Star

> infl0 hilft Menschen, gute Inhalte nicht nur zu sehen, sondern zu
> verstehen, wiederzufinden und bewusst in eigenes Wissen zu überführen —
> ohne Lärm, Druck oder intransparente Automatisierung.

Daraus folgen fünf Produktprinzipien:

### 1. Ruhe vor Reibungsmaximierung

Keine hektische Engagement-Logik, keine aggressive Gamification, keine
überraschenden Eingriffe in den Lesefluss.

### 2. Kontrolle vor Automatik

Alles, was stärker eingreift — Lernen, Wissensaufbau, KI-Anreicherung,
Podcast, Vorschläge — braucht eine **klare, explizite Zustimmung**.

### 3. Provenienz vor Magie

Wenn infl0 etwas erklärt, verdichtet oder empfiehlt, muss sichtbar bleiben:
**woher** es kommt, **warum** es erscheint und **wie** man es wieder loswird.

### 4. Wiederfinden ist genauso wichtig wie Lesen

Lesen allein ist kein Endzustand. infl0 soll helfen, Inhalte später
wiederzufinden, einzuordnen und in Zusammenhänge zu bringen.

### 5. Barrierefreiheit ist Produktqualität

Klare Sprache, Fokus, Landmarken, ruhige Bewegung, sichtbare Herkunft und
stabile Bedienung sind keine Extras, sondern Teil des Kernprodukts.

---

## Kernloop

Die produktive Mitte von infl0 ist nicht "Artikel konsumieren", sondern dieser
Loop:

```text
entdecken -> lesen -> verstehen -> markieren -> wiederfinden -> verbinden
```

Fast jede gute Idee für infl0 sollte mindestens einen dieser Schritte stärker,
klarer oder ruhiger machen.

---

## Strategische Produktfelder

Die folgende Landkarte gruppiert Ideen nicht nach Release, sondern nach
Produktwirkung. Innerhalb jedes Felds stehen zunächst die Ideen mit dem größten
Hebel für infl0.

### A. Lesen, Fokus, Orientierung

Hier geht es um den eigentlichen Lesefluss: Was erscheint? Warum? Wie ruhig und
verständlich ist die Timeline?

**Große Chancen**

- **"Warum steht das oben?" direkt an der Kachel**:
  kurze, ehrliche Begründung mit Verweis auf tiefergehende Erklärung.
- **Shortcuts-Übersicht**:
  ein Ort für alle Tastaturkürzel inklusive Kontext, wann sie aktiv sind.
- **Szenen-Presets statt nur Regler**:
  z. B. "Fokus", "Entdecken", "nur kurz scrollen", "Zeit für Tiefe".
- **Artikelsuche / Wiederfinden im Lesestrom**:
  "Ich hatte doch etwas zu X gelesen" über Titel, Snippet, Datum, Quelle;
  Volltext nur, wenn rechtlich und technisch sauber.
- **Später lesen / Leseliste**:
  mit optional stiller Erinnerung, nicht als Dringlichkeitssystem.

**Spätere Erweiterungen**

- **Diese Woche neu bei euren Quellen** als ruhige Transparenz-Kachel.
- **Lesereflektion statt Streak-Druck**:
  z. B. Wochenrückblick oder "das hat dich zuletzt länger beschäftigt".
- **Quellen-Gesundheitsanzeige**:
  seltene Updates, 404, Dubletten, auffällig repetitive Titel.

### B. Verstehen, Merken, Wiederfinden

Hier liegt wahrscheinlich das stärkste Differenzierungsmerkmal von infl0:
aus Lesen wird schrittweise persönliches Wissen.

**Große Chancen**

- **Explizites Capture / "Lernen"**:
  Nutzer wählt bewusst "lernen" oder "ins Wissen aufnehmen"; erst danach
  beginnt weitere Verarbeitung.
- **Wissensdatenbank mit Provenienz**:
  jedes Wissenselement kennt Quelle, Artikel, Zeitpunkt, Kontext und
  Unterscheidung zwischen Original, Nutzerentscheidung und Verdichtung.
- **Zwischenraum vor der Wissensdatenbank**:
  eine ruhige Inbox für "später einordnen", bevor aus Markierungen echte
  Wissenseinträge werden.
- **Themenstruktur statt nur Listen**:
  z. B. Themenfelder, Begriffe, Artikel und Quellen als navigierbare
  Landkarte.
- **Suche über Wissen + gelesene Artikel**:
  nicht nur "welcher Artikel?", sondern "wo habe ich dieses Thema schon
  gesehen?".

**Spätere Erweiterungen**

- **Glossar-Kacheln** aus Lesestoff, verbunden mit der Themenstruktur.
- **Sammlungen / Themenboards** als Vorstufe oder leichtgewichtiges Modell
  vor einer tieferen Wissensarchitektur.
- **Optionale Denkanstöße** am Ende des Volltexts:
  z. B. drei offene Fragen, aber nur als ruhiges Werkzeug, nie als Zwang.

### C. Vertrauen, Erklärbarkeit, Produktethik

Dieses Feld ist kein Add-on, sondern die Voraussetzung dafür, dass spätere
intelligentere Funktionen zu infl0 passen.

**Große Chancen**

- **Provenienz als Produktprinzip**:
  jede Empfehlung, Wissensverdichtung oder KI-Kachel zeigt Herkunft, Zweck,
  Grund und Ausweg.
- **Vorschläge nur mit Erklärung**:
  "weil du Quelle X oft liest", "weil du Thema Y gespeichert hast".
- **Trennschärfe bei Feedbacksignalen**:
  "weniger Gewicht", "nicht mehr zeigen", "mehr davon" sind unterschiedliche
  Nutzerintentionen und sollten nicht vermischt werden.
- **Portabilität / Export**:
  Quellen, Sammlungen, Wissen, Bewertungen und Lesespuren dürfen kein Käfig
  sein.

**Spätere Erweiterungen**

- **Vertrauensprofil pro Signaltyp**:
  Nutzer sehen, ob etwas aus Lesen, Quelle, Thema, expliziter Markierung oder
  KI-Verdichtung stammt.

### D. Quellen, Medien, Erweiterungen

Hier liegen die Ideen, die infl0 verbreitern, aber den Kern nur dann stärken,
wenn sie kontrolliert und ruhig bleiben.

**Große Chancen**

- **Quellenvorschläge mit Opt-in**:
  "Sie interessieren sich vielleicht für ..." mit Begründung, Dismiss und
  "weniger solche Vorschläge".
- **Mastodon als optionale Quelle**:
  nur wenn Umgang mit Instanzen, Listen, CW und Limits sauber modelliert ist.
- **Vorlesen / Podcast**:
  markierte Artikel werden zu einem eigenen, bewussten Hörkanal statt zu
  Autoplay-Nebenrauschen.

**Spätere Erweiterungen**

- **Perspektiven-Mix**:
  mehr Grundlagen, mehr Gegenpositionen, mehr tiefe Analysen, weniger
  Newsrauschen.
- **Medienübergreifende Sammlungen**:
  Artikel, Audio und Wissen zu einem Thema zusammenführen.

### E. Lesbarkeit, Reizniveau, persönliche Arbeitsweise

Dieses Feld zahlt direkt auf Alltagstauglichkeit und A11y ein.

> Lesbarkeit pro Surface (Karten/Reader), freie Farben mit Presets, Motion-
> Setting, Textgrößen-Shortcut, self-hosted Fonts und neuer Settings-Bereich
> sind ausgelagert nach
> [`planned/readability-settings.md`](./planned/readability-settings.md).

**Große Chancen**

- **Visuelle Zuordnung mit Zurückhaltung**:
  Quelle oder Themencluster über Typo, Abstand und kleine Akzente statt
  bunter Bilderlawine. Ergänzt die Lesbarkeitseinstellungen, ist aber ein
  eigenes Paket, weil es Quelle/Thema semantisch behandelt, nicht
  individuelle Vorlieben.

**Spätere Erweiterungen**

- **Reading goals ohne Druck**:
  z. B. "mehr Architektur, weniger News", nicht als Leistungsmetrik.
- **Offline- oder Fokusmodus**:
  weniger Ablenkung, klare Zustände, gute Lesbarkeit.

---

## Die stärksten nächsten Hebel

Wenn wir nur wenige größere Dinge verfolgen, scheinen diese drei besonders
wirksam:

### 1. Capture -> Wissen mit Provenienz

Das wäre der Schritt vom guten Reader zum eigenständigen Produkt.

**Warum wichtig**

- verbindet Lesen mit langfristigem Nutzen,
- stärkt Vertrauen statt Black-Box-Automatik,
- schafft ein Fundament für spätere KI-Funktionen, ohne sofort von ihnen
  abzuhängen.

**Mögliche Paketnamen**

- `capture-and-knowledge-inbox.md`
- `knowledge-provenance-model.md`

### 2. Wiederfinden -> Suche -> Themenlandkarte

Viele Produkte helfen beim Einsammeln, aber nicht beim Wiederfinden.

**Warum wichtig**

- erhöht den Wert gelesener Inhalte über den Moment hinaus,
- macht Wissen praktisch nutzbar,
- schafft einen natürlichen Einstieg in Themen- statt Feed-Navigation.

**Mögliche Paketnamen**

- `article-and-knowledge-search.md`
- `topic-map-navigation.md`

### 3. Quellenqualität + transparente Vorschläge

Das würde infl0 helfen, "klug" zu werden, ohne beliebig oder manipulativ zu
wirken.

**Warum wichtig**

- stärkt den Kernfeed, statt ihn zu überfrachten,
- schafft erklärbare Empfehlungen,
- verbindet Kontrolle mit echtem Produktgewinn.

**Mögliche Paketnamen**

- `source-health-and-suggestions.md`
- `explicit-feedback-signals.md`

---

## Ideenpool

Nicht alles hiervon ist sofort ein Paket. Die Liste ist bewusst grobkörnig.

### Reader & Timeline

- Shortcuts-Übersicht
- Warum-steht-das-oben-Erklärung
- Szenen-Presets
- Leseliste / später lesen
- Artikelsuche
- Wochenrückblick statt Streak
- Quellen-Gesundheitsanzeige

### Wissen & Struktur

- Explizites Lernen / Capture
- Wissensinbox vor dauerhafter Ablage
- Themenlandkarte
- Wissensmenü
- Glossar
- Sammlungen / Boards
- Strukturierte Einordnung statt Freitextnotizen

### Empfehlungen & Signale

- Quellenvorschläge mit Opt-in
- Mehr davon / weniger davon / nicht mehr zeigen
- Transparente Empfehlungserklärung
- Perspektiven-Mix

### Darstellung & Arbeitsumgebung

- Ruhige visuelle Quellen-/Themenakzente
- Fokus-/Offline-Lesemodus

> Lesbarkeits-Paket, Themes (inkl. Dark/Light), App-seitig reduzierte
> Bewegung und der Textgrößen-Shortcut sind aus dem Ideenpool gezogen
> und werden in [`planned/readability-settings.md`](./planned/readability-settings.md)
> beschrieben.

### Medien

- Vorlesen / Podcast aus markierten Artikeln
- Mastodon als Quelle
- Medienübergreifende Sammlungen

---

## Technische und operative Follow-ups

Diese Punkte sind kleiner, aber wichtig. Sie werden nur dann als Paket
ausformuliert, wenn wir sie wirklich anfassen.

### Qualität

- `help.vue` irgendwann mit echter Nuxt-Integration testen:
  keine Auth-Kopplung, Back-Link bleibt neutral.
- Für `/api/*` optional ein laufender Server-Smoke auf Status + Content-Type,
  ergänzend zu den Unit-Tests.

### A11y-Baseline

- Neue Layout-Seiten immer gegen die Landmark-Baseline prüfen:
  `header`, `nav`, `footer`, `main`, Skip-Link, Fokusfluss.

### Betriebsfragen

- CORS zentral dokumentieren oder setzen, falls `infl0` Clients von anderen
  Origins bedienen soll.

### Prozess

- Commit-/Branch-Konvention in [`DEVELOPING.md`](./DEVELOPING.md)
  explizit festhalten.
- Produktidee zuerst hier, dann Paket in `planned/`, dann Umsetzung,
  dann Eintrag im `CHANGELOG`.

---

## Von der Idee zum Paket

Eine Idee ist reif für `planned/`, wenn sie:

- einen **klaren Nutzergewinn** hat,
- nicht nur "wäre auch nett" ist,
- einen **abgrenzbaren Scope** hat,
- grob in 1-3 Iterationen beschreibbar ist,
- erkennbare Risiken oder Abhängigkeiten hat.

Bereits als Paket vorhanden:

- [`planned/readability-settings.md`](./planned/readability-settings.md) —
  Lesbarkeit pro Surface, freie Farben + Presets, Motion, Shortcuts,
  self-hosted Fonts, neuer Settings-Bereich.

Gute Kandidaten für die nächsten Pakete:

1. `capture-and-knowledge-inbox.md`
2. `article-and-knowledge-search.md`
3. `source-health-and-suggestions.md`

---

## Verknüpfungen

| Dokument | Zweck |
|----------|-------|
| [`CHANGELOG.md`](./CHANGELOG.md) | Gelieferte Änderungen, Fixes, Breaking |
| [`RELEASING.md`](./RELEASING.md) | GitHub CI, Tag, GitHub Release |
| [`planned/README.md`](./planned/README.md) | Umsetzungspakete mit Scope und Akzeptanzkriterien |
| [`DEVELOPING.md`](./DEVELOPING.md) | Setup, Tests, lokale Entwicklung |
| [`CONTENT_AND_A11Y.md`](./CONTENT_AND_A11Y.md) | Ton, Inhalt, A11y-Verträge |
