# AGENTS.md - infl0 project notes

## Runtime & Toolchain
- **Node 24**: Pinned in `.nvmrc`. Mutating commands (`npm install`, `npm ci`, etc.) MUST use Node 24 to ensure lockfile consistency.
- **Execution Pattern**: Use the wrapper for mutating npm/npx commands: `./scripts/with-nvm.sh <command>` (or load nvm via `nvm.sh` in bash).

## Infrastructure & Environment
- **PostgreSQL 16**: Run `docker compose up -d postgres` before starting app or tests.
- **Nuxt Dev Server**: `npm run dev` at `http://127.0.0.1:3000`. Requires `DATABASE_URL` and `AUTH_JWT_SECRET`.
- **Env Masking Warning**: `.env` values (even empty) mask `.env.e2e` defaults. To let E2E defaults work, *comment out* these keys in `.env`: `DEV_SRP_SALT_HEX`, `DEV_SRP_VERIFIER_HEX`, `OPERATOR_SRP_SALT_HEX`, `OPERATOR_SRP_VERIFIER_HEX`, `E2E_LOGIN_PASSWORD`, `OPERATOR_LOGIN_PASSWORD`.

## Testing & Verification
- **Fast Path**: Run `npm run check` (lint --quiet $\rightarrow$ vitest dot reporter $\rightarrow$ typecheck) before presenting code. 
- **Full Verify**: `npm run verify` (lint + test + typecheck).
- **BDD/Cucumber**: `npm run test:bdd`. Uses `.env.e2e`, builds app, starts server on :4275.
- **E2E/Playwright**: `npm run test:e2e`. Uses `.env.e2e`, builds app, starts server on :4275.
- **Philosophy**: Behavior-first. Avoid brittle technical tests (selectors, Tailwind classes). Prefer user-path checks (keyboard, focus, ARIA). See `docs/DEVELOPING.md`.

## Database Management
- **Schema**: `npx prisma migrate deploy` applies changes.
- **Dev Data**: `npm run devData` seeds sample content. Requires `DATABASE_URL` in environment (`source .env` or use `dotenv -e .env`).
- **E2E Seed**: `npx dotenv -e .env -e .env.e2e -- npx prisma db seed`. Ensure SRP vars are unset/commented out first to avoid masking.

## Domain Context (Ubiquitous Language)
- **Core Terms**: `Engagement`, `TimelineScore`, `Source`, `Reader`, `Inflow`, `Return Context`, `Operator`, `ReadingNote`, `ReadingNoteType`.
- **Architecture**: 3-layer split: Domain logic (pure) $\rightarrow$ Application layer (orch/val) $\rightarrow$ Infrastructure (DB, Nitro, UI adapters).
- **Text Work**: ReadingNotes are source-bound quotes, summaries, or personal notes created while working with articles and episodes. A later `KnowledgeNote` may become an independent, connected knowledge unit. UserTags are stored as a text array (`String[]`).

## Knowledge Base Implementation Status
- **Schema**: `ReadingNote` model + `ReadingNoteType` enum in `prisma/schema.prisma`; physical storage uses the `reading_notes` table.
- **API endpoints** (all in `server/api/knowledge/`):
  - `POST /api/knowledge/reading-notes` — create a reading note
  - `GET /api/knowledge/reading-notes` — list with pagination and source/tag filters
  - `DELETE /api/knowledge/reading-notes/:readingNoteId` — remove an owned reading note
  - `GET /api/knowledge/tags` — tag usage counts via raw SQL
- **Composable**: `composables/useReadingNotes.ts` — global reading-note state and deletion.
- **Components**:
  - `components/AnnotatableText.vue` — text selection, creation dialog, highlights, and grouped inline reading notes
  - `components/ReadingNoteCard.vue` — shared reading-note presentation
  - `pages/knowledge/reading-notes.vue` — global reading-note listing
- **Integration**: `AnnotatableText` is embedded in article bodies and all episode text sources.
- **Navigation**: `/knowledge/reading-notes` is exposed as `menu.readingNotes`.
- **i18n**: `readingNotes` section in both `en.json` and `de.json`.
- **BDD**: `features/persona_savy_reading_notes.feature` covers reading-note creation, tag browsing/filtering, learning focus, and overlapping anchors.

## Known Caveats
- `[chromium-onboarding] welcome.spec.ts` may fail due to a redirect mismatch (`/inflow/onboarding/intro`) vs expected assertion; this is known and not an env issue.
- Prisma seed scripts do not auto-load `.env`; they require explicit environment variables.

## Git & Workflow
- Do not commit or push unless explicitly asked.
- Assume worktree contains user changes; preserve unrelated edits.
