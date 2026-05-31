const originalWarn = console.warn
console.warn = (...args: unknown[]) => {
  const first = typeof args[0] === 'string' ? args[0] : ''
  if (first.includes('[intlify]') || first.includes('[Vue warn]')) return
  originalWarn.call(console, first || '[non-string warning]')
}
