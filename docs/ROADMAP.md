# Roadmap — product map for infl0

infl0 should not become “just another feed reader with AI”, but a **calm
reading-and-learning app**: clear, trustworthy, low-friction, and intentional.
This document collects ideas that strengthen that direction without forcing
them too early into releases, sprints, or half-baked tickets.

It is intentionally **not** a chronicle or an implementation package.

- **What has already shipped** is in [`CHANGELOG.md`](./CHANGELOG.md).
- **What to build concretely** lives as a package in
  [`planned/`](./planned/) — with scope, acceptance criteria, and order.

---

## What this roadmap is for

The roadmap should do three things:

1. **Set direction:** What does infl0 stand for as a product?
2. **Capture ideas:** What opportunities do we see without committing
   immediately?
3. **Prepare work:** What coherent blocks are worth the next `planned/`
   package?

When an idea matures, it is **pulled out** of this map and written up as a
concrete package. This file stays deliberately at product level.

---

## North Star

> infl0 helps people not only *see* good content, but *understand* it,
> *find it again*, and *turn it into their own knowledge* — without noise,
> pressure, or opaque automation.

From that follow five product principles:

### 1. Calm over friction maximisation

No hectic engagement logic, no aggressive gamification, no surprise
interruptions to the reading flow.

### 2. Control over automation

Anything that intervenes more strongly — learning, knowledge building, AI
enrichment, podcast, suggestions — needs **clear, explicit consent**.

### 3. Provenance over magic

Whenever infl0 explains, compresses, or recommends something, it must stay
visible **where** it comes from, **why** it appears, and **how** to get rid
of it.

### 4. Finding again matters as much as reading

Reading alone is not the end state. infl0 should help people find content
later, place it in context, and connect it to other knowledge.

### 5. Accessibility is product quality

Clear language, focus, landmarks, calm motion, visible provenance, and
stable operation are not extras — they are part of the core product.

---

## Core loop

The productive centre of infl0 is not “consume articles”, but this loop:

```text
discover -> read -> understand -> mark -> find again -> connect
```

Almost every good idea for infl0 should make at least one of these steps
stronger, clearer, or calmer.

---

## Strategic product areas

The map below groups ideas by product impact, not by release. Within each
area, the highest-leverage ideas for infl0 are listed first.

### A. Reading, focus, orientation

The actual reading flow: what appears? why? how calm and legible is the
timeline?

**Major opportunities**

- **“Why is this on top?” on the card itself:**
  short, honest reasoning with a path to a deeper explanation.
- **Shortcuts reference:**
  one place for all keyboard shortcuts, including when they are active.
- **Scene presets instead of only sliders:**
  e.g. “Focus”, “Discover”, “quick scroll only”, “time for depth”.
- **Article search / refind in the reading stream:**
  “I read something about X” via title, snippet, date, source; full text only
  when legally and technically sound.
- **Read later / reading list:**
  with optional quiet reminder, not an urgency system.

**Later extensions**

- **This week from your sources** as a calm transparency tile.
- **Reading reflection instead of streak pressure:**
  e.g. weekly look-back or “this stayed with you recently”.
- **Source health view:**
  rare updates, 404s, dupes, obviously repetitive titles.

### B. Understanding, remembering, finding again

Likely the strongest differentiator for infl0: from reading, step by step, to
personal knowledge.

**Major opportunities**

- **Explicit capture / “learn”:**
  the user explicitly chooses “learn” or “add to knowledge” before further
  processing.
- **Knowledge base with provenance:**
  every item knows source, article, time, context, and distinction between
  original, user choice, and summary.
- **Inbox before the knowledge base:**
  a calm holding area for “sort later” before marks become real knowledge
  entries.
- **Topic structure instead of lists only:**
  e.g. topic fields, terms, articles, and sources as a navigable map.
- **Search across knowledge + read articles:**
  not only “which article?” but “where have I seen this topic before?”.

**Later extensions**

- **Glossary cards** from reading, linked to the topic map.
- **Collections / topic boards** as a lightweight model before a deeper
  knowledge architecture.
- **Optional prompts** at the end of full text:
  e.g. three open questions, only as a quiet tool, never as pressure.

### C. Trust, explainability, product ethics

Not an add-on, but the prerequisite for smarter features to fit infl0
later.

**Major opportunities**

- **Provenance as a product rule:**
  every recommendation, knowledge tile, or AI block shows source, purpose,
  reason, and how to turn it off.
- **Suggestions only with explanation:**
  “because you often read source X”, “because you saved topic Y”.
- **Clear separation of feedback signals:**
  “less weight”, “don’t show again”, “more like this” are different intents
  and should not be merged.

**Later extensions**

- **Trust profile per signal type:**
  users see whether something comes from reading, source, topic, explicit
  mark, or AI summary.

### D. Sources, media, extensions

Ideas that broaden infl0 but should strengthen the core only if kept
controlled and calm.

**Major opportunities**

- **Source suggestions with opt-in:**
  “You might be interested in …” with reasoning, dismiss, and “fewer like
  this”.
- **Mastodon as an optional source:**
  only if instances, lists, CWs, and limits are modelled cleanly.
- **Read aloud / podcast:**
  marked articles become a conscious listening channel, not autoplay noise.

**Later extensions**

- **Perspective mix:**
  more fundamentals, more counterpoints, more deep analysis, less news
  churn.
- **Cross-media collections:**
  article, audio, and knowledge on one topic in one place.

### E. Readability, stimulation level, personal workflow

Taps directly into day-to-day usability and a11y — tune reading flow, manage
stimulation, and personal presentation without losing the product core. The
**next** planning packages for this, when needed, live in
[`planned/`](./planned/), not in this product map.

**Major opportunities**

- **Visual association with restraint:**
  source or topic cluster via type, spacing, and small accents instead of a
  wall of images. Complements readability settings, but is its own package
  because it treats source/topic semantically, not only personal taste.

**Later extensions**

- **Reading goals without pressure:**
  e.g. “more architecture, less news”, not a performance metric.
- **Offline or focus mode:**
  less distraction, clear states, good readability.

---

## Strongest next levers

If we only pursue a few larger efforts, these three seem especially
impactful:

### 1. Capture -> knowledge with provenance

The step from a good reader to a product that stands on its own.

**Why it matters**

- Connects reading to long-term value,
- builds trust instead of black-box automation,
- lays groundwork for later AI without depending on it immediately.

**Possible package names**

- `capture-and-knowledge-inbox.md`
- `knowledge-provenance-model.md`

### 2. Find again -> search -> topic map

Many products help collect; fewer help you find again.

**Why it matters**

- Increases the value of what you read beyond the moment,
- makes knowledge practical,
- is a natural entry to topic- instead of feed-first navigation.

**Possible package names**

- `article-and-knowledge-search.md`
- `topic-map-navigation.md`

### 3. Source quality + transparent suggestions

Helps infl0 feel “smart” without arbitrary or manipulative behaviour.

**Why it matters**

- Strengthens the core feed without overloading it,
- makes recommendations explainable,
- pairs control with real product upside.

**Possible package names**

- `source-health-and-suggestions.md`
- `explicit-feedback-signals.md`

---

## Idea pool

Not all of this becomes a package immediately. The list is intentionally
coarse.

### Reader & timeline

- Shortcuts reference
- “Why on top” explanation
- Scene presets
- Reading list / read later
- Article search
- Weekly look-back instead of streaks
- Source health indicator

### Knowledge & structure

- Explicit learn / capture
- Knowledge inbox before permanent storage
- Topic map
- Knowledge menu
- Glossary
- Collections / boards
- Structured placement instead of free-text-only notes

### Recommendations & signals

- Source suggestions with opt-in
- More / less / don’t show
- Transparent recommendation explanation
- Perspective mix

### Presentation & work environment

- Calm visual source/topic accents
- Focus / offline reading mode

### Media

- Read aloud / podcast from marked articles
- Mastodon as a source
- Cross-media collections

---

## Technical and operational follow-ups

These are smaller but important. They get written up as a package only when
we actually touch them.

### Quality

- Eventually test `help.vue` with a real Nuxt integration test: no auth
  coupling, back link stays neutral.
- For `/api/*`, optional live server smoke on status + content-type, in
  addition to unit tests.

### A11y baseline

- New layout pages: always check against the landmark baseline:
  `header`, `nav`, `footer`, `main`, skip link, focus flow.

### Operations

- Document or enforce CORS centrally if infl0 should serve clients from
  other origins.

### Process

- Record commit/branch convention explicitly in [`DEVELOPING.md`](./DEVELOPING.md).
- Product idea first here, then a `planned/` package, then implementation,
  then a `CHANGELOG` entry.

---

## From idea to package

An idea is ready for `planned/` if it:

- has a **clear user benefit**,
- is not only “nice to have”,
- has a **bounded scope**,
- can be sketched in roughly 1–3 iterations,
- has visible risks or dependencies.

Good candidates for the next packages:

1. `capture-and-knowledge-inbox.md`
2. `article-and-knowledge-search.md`
3. `source-health-and-suggestions.md`

---

## Links

| Document | Purpose |
|----------|---------|
| [`CHANGELOG.md`](./CHANGELOG.md) | Shipped changes, fixes, breaking |
| [`RELEASING.md`](./RELEASING.md) | GitHub CI, tag, GitHub release |
| [`planned/README.md`](./planned/README.md) | Implementation packages with scope and acceptance criteria |
| [`DEVELOPING.md`](./DEVELOPING.md) | Setup, tests, local development |
| [`CONTENT_AND_A11Y.md`](./CONTENT_AND_A11Y.md) | Voice, content, a11y contracts |
