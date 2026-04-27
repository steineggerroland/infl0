import { describe, expect, it } from 'vitest'
import { extractDefineShortcutsKeys } from '../_helpers/parse-define-shortcuts'
import { SHORTCUT_GROUPS } from '../../utils/app-shortcuts'

/**
 * Drift guard for the central keyboard-shortcut reference.
 *
 * Goal: a `defineShortcuts(...)` registration must not silently
 * "rutsch durch" — every key that the app actually listens for is
 * either listed in the user-facing catalog at
 * `utils/app-shortcuts.ts` (and therefore on `/help#shortcuts-reference`),
 * **or** it is on the `KNOWN_UNDOCUMENTED_KEYS` allow-list below with
 * a written reason. Adding the second option is a feature, not a
 * loophole: some shortcuts are infrastructure (e.g. an internal
 * `Escape` dismissal in a dialog component) that maps onto a single
 * user-facing row, and forcing them all into the catalog would just
 * produce duplicates and false confidence.
 *
 * The allow-list keeps those decisions visible at review time. A new
 * entry must come with a reason string — empty / missing strings fail
 * the test.
 *
 * The test also runs the inverse direction: every combo declared in
 * the catalog must be registered somewhere. That catches dead rows
 * and typos in `SHORTCUT_GROUPS` (e.g. `'shift+k'` vs `'Shift+K'`)
 * that would otherwise render in the help page but never fire.
 */

/**
 * `import.meta.glob` is Vite-native and runs synchronously under
 * Vitest. Scoping it to the three source folders that legitimately
 * own user-facing shortcuts is itself a contract: if a future feature
 * registers shortcuts somewhere else (e.g. `layouts/`), the developer
 * has to extend this glob — and in that moment they also see this
 * test and the catalog. The whole point is that there is *one* place
 * where "where do shortcuts live?" is declared.
 */
const SOURCE_FILES = import.meta.glob(
    [
        '../../pages/**/*.vue',
        '../../pages/**/*.ts',
        '../../components/**/*.vue',
        '../../components/**/*.ts',
        '../../composables/**/*.ts',
    ],
    { eager: true, query: '?raw', import: 'default' },
) as Record<string, string>

/**
 * Per-key allow-list. Keep keys lowercase (matches what
 * `defineShortcuts` does at runtime) and pair each with a *non-empty*
 * reason that explains why the key is intentionally not surfaced as
 * its own row in the help-page reference.
 *
 * Today: empty. Every registered key is covered by a catalog row.
 * The block below documents the *shape* we want for future entries
 * and the kind of reasoning we expect.
 *
 * Example (do not copy unless this case actually applies):
 *
 *   '?': 'opens the future on-screen cheat sheet — covered by its own help section, not as a row',
 */
const KNOWN_UNDOCUMENTED_KEYS: Record<string, string> = {}

function collectRegisteredKeys(): Map<string, Set<string>> {
    const byKey = new Map<string, Set<string>>()
    for (const [path, source] of Object.entries(SOURCE_FILES)) {
        const kind: 'vue' | 'ts' = path.endsWith('.vue') ? 'vue' : 'ts'
        const keys = extractDefineShortcutsKeys(source, kind)
        for (const k of keys) {
            const norm = k.toLowerCase()
            if (!byKey.has(norm)) byKey.set(norm, new Set())
            byKey.get(norm)!.add(path)
        }
    }
    return byKey
}

function collectCatalogKeys(): Set<string> {
    const out = new Set<string>()
    for (const group of SHORTCUT_GROUPS) {
        for (const entry of group.entries) {
            for (const key of entry.keys) out.add(key.toLowerCase())
        }
    }
    return out
}

describe('shortcut catalog coverage', () => {
    const registered = collectRegisteredKeys()
    const cataloged = collectCatalogKeys()

    it('found at least one defineShortcuts call to scan', () => {
        // A trivially-passing test would be worse than no test. If the
        // glob ever drifts, this assertion fails first and tells the
        // reviewer the discovery mechanism, not the catalog, is broken.
        expect(registered.size).toBeGreaterThan(0)
    })

    it('finds the call sites we currently know about', () => {
        // Soft pin so a refactor that *moves* `defineShortcuts` out of
        // these files prompts a conscious update of either this test
        // or the source layout. Not an alphabetised list — this is
        // about coverage, not aesthetics.
        const allFiles = new Set<string>()
        for (const files of registered.values()) {
            for (const f of files) allFiles.add(f)
        }
        const expected = [
            'pages/index.vue',
            'components/ArticleView.vue',
            'components/InfoPopover.vue',
        ]
        for (const path of expected) {
            const found = [...allFiles].some((p) => p.endsWith(path))
            expect(
                found,
                `expected at least one defineShortcuts call in ${path}`,
            ).toBe(true)
        }
    })

    it('every registered shortcut is either in the catalog or on the allow-list', () => {
        const undocumented: Array<{ key: string; files: string[] }> = []
        for (const [key, files] of registered) {
            if (cataloged.has(key)) continue
            if (key in KNOWN_UNDOCUMENTED_KEYS) continue
            undocumented.push({ key, files: [...files] })
        }
        expect(
            undocumented,
            buildUndocumentedMessage(undocumented),
        ).toEqual([])
    })

    it('every allow-listed key carries a non-empty reason', () => {
        const offenders: string[] = []
        for (const [key, reason] of Object.entries(KNOWN_UNDOCUMENTED_KEYS)) {
            if (typeof reason !== 'string' || reason.trim().length === 0) {
                offenders.push(key)
            }
        }
        expect(
            offenders,
            'KNOWN_UNDOCUMENTED_KEYS entries must include a reason string explaining why the key is not in the catalog',
        ).toEqual([])
    })

    it('every allow-listed key is actually registered somewhere (no stale entries)', () => {
        const stale: string[] = []
        for (const key of Object.keys(KNOWN_UNDOCUMENTED_KEYS)) {
            if (!registered.has(key)) stale.push(key)
        }
        expect(
            stale,
            'allow-list contains keys that no longer appear in any defineShortcuts call: remove them from KNOWN_UNDOCUMENTED_KEYS',
        ).toEqual([])
    })

    it('every catalog combo is registered somewhere', () => {
        const missing: string[] = []
        for (const group of SHORTCUT_GROUPS) {
            for (const entry of group.entries) {
                for (const key of entry.keys) {
                    if (!registered.has(key.toLowerCase())) {
                        missing.push(`${group.id}.${entry.id} → "${key}"`)
                    }
                }
            }
        }
        expect(
            missing,
            'catalog rows declare shortcuts that no defineShortcuts call registers — either fix the typo or remove the dead row',
        ).toEqual([])
    })
})

function buildUndocumentedMessage(
    undocumented: Array<{ key: string; files: string[] }>,
): string {
    if (undocumented.length === 0) return ''
    const lines = undocumented.map(({ key, files }) => {
        const fileList = files.map((f) => f.replace(/^.*\/(?=pages|components|composables)/, '')).join(', ')
        return `  - "${key}" (registered in ${fileList})`
    })
    return [
        'shortcuts are registered with defineShortcuts but neither listed in',
        'utils/app-shortcuts.ts (SHORTCUT_GROUPS) nor on the allow-list',
        '(KNOWN_UNDOCUMENTED_KEYS) in this test:',
        ...lines,
        '',
        'Either add a catalog row (preferred — the user-facing reference is the point of',
        'docs/archive/26-04-27-shortcuts-help.md), or, if the shortcut is intentionally',
        'not surfaced on its own, add it to KNOWN_UNDOCUMENTED_KEYS with a written reason.',
    ].join('\n')
}
