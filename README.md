# infl0

infl0 is a calm, privacy-first reading-and-learning app for personal sources:
it helps you discover, read, understand, find again, and eventually connect
good content without noisy engagement mechanics or opaque automation.

Today infl0 works with RSS/Atom feeds and crawler-ingested article content;
the product direction is intentionally broader than feeds alone, with Mastodon
and other source types on the roadmap. Its development principles are
transparency, user control, provenance, accessibility, and privacy by design:
SRP login means passwords never leave the device, scoring is explainable, and
tracking is explicitly user-controlled.

See [`docs/ROADMAP.md`](docs/ROADMAP.md) for the product philosophy and future
direction.

## Try it yourself

Open [`infl0.neurospicy.icu`](https://infl0.neurospicy.icu) and sign in with:

- Email: `dev@localhost`
- Password: `dev`

This is a demo deployment. Data may be reset, and the account is shared by
anyone using the public demo.

## What it does

- Collects source content into a personal reading timeline.
- Lets readers tune ranking, readability, theme, motion, and tracking choices.
- Explains product behavior instead of hiding it behind black boxes.
- Keeps authentication privacy-friendly with SRP-based login.
- Seeds a local demo account so new contributors and evaluators can try the
  app quickly.

## Try it locally

This repo pins Node via `.nvmrc`. For a local demo with Postgres and sample
content:

```bash
cp .env.example .env
nvm install
nvm use
npm ci
docker compose up -d postgres
npm run db:migrate:deploy
npm run devData
npm run dev
```

Open `http://localhost:3000` and sign in as `dev@localhost` with password
`dev`.

If you use `fish` (as this repo's maintainer does), run the wrapper
`./scripts/with-nvm.sh` from a bash-compatible shell instead of invoking
`nvm` directly.

## For users

- Found a bug or rough edge? Open a
  [GitHub issue](https://github.com/steineggerroland/infl0/issues).
- Curious what changed recently? Read [`docs/CHANGELOG.md`](docs/CHANGELOG.md).
- Want to know what might come next? Start with
  [`docs/ROADMAP.md`](docs/ROADMAP.md).
- Have an idea for a feature? Open an issue or compare it with the current
  roadmap and planned packages in [`docs/planned/`](docs/planned/).

## Self-hosting

infl0 is a Nuxt SSR app backed by PostgreSQL. A small deployment needs:

- Node 24 or a compatible SSR host for the Nuxt/Nitro server.
- PostgreSQL for users, source subscriptions, article metadata, preferences,
  and reading state.
- `DATABASE_URL` and `AUTH_JWT_SECRET`; optional keys configure registration
  and crawler ingestion.

For hosted previews and production, this repo currently documents a
Vercel + Neon setup with PR preview databases. See
[`docs/DEPLOYING.md`](docs/DEPLOYING.md), [`docker-compose.yaml`](docker-compose.yaml),
and [`.env.example`](.env.example).

## Contributing

Developers can start with the local demo commands above. Before opening a PR,
run:

```bash
npm run verify
```

More detail lives in:

- [`docs/DEVELOPING.md`](docs/DEVELOPING.md) — local development, tests, CI,
  Docker, and troubleshooting.
- [`docs/CONTENT_AND_A11Y.md`](docs/CONTENT_AND_A11Y.md) — user-facing copy,
  accessibility, and page auth modes.
- [`docs/RELEASING.md`](docs/RELEASING.md) — CI gates, changelog flow, and
  tagging releases.
