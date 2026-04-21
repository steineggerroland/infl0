# infl0

A Nuxt app that turns RSS/Atom feeds into a personal, re-rankable
timeline. Built with Nuxt, Prisma, and vue-i18n; authenticated with SRP so
passwords never leave the device.

> Looking for how to develop on this project? See
> [`docs/DEVELOPING.md`](docs/DEVELOPING.md). Writing UI copy or reviewing
> accessibility? See [`docs/CONTENT_AND_A11Y.md`](docs/CONTENT_AND_A11Y.md).

## Quick start

This repo pins its Node version via `.nvmrc`. Always select it before
running `npm` commands so lockfile and engine match CI.

```bash
nvm install    # once, if the pinned version is missing
nvm use
npm ci         # install exactly what the lockfile says
npm run dev    # http://localhost:3000
```

If you use `fish` (as this repo's maintainer does), run the wrapper
`./scripts/with-nvm.sh` from a bash-compatible shell instead of invoking
`nvm` directly.

## Local seed data

After migrations and with `DATABASE_URL` set:

```bash
nvm use
npm run devData
```

Creates `dev@localhost` (password: `dev`), two sample feeds, and three
articles with enrichment and timeline rows. In `production` this only
runs with `ALLOW_DEV_DATA=1` (not recommended).

## Production build

```bash
nvm use
npm run build       # builds .output/
npm run preview     # serves the production build locally
```

See the [Nuxt deployment docs](https://nuxt.com/docs/getting-started/deployment)
for hosting options.

## Contributor guides

- [`docs/DEVELOPING.md`](docs/DEVELOPING.md) — lint, tests, CI, Node setup,
  troubleshooting the dev server.
- [`docs/CONTENT_AND_A11Y.md`](docs/CONTENT_AND_A11Y.md) — plain-language
  and accessibility rules for all user-facing copy and UI. Read this
  before editing `i18n/locales/*.json`, `pages/help.vue`, or any
  user-facing component. Also covers **page auth modes** (`public`,
  `entry`, `required`).
- [`docs/ROADMAP.md`](docs/ROADMAP.md) — product vision, **idea backlog**,
  and technical follow-ups. Add new ideas here first.
- [`docs/CHANGELOG.md`](docs/CHANGELOG.md) — **shipped** changes for
  operators (features, fixes, **breaking** changes when they occur).
- [`docs/planned/`](docs/planned/) — **feature packages** for implementation
  (scope, acceptance criteria); see [`docs/planned/README.md`](docs/planned/README.md).
