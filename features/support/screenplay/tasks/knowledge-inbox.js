import { expect } from '@playwright/test'
import { BrowseTheWeb } from '../abilities/browse-the-web.js'
import { ReaderTimeline } from '../../reader-timeline.js'

export function SaveToKnowledgeInbox(contentType = 'article') {
  const testId = contentType === 'episode' ? 'episode-save-inbox' : 'article-save-inbox'
  return {
    description: `Save the focused ${contentType} to the knowledge inbox`,
    async performAs(actor) {
      const timeline = new ReaderTimeline(BrowseTheWeb.as(actor))
      const cardSelector =
        contentType === 'episode'
          ? timeline.episodeCard(actor.recall('currentReaderArticleId'))
          : timeline.articleCard(actor.recall('currentReaderArticleId'))
      await timeline.focusCard(cardSelector)
      const button = cardSelector.getByTestId(testId)
      await button.click()
      await expect(button).toHaveAttribute('aria-pressed', 'true', { timeout: 10_000 })
      await BrowseTheWeb.as(actor).getByTestId('app-toast-success').first().waitFor({ timeout: 10_000 })
    },
  }
}
