/**
 * Help-page shortcut entry ids for BDD — keep aligned with `utils/app-shortcuts.ts`
 * (`SHORTCUT_GROUPS`).
 */
export const HELP_SHORTCUT_GROUPS = [
  {
    id: 'timeline',
    entryIds: ['navigatePrev', 'navigateNext', 'toggleShowRead'],
  },
  {
    id: 'article',
    entryIds: ['flipCard', 'toggleReadState', 'openOriginal', 'closeSurface'],
  },
  {
    id: 'readability',
    entryIds: ['fontBigger', 'fontSmaller', 'fontReset', 'fontFamilyPrev', 'fontFamilyNext'],
  },
]
