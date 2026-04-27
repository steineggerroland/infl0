/**
 * Tiny, dependency-free scanner that pulls out every key registered in
 * a `defineShortcuts({...})` call inside a `.vue` or `.ts` source file.
 *
 * Why this lives in `tests/_helpers/`:
 *
 * - Used only by the shortcuts-coverage test
 *   (`tests/unit/shortcuts-coverage.test.ts`), which guards that every
 *   `defineShortcuts` registration in the app is either listed in the
 *   help-page catalog (`utils/app-shortcuts.ts`) or on an explicit
 *   allow-list with a written reason.
 * - The scanner itself has no Nuxt / Vue dependencies. It is a small
 *   character-by-character parser so it can:
 *   * skip strings (single, double, template) and JS comments
 *     (`//` and `/* * /`) — important because the codebase has JSDoc
 *     blocks that mention `defineShortcuts(...)` as an example;
 *   * track balanced `(){}[]` so a key like `'shift+l': () => {...}` is
 *     not confused with anything inside the handler body;
 *   * extract only the *top-level* property names of the first object
 *     literal passed to `defineShortcuts(...)` — those are the keys
 *     `useShortcuts.ts` matches against `event.key.toLowerCase()`.
 *
 * The parser deliberately accepts both quoted (`'+': ...`,
 * `"shift+k": ...`) and bareword (`r: ...`, `numpadadd: ...`) keys, in
 * any order, with or without trailing commas, and with an optional
 * second argument (the `{ when, skipEditableTarget }` options object).
 *
 * Computed keys (`[expr]: ...`) and spread (`...obj`) are silently
 * skipped because we cannot resolve them statically — the coverage
 * test will then notice that no key was reported and the developer can
 * decide whether to refactor or add an allow-list entry.
 *
 * Pinned by `tests/unit/parse-define-shortcuts.test.ts`.
 */

const IDENT_RE = /[a-zA-Z0-9_$]/

interface ParseState {
    src: string
    i: number
}

/**
 * Extract every `defineShortcuts(...)` key in `source`.
 *
 * Returns the keys verbatim as they appear in source (lowercase or
 * mixed case, however the file declares them). The coverage test
 * normalises to lowercase before comparing against the catalog because
 * `useShortcuts.ts` lowercases `event.key` at runtime.
 */
export function extractDefineShortcutsKeys(
    source: string,
    fileKind: 'vue' | 'ts',
): string[] {
    const script = fileKind === 'vue' ? extractScriptBlocks(source) : source
    const keys: string[] = []
    const state: ParseState = { src: script, i: 0 }
    while (state.i < state.src.length) {
        if (skipStringOrComment(state)) continue
        if (matchDefineShortcutsCall(state)) {
            // We are now positioned at the `{` that opens the keys map.
            keys.push(...parseTopLevelObjectKeys(state))
            continue
        }
        state.i++
    }
    return keys
}

function extractScriptBlocks(source: string): string {
    const blocks: string[] = []
    const re = /<script\b[^>]*>([\s\S]*?)<\/script(?:\s[^>]*)?>/gi
    let m: RegExpExecArray | null
    while ((m = re.exec(source)) !== null) blocks.push(m[1] ?? '')
    return blocks.join('\n')
}

/**
 * If the cursor sits on a string opener or comment opener, advance past
 * the whole construct and return `true`. Otherwise return `false`.
 */
function skipStringOrComment(state: ParseState): boolean {
    const c = state.src[state.i]
    const next = state.src[state.i + 1]
    if (c === '"' || c === "'" || c === '`') {
        skipString(state)
        return true
    }
    if (c === '/' && next === '/') {
        while (state.i < state.src.length && state.src[state.i] !== '\n') state.i++
        return true
    }
    if (c === '/' && next === '*') {
        state.i += 2
        while (
            state.i < state.src.length &&
            !(state.src[state.i] === '*' && state.src[state.i + 1] === '/')
        ) {
            state.i++
        }
        state.i += 2
        return true
    }
    return false
}

function skipString(state: ParseState): void {
    const quote = state.src[state.i]
    state.i++
    while (state.i < state.src.length) {
        const c = state.src[state.i]
        if (c === '\\') {
            state.i += 2
            continue
        }
        if (c === quote) {
            state.i++
            return
        }
        if (quote === '`' && c === '$' && state.src[state.i + 1] === '{') {
            // Template-literal interpolation. Walk the inner expression
            // with full balanced/string awareness so a stray `}` does not
            // close the literal early.
            state.i += 2
            skipBalanced(state, '{', '}', /* alreadyInside */ true)
            continue
        }
        state.i++
    }
}

function skipWhitespaceAndComments(state: ParseState): void {
    while (state.i < state.src.length) {
        const c = state.src[state.i]
        if (c === ' ' || c === '\t' || c === '\n' || c === '\r') {
            state.i++
            continue
        }
        if (c === '/' && state.src[state.i + 1] === '/') {
            while (state.i < state.src.length && state.src[state.i] !== '\n') state.i++
            continue
        }
        if (c === '/' && state.src[state.i + 1] === '*') {
            state.i += 2
            while (
                state.i < state.src.length &&
                !(state.src[state.i] === '*' && state.src[state.i + 1] === '/')
            ) {
                state.i++
            }
            state.i += 2
            continue
        }
        return
    }
}

/**
 * If the cursor sits on a `defineShortcuts(` call (with proper word
 * boundaries) followed by an inline object literal, advance past the
 * `(` and the leading whitespace so the cursor sits on `{`, then
 * return `true`. Otherwise the cursor is unchanged and we return
 * `false`.
 */
function matchDefineShortcutsCall(state: ParseState): boolean {
    const NAME = 'defineShortcuts'
    if (!state.src.startsWith(NAME, state.i)) return false
    const before = state.i > 0 ? state.src[state.i - 1] : ''
    if (before && IDENT_RE.test(before)) return false
    const after = state.src[state.i + NAME.length]
    if (after && IDENT_RE.test(after)) return false

    // Tentatively advance; if it turns out not to be a call (no `(` or
    // not followed by an inline object literal), restore.
    const saved = state.i
    state.i += NAME.length
    skipWhitespaceAndComments(state)
    if (state.src[state.i] !== '(') {
        state.i = saved
        return false
    }
    state.i++
    skipWhitespaceAndComments(state)
    if (state.src[state.i] !== '{') {
        // First argument is not an inline object literal (e.g. the
        // function definition signature in `useShortcuts.ts`, or a
        // call passing a variable). Nothing to extract here.
        state.i = saved + NAME.length
        return false
    }
    return true
}

/**
 * Parse the keys of the top-level object literal whose opening `{` is
 * at `state.i`. Advances past the matching `}`.
 */
function parseTopLevelObjectKeys(state: ParseState): string[] {
    if (state.src[state.i] !== '{') return []
    state.i++ // consume `{`

    const keys: string[] = []
    while (state.i < state.src.length) {
        skipWhitespaceAndComments(state)
        const c = state.src[state.i]
        if (c === undefined) break
        if (c === '}') {
            state.i++
            return keys
        }
        if (c === ',') {
            state.i++
            continue
        }
        const key = readPropertyKey(state)
        skipWhitespaceAndComments(state)
        const sep = state.src[state.i]
        if (sep === ':') {
            state.i++
            if (key !== null) keys.push(key)
            skipPropertyValue(state)
        } else {
            // Shorthand (`{ a, b }`), method shorthand (`{ a() {} }`),
            // spread, or computed key without `:`. We don't capture
            // those — skip to the next comma or `}`.
            skipPropertyValue(state)
        }
    }
    return keys
}

function readPropertyKey(state: ParseState): string | null {
    const c = state.src[state.i]
    if (c === "'" || c === '"') {
        const start = state.i + 1
        const quote = c
        let i = start
        while (i < state.src.length) {
            const ch = state.src[i]
            if (ch === '\\') {
                i += 2
                continue
            }
            if (ch === quote) break
            i++
        }
        const value = state.src.slice(start, i)
        state.i = i + 1
        return value
    }
    if (c === '[') {
        // Computed key — bail.
        skipBalanced(state, '[', ']', false)
        return null
    }
    if (c === '.' && state.src[state.i + 1] === '.' && state.src[state.i + 2] === '.') {
        // Spread — bail.
        state.i += 3
        return null
    }
    if (c && /[a-zA-Z_$]/.test(c)) {
        const start = state.i
        while (state.i < state.src.length && IDENT_RE.test(state.src[state.i] ?? '')) {
            state.i++
        }
        return state.src.slice(start, state.i)
    }
    // Number-literal keys (e.g. `0:`) are also bareword in JS object
    // literals.
    if (c && /[0-9]/.test(c)) {
        const start = state.i
        while (state.i < state.src.length && /[0-9]/.test(state.src[state.i] ?? '')) {
            state.i++
        }
        return state.src.slice(start, state.i)
    }
    return null
}

/** Skip from the cursor up to (but not including) the next top-level `,` or `}`. */
function skipPropertyValue(state: ParseState): void {
    while (state.i < state.src.length) {
        if (skipStringOrComment(state)) continue
        const c = state.src[state.i]
        if (c === ',' || c === '}') return
        if (c === '(' || c === '{' || c === '[') {
            skipBalanced(state, c, matching(c), false)
            continue
        }
        state.i++
    }
}

function matching(open: string): string {
    if (open === '(') return ')'
    if (open === '{') return '}'
    return ']'
}

/**
 * Walk forward until the matching close bracket of a balanced
 * `()` / `{}` / `[]` group is consumed. When `alreadyInside` is true,
 * the cursor is assumed to already sit inside the group at depth 1
 * (used for template-literal interpolations).
 */
function skipBalanced(
    state: ParseState,
    open: string,
    close: string,
    alreadyInside: boolean,
): void {
    let depth = alreadyInside ? 1 : 0
    if (!alreadyInside) {
        depth = 1
        state.i++
    }
    while (state.i < state.src.length) {
        if (skipStringOrComment(state)) continue
        const c = state.src[state.i]
        if (c === open) depth++
        else if (c === close) {
            depth--
            state.i++
            if (depth === 0) return
            continue
        } else if (c === '(' || c === '{' || c === '[') {
            // A different bracket kind — recurse.
            skipBalanced(state, c, matching(c), false)
            continue
        }
        state.i++
    }
}
