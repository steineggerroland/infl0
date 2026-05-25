import { summarizeOperatorAccess } from '../utils/operator-access'

/**
 * Surface the operator allowlist state once at server start.
 */
export default defineNitroPlugin(() => {
  const { configured, count, invalid } = summarizeOperatorAccess()

  if (!configured) {
    console.warn(
      '[operator-access] NUXT_OPERATOR_USERNAMES is empty — /operator/* will deny every request (403). Set the env var to enable.',
    )
    return
  }

  if (count === 0) {
    console.warn(
      `[operator-access] NUXT_OPERATOR_USERNAMES has ${invalid.length} entr${invalid.length === 1 ? 'y' : 'ies'} but none are valid usernames — /operator/* will deny every request (403). Invalid: ${invalid.join(', ')}`,
    )
    return
  }

  if (invalid.length > 0) {
    console.warn(
      `[operator-access] ignoring ${invalid.length} invalid operator username${invalid.length === 1 ? '' : 's'} in NUXT_OPERATOR_USERNAMES: ${invalid.join(', ')}`,
    )
  }
  console.info(
    `[operator-access] ${count} operator username${count === 1 ? '' : 's'} configured`,
  )
})
