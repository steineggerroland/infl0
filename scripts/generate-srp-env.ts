/**
 * Run locally (password stays in this shell only, not on the server):
 *   SRP_GEN_PASSWORD='your-secret' npx tsx scripts/generate-srp-env.ts [username]
 * Prints `{PREFIX}_SRP_SALT_HEX` / `{PREFIX}_SRP_VERIFIER_HEX` for `.env` / `.env.e2e`,
 * then run `npm run db:seed`. Prefix is `DEV` for `dev`,
 * `OPERATOR` for `operator`, otherwise the username uppercased.
 */
import { createVerifierAndSalt, SRPParameters, SRPRoutines } from 'tssrp6a'
import { normalizeUsername } from '../utils/username'

const cliUsername = process.argv[2]?.trim()
const username = normalizeUsername(cliUsername ?? process.env.DEV_SEED_USERNAME ?? 'dev')
const password = process.env.SRP_GEN_PASSWORD

if (!password) {
  console.error('Set SRP_GEN_PASSWORD to the password you will type in the browser.')
  console.error("Example: SRP_GEN_PASSWORD='…' npx tsx scripts/generate-srp-env.ts dev")
  process.exit(1)
}

const routines = new SRPRoutines(new SRPParameters())
const { s, v } = await createVerifierAndSalt(routines, username, password)

const prefix =
  username === 'dev' ? 'DEV' : username === 'operator' ? 'OPERATOR' : username.toUpperCase()

console.log('# Paste into .env / .env.e2e (then npm run db:seed):')
// Only echo username when passed on the CLI — not when read from env (CodeQL clear-text-logging).
if (cliUsername) {
  console.log(`${prefix}_SEED_USERNAME=${username}`)
}
console.log(`${prefix}_SRP_SALT_HEX=${s.toString(16)}`)
console.log(`${prefix}_SRP_VERIFIER_HEX=${v.toString(16)}`)
