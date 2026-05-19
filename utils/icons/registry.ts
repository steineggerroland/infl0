/**
 * Curated infl0 icon set (24×24, stroke/fill via `currentColor`).
 *
 * Add icons from e.g. [OpenSVG](https://opensvg.dev/icons) (Material Design Icons, Lucide, …):
 * 1. Pick one SVG, download, strip width/height if present.
 * 2. Save under `assets/icons/<kebab-name>.svg`.
 * 3. Register a **semantic** key here (`episode.play`, not `mdi-play`).
 * 4. Use `<Infl0Icon name="episode.play" />` from `components/Infl0Icon.vue` — never import SVG paths in components.
 *
 * Keep the set small; domain-specific composites stay in components (e.g. play + external).
 */

import chevronDown from '~/assets/icons/chevron-down.svg?raw'
import chevronUp from '~/assets/icons/chevron-up.svg?raw'
import filmstrip from '~/assets/icons/filmstrip.svg?raw'
import openInNew from '~/assets/icons/open-in-new.svg?raw'
import play from '~/assets/icons/play.svg?raw'
import podcast from '~/assets/icons/podcast.svg?raw'
import rss from '~/assets/icons/rss.svg?raw'
import star from '~/assets/icons/star.svg?raw'
import web from '~/assets/icons/web.svg?raw'

export const infl0Icons = {
  'chevron.down': chevronDown,
  'chevron.up': chevronUp,
  'episode.play': play,
  'episode.external': openInNew,
  'episode.podcast': podcast,
  'episode.web': web,
  'episode.feed': rss,
  'episode.trailer': filmstrip,
  'episode.bonus': star,
} as const

export type Infl0IconName = keyof typeof infl0Icons

export function infl0IconMarkup(name: Infl0IconName): string {
  return infl0Icons[name]
}
