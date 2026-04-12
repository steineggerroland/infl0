/**
 * Run locally (password stays in this shell only, not on the server):
 *   SRP_GEN_PASSWORD='your-secret' npx tsx scripts/generate-srp-env.ts [email]
 * Prints BETA_SRP_SALT_HEX and BETA_SRP_VERIFIER_HEX for .env, then run npm run db:seed.
 */
import { createVerifierAndSalt, SRPParameters, SRPRoutines } from 'tssrp6a'

const email = (process.argv[2] ?? process.env.BETA_SEED_EMAIL ?? 'beta@localhost')
  .trim()
  .toLowerCase()
const password = process.env.SRP_GEN_PASSWORD

if (!password) {
  console.error('Set SRP_GEN_PASSWORD to the password you will type in the browser.')
  console.error('Example: SRP_GEN_PASSWORD=\'…\' npx tsx scripts/generate-srp-env.ts')
  process.exit(1)
}

const routines = new SRPRoutines(new SRPParameters())
const { s, v } = await createVerifierAndSalt(routines, email, password)

console.log('# Paste into .env (then npm run db:seed):')
console.log(`BETA_SRP_SALT_HEX=${s.toString(16)}`)
console.log(`BETA_SRP_VERIFIER_HEX=${v.toString(16)}`)
