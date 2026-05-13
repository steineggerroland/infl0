import { summarizeOperatorAccess } from '../utils/operator-access'

/**
 * Surface the operator allowlist state once at server start.
 *
 * Without this, a silently-broken `NUXT_OPERATOR_EMAILS` (unset, blank,
 * or only invalid entries) only manifests as a 403 on `/operator/*`.
 * The log line makes the misconfiguration visible at boot so operators
 * can fix the env var before opening a ticket.
 */
export default defineNitroPlugin(() => {
  const { configured, count, invalid } = summarizeOperatorAccess()

  if (!configured) {
    console.warn(
      '[operator-access] NUXT_OPERATOR_EMAILS is empty — /operator/* will deny every request (403). Set the env var to enable.',
    )
    return
  }

  if (count === 0) {
    console.warn(
      `[operator-access] NUXT_OPERATOR_EMAILS has ${invalid.length} entr${invalid.length === 1 ? 'y' : 'ies'} but none look like an email — /operator/* will deny every request (403). Invalid: ${invalid.join(', ')}`,
    )
    return
  }

  if (invalid.length > 0) {
    console.warn(
      `[operator-access] ignoring ${invalid.length} invalid operator email${invalid.length === 1 ? '' : 's'} in NUXT_OPERATOR_EMAILS (missing \`@…\`): ${invalid.join(', ')}`,
    )
  }
  console.info(
    `[operator-access] ${count} operator email${count === 1 ? '' : 's'} configured`,
  )
})
