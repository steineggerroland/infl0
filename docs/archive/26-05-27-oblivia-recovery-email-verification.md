# Package: Oblivia — verified recovery email and password recovery

## Status

**Shipped** (2026-05-27). See [`../CHANGELOG.md`](../CHANGELOG.md) **[Unreleased]**.

## Goal

Close the gap left after username login: a **recovery email must be verified**
before it can be used, and **forgotten passwords** are reset only through that
verified address. The persona **Oblivia** drives acceptance tests for the full
journey: verify in settings, sign out, recover with OTP, land signed in again.

Operators must configure **SMTP** so infl0 can send one-time codes. Without SMTP,
recovery flows fail at request time and **no email is sent**.

## What shipped

- **API:** `POST /api/auth/recovery-email/request`, `POST .../confirm`,
  `POST /api/auth/password-reset/request`, `POST .../confirm` with hashed OTP
  storage (`email_otps`), TTL, resend cooldown, and SRP verifier rotation on
  successful password reset.
- **Settings → Account:** progressive-disclosure recovery editor
  (`SettingsAccountRecovery.vue`) — send code, six-digit auto-verify, resend
  with countdown, spam-folder hint, block re-verifying an already verified
  address.
- **Login:** forgot-password wizard (email → OTP + new password) with shared
  `EmailOtpInput`, resend, and success toasts.
- **BDD:** `persona_oblivia_expectations.feature` (`@email`) — full journey,
  resend, already-verified guard, unverified recovery refusal, invalid code.
  `@email` scenarios skip automatically when SMTP/IMAP env vars are missing.

## Operator configuration (required for outbound mail)

| Variable | Purpose |
|----------|---------|
| `NUXT_SMTP_HOST` | Outbound mail server; may include `:port` (default implicit TLS on `465`) |
| `NUXT_SMTP_USER` / `NUXT_SMTP_PASS` | SMTP auth; user is also used as the From address |
| `NUXT_EMAIL_OTP_TTL_SECONDS` | OTP validity window (optional) |
| `NUXT_EMAIL_OTP_RESEND_COOLDOWN_SECONDS` | Anti-abuse between sends (optional) |
| `NUXT_PUBLIC_EMAIL_OTP_RESEND_COOLDOWN_SECONDS` | UI resend countdown (optional; should match server cooldown) |

See [`DEPLOYING.md`](../DEPLOYING.md#transactional-email-recovery-otp) and
[`.env.example`](../../.env.example).

## Non-goals (unchanged)

- Replacing username + SRP as the primary sign-in path.
- Verifying email at registration (optional there; verification in settings).
- Magic-link login, social login, or MFA beyond email OTP.
- Marketing-grade email templates (plain-text transactional mail only).

## Persona: Oblivia

**Tests:** [`features/persona_oblivia_expectations.feature`](../../features/persona_oblivia_expectations.feature)

## Links

- Developing / BDD mail setup: [`DEVELOPING.md`](../DEVELOPING.md)
