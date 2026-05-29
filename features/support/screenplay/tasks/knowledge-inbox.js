import { BrowseTheWeb } from '../abilities/browse-the-web.js'
import { ReaderTimeline } from '../../reader-timeline.js'

export function SaveToKnowledgeInbox() {
  return {
    async performAs(actor) {
      const timeline = new ReaderTimeline(BrowseTheWeb.as(actor))
      await timeline.focusCard(
        timeline.articleCard(actor.recall('currentReaderArticleId')),
      )
      await BrowseTheWeb.as(actor)
        .getByTestId('article-save-inbox')
        .first()
        .click()
      await BrowseTheWeb.as(actor).getByRole('alert').filter({ hasText: /saved/i }).waitFor({ timeout: 10_000 })
    },
  }
}
