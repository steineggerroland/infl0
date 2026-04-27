/**
 * Single source of truth for the **central shortcuts reference** rendered
 * in `pages/help.vue` (anchor `#shortcuts-reference`).
 *
 * Why this file exists — see `docs/planned/shortcuts-help.md`:
 *
 * - The implementation of each shortcut still lives inside the feature
 *   that owns it (timeline `defineShortcuts` in `pages/index.vue`,
 *   readability shortcuts in `components/ArticleView.vue`,
 *   modal dismissal in `components/InfoPopover.vue`, etc.).
 * - Keeping the **user-facing reference** here (instead of a long
 *   hand-written table in i18n) avoids a third copy that drifts out of
 *   sync with the actual `defineShortcuts` calls and with the help-page
 *   FAQ entry under `help.items.shortcuts`.
 *
 * Editorial guardrails (`docs/CONTENT_AND_A11Y.md`):
 *
 * - Group labels and the "in plain language" description for each
 *   shortcut live in i18n (`help.shortcutsReference.*`). This file only
 *   declares the **structural** metadata (which keys, in which group, in
 *   plain or chord form, and which scope label).
 * - "Plain key" tokens are the lowercase value `defineShortcuts` matches
 *   against; we render them in title case (`R` not `r`) inside `<kbd>`
 *   so users see what is on their keyboard.
 * - Modifier chords (`shift+l`) render as two tokens with a small `+`
 *   separator so screen-reader output stays sensible ("Shift then L").
 *
 * The legacy FAQ entry under `help.items.shortcuts` stays — it answers
 * the question "are there shortcuts at all?" — and links into the
 * reference for users who want the full table.
 */

/** A single key token that renders inside a `<kbd>`. */
export interface ShortcutToken {
    /** Lowercase value matched by `defineShortcuts` (e.g. `"r"`, `"shift+l"`). */
    raw: string
    /** What the user sees on their keyboard, e.g. `"R"`, `"Shift"`, `"L"`. */
    label: string
}

const MODIFIER_PREFIXES = ['shift+', 'alt+', 'ctrl+', 'meta+'] as const

/**
 * Parse a `defineShortcuts` map key into its visible tokens.
 *
 * - `"r"` -> `[{ raw: "r", label: "R" }]`
 * - `"shift+l"` -> `[{ raw: "shift+l", label: "Shift" }, { raw: "shift+l", label: "L" }]`
 * - `"arrowup"` -> `[{ raw: "arrowup", label: "↑" }]`
 * - `"+"` -> `[{ raw: "+", label: "+" }]` (literal `+` is a key, not a separator)
 *
 * Pure function so unit tests can pin the rendering without a Vue host.
 *
 * The `defineShortcuts` map only uses `+` as a separator after one of
 * the four allowed modifier prefixes (`shift+`, `alt+`, `ctrl+`,
 * `meta+`). Anywhere else `+` is the literal key the user presses
 * (font-size shortcut). Splitting blindly on `+` therefore breaks on
 * `'+'` itself; we strip an optional modifier prefix instead.
 */
export function tokenizeShortcutKey(key: string): ShortcutToken[] {
    const tokens: ShortcutToken[] = []
    let leaf = key.toLowerCase()
    for (const prefix of MODIFIER_PREFIXES) {
        if (leaf.startsWith(prefix)) {
            tokens.push({
                raw: key,
                label: humanizeKeyPart(prefix.replace('+', ''), false),
            })
            leaf = leaf.slice(prefix.length)
            break
        }
    }
    tokens.push({ raw: key, label: humanizeKeyPart(leaf, true) })
    return tokens
}

function humanizeKeyPart(part: string, isLeafKey: boolean): string {
    const p = part.toLowerCase()
    if (p === 'shift') return 'Shift'
    if (p === 'alt') return 'Alt'
    if (p === 'ctrl') return 'Ctrl'
    if (p === 'meta') return 'Meta'
    if (p === 'arrowup') return '↑'
    if (p === 'arrowdown') return '↓'
    if (p === 'arrowleft') return '←'
    if (p === 'arrowright') return '→'
    if (p === 'escape') return 'Esc'
    if (p === 'numpadadd') return 'Num +'
    if (p === 'numpadsubtract') return 'Num −'
    if (p === 'numpad0') return 'Num 0'
    // A leaf key is always displayed upper-case so users see the printed
    // glyph on their keyboard. Modifiers above already returned their own
    // canonical capitalisation.
    return isLeafKey ? part.toUpperCase() : part
}

/**
 * One row in the reference. Multiple key combos can map to the same row
 * when they are interchangeable (e.g. `+` and `=` both bump the font
 * size); they render as a comma-separated list.
 */
export interface ShortcutEntry {
    /** Stable id, also used as the i18n suffix under `help.shortcutsReference.entries.<id>`. */
    id: string
    /** Key combos as they appear in the matching `defineShortcuts` map. */
    keys: string[]
}

/**
 * One group in the reference. Groups exist so a user with a focus card
 * can scan "what works in the timeline?" without reading every line.
 */
export interface ShortcutGroup {
    /** Stable id, used as the i18n suffix under `help.shortcutsReference.groups.<id>`. */
    id: string
    entries: ShortcutEntry[]
}

/**
 * The catalog. **Order matters** — it is the order users see on the
 * help page. Keep groups in the order a user is likely to discover the
 * features themselves: navigate the timeline first, then read an
 * article, then nudge readability if the text is too small.
 */
export const SHORTCUT_GROUPS: ShortcutGroup[] = [
    {
        id: 'timeline',
        entries: [
            { id: 'navigatePrev', keys: ['w', 'arrowup'] },
            { id: 'navigateNext', keys: ['s', 'arrowdown'] },
            { id: 'toggleShowRead', keys: ['r'] },
        ],
    },
    {
        id: 'article',
        entries: [
            { id: 'flipCard', keys: ['e'] },
            { id: 'openOriginal', keys: ['q'] },
            { id: 'closeSurface', keys: ['escape'] },
        ],
    },
    {
        id: 'readability',
        entries: [
            { id: 'fontBigger', keys: ['+', '=', 'numpadadd'] },
            { id: 'fontSmaller', keys: ['-', 'numpadsubtract'] },
            { id: 'fontReset', keys: ['0', 'numpad0'] },
            { id: 'fontFamilyPrev', keys: ['shift+k'] },
            { id: 'fontFamilyNext', keys: ['shift+l'] },
        ],
    },
]
