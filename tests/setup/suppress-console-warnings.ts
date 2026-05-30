const originalWarn = console.warn
console.warn = (...args: any[]) => {
  const msg = args.join(' ')
  if (msg.includes('[intlify]') || msg.includes('[Vue warn]')) return
  originalWarn.call(console, ...args)
}
