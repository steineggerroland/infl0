/**
 * Two-letter name badges must not show letter pairs that read as
 * well-known Nazi-era abbreviations (product policy, German locale).
 *
 * Replacements keep two monospace glyphs and avoid chaining into another
 * blocked pair (single lookup on the computed initials).
 */
const NAZI_ERA_INITIAL_REPLACEMENTS: Readonly<Record<string, string>> = {
  SS: 'SZ',
  SA: 'SZ',
  AH: 'A0',
  HH: 'H0',
  SD: 'S0',
  NS: 'N0',
  HJ: 'H0',
  KZ: 'K0',
}

/**
 * Returns a two-glyph badge string; if the uppercase pair is blocked,
 * returns the configured neutral alternative.
 */
export function sanitizeNameIconInitials(pair: string): string {
  const key = pair.toUpperCase().slice(0, 2)
  if (key.length < 2) return pair
  return NAZI_ERA_INITIAL_REPLACEMENTS[key] ?? pair
}
