const originalWarn = console.warn

const SENSITIVE_ENV_NAME_PATTERN =
  /\b(DEV_SRP_SALT_HEX|DEV_SRP_VERIFIER_HEX|OPERATOR_SRP_SALT_HEX|OPERATOR_SRP_VERIFIER_HEX)\b/giu
const SENSITIVE_KEY_VALUE_PATTERN =
  /\b(pass(?:word)?|token|secret|api[_-]?key|authorization|cookie|session|verifier|salt)\b\s*[:=]\s*(".*?"|'.*?'|[^\s,;}]+)/giu
const SENSITIVE_JSON_PROPERTY_PATTERN =
  /(["'])(pass(?:word)?|token|secret|api[_-]?key|authorization|cookie|session|verifier|salt)\1\s*:\s*(["'])(.*?)\3/giu

export function redactConsoleWarning(value: string): string {
  return value
    .replace(SENSITIVE_ENV_NAME_PATTERN, '[REDACTED_ENV]')
    .replace(SENSITIVE_JSON_PROPERTY_PATTERN, '$1$2$1: "[REDACTED]"')
    .replace(SENSITIVE_KEY_VALUE_PATTERN, (_match, key) => `${key}=[REDACTED]`)
}

function stringifyWarningArg(arg: unknown): string {
  if (typeof arg === 'string') return arg
  if (arg instanceof Error) return `${arg.name}: ${arg.message}`
  try {
    const serialized = JSON.stringify(arg)
    return serialized ?? String(arg)
  } catch {
    return '[Unserializable value]'
  }
}

function sanitizeWarningArg(arg: unknown): string {
  return redactConsoleWarning(stringifyWarningArg(arg))
}

console.warn = (...args: unknown[]) => {
  const first = typeof args[0] === 'string' ? args[0] : ''
  if (first.includes('[intlify]') || first.includes('[Vue warn]')) return

  const sanitizedArgs = args.length > 0
    ? args.map((arg) => sanitizeWarningArg(arg))
    : ['[sanitized warning]']

  originalWarn.call(console, ...sanitizedArgs)
}
