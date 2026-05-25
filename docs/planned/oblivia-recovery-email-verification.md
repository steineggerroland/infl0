# Package: Oblivia — verified recovery email and password recovery

## Status

Draft

## Goal

Close the gap left after username login: a **recovery email must be verified**
before it can be used, and **forgotten passwords** are reset only through that
verified address. The persona **Oblivia** (wordplay on *oblivious* — someone
who forgets) drives acceptance tests for the full journey: verify in settings,
sign out, recover with OTP, land signed in again.

Operators need **SMTP** configuration so infl0 can send one-time codes. BDD and
E2E can use a **catch-all** domain (`*@neonnormal.eu`) and read OTPs from the
mailbox via the same SMTP credentials (IMAP or provider API), without brittle
mock-only tests.

## Non-goals

- Replacing username + SRP as the primary sign-in path.
- Verifying email at registration (recovery email may still be optional there;
  verification happens in settings or before first recovery use).
- Magic-link login without OTP, social login, or multi-factor beyond email OTP.
- Storing plaintext passwords or sending passwords by email.
- Production-ready email templates / marketing copy (minimal transactional mail
  is enough for v1).

## Persona: Oblivia

**Need:** Trust that a recovery address really belongs to her, and that she can
get back in after forgetting her password — without staff intervention.

**Wordplay:** *Oblivia* ≈ *oblivious* — the reader who forgot the password but
remembered to set up recovery.

**Covered now:** Robin can register with an optional unverified recovery email
and see sign-in name + recovery email in settings (`#account`). Username login
and migration from legacy email-as-username are shipped.

**Planned tests:** `persona_oblivia_expectations.feature` (`@pending` until SMTP
+ OTP APIs + UI exist).

## User flows

### A — Verify recovery email (settings)

1. Oblivia is signed in (username + password).
2. In **Settings → Account** (`#account`), she enters a **new recovery email**
   (or changes an unverified one).
3. Server validates format, rate-limits, stores a **pending** address (or
   pending verification record), and sends a **numeric OTP** (or short code) via
   SMTP.
4. Oblivia enters the OTP in settings.
5. On success, `users.email` (recovery field) is set and marked **verified**;
   settings show the verified recovery email (read-only or clearly “verified”).
6. Failed OTP: clear error, OTP expires, optional resend with cooldown.

### B — Password recovery (signed out)

1. Oblivia signs out (or uses a fresh browser).
2. From **Login**, she chooses **Forgot password** (or equivalent).
3. She enters the **verified recovery email** (not username).
4. Server sends OTP to that address (same channel as verification).
5. She enters OTP, then **new password** (SRP verifier update).
6. She is **signed in** (session cookie) and can use infl0 normally.

### C — Edge cases (product rules to decide in implementation)

| Case | Suggested rule |
|------|----------------|
| Recovery email not verified | Recovery flow refuses; settings prompt to verify first |
| No recovery email on file | Recovery unavailable; link to support/docs |
| OTP expired / wrong | Generic error; do not reveal whether email exists |
| Username forgotten but email known | Recovery uses email only; after reset, show username in UI or email body |
| Change verified email | Repeat flow A; old address no longer valid for recovery |

## Configuration (SMTP)

New deployment env (names indicative — align with `.env.example` when implementing):

| Variable | Purpose |
|----------|---------|
| `NUXT_SMTP_HOST` | Outbound mail server |
| `NUXT_SMTP_PORT` | Typically `587` (STARTTLS) or provider default |
| `NUXT_SMTP_USER` / `NUXT_SMTP_PASS` | Auth (if required) |
| `NUXT_SMTP_FROM` | From address, e.g. `infl0@neonnormal.eu` |
| `NUXT_EMAIL_OTP_TTL_SECONDS` | OTP validity window |
| `NUXT_EMAIL_OTP_RESEND_COOLDOWN_SECONDS` | Anti-abuse between sends |

Without SMTP configured, verification and recovery endpoints should fail with a
clear **operator-facing** boot warning (similar to `NUXT_OPERATOR_USERNAMES`),
not silent no-ops.

## Test strategy (BDD / E2E)

**Catch-all inbox:** addresses like `oblivia+<unique>@neonnormal.eu` (or
`bdd-oblivia-<run>@neonnormal.eu`) deliver to a shared mailbox on
`neonnormal.eu`.

**Reading OTP in tests:** a test-only helper (not shipped to production UI)
uses the same operator-provided SMTP/IMAP settings to fetch the latest message
matching the recipient and extract the OTP (regex on body). Prefer:

- Dedicated env block in `.env.e2e` (secrets not committed), documented in
  `docs/DEVELOPING.md`
- Screenplay **Ability** e.g. `ReadOtpFromMailbox` used only from Oblivia steps
- No assertion on raw email HTML structure — assert OTP works in the app

**CI:** optional job or local-only gate until neonnormal.eu credentials exist in
GitHub secrets; default `npm run test:bdd` stays green via `@pending`.

## Acceptance criteria

1. Settings flow A is covered by at least one non-pending BDD scenario when
   shipped; until then, scenarios in `persona_oblivia_expectations.feature` stay
   `@pending`.
2. Recovery flow B signs Oblivia in after OTP + new password without manual DB
   edits.
3. Unverified or missing recovery email cannot complete flow B.
4. OTP is single-use, time-limited, and rate-limited per email and per IP/session.
5. SRP verifier rotates on successful recovery; old password no longer works.
6. `.env.example` documents SMTP vars; `docs/DEVELOPING.md` documents
   neonnormal.eu catch-all setup for Oblivia tests.
7. `npm run test:bdd` (default `not @pending`) remains green until scenarios are
   implemented.

## Implementation notes

- **Data model:** extend `User` or add `EmailVerification` / `PasswordReset`
  tables for pending OTP hash, expiry, purpose (`verify_recovery` |
  `reset_password`). Do not store OTP plaintext.
- **API sketch:** `POST /api/auth/recovery-email/request`, `POST .../confirm`,
  `POST /api/auth/password-reset/request`, `POST .../confirm` + `POST .../complete`
  (exact paths TBD).
- **UI:** settings account block — “Add / change recovery email” + OTP field;
  login — “Forgot password” wizard (email → OTP → new password).
- **i18n:** replace “not verified yet” hints once verification ships.
- **Security:** constant-time OTP compare; uniform errors for unknown emails on
  reset request; audit log optional later.

## Dependencies

- Username login and optional `users.email` recovery field (migration
  `20260525120000_user_username`).
- Account section in settings (`#account`, `data-testid` hooks).
- Screenplay foundation (`features/support/screenplay/*`).

## Links

- Persona scenarios: [`features/persona_oblivia_expectations.feature`](../../features/persona_oblivia_expectations.feature)
- Expectation map: [`persona-expectation-map-v1.md`](./persona-expectation-map-v1.md)
- PR:
- Discussion:
