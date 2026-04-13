import type { ArticleEngagementSegment } from '../../../utils/article-engagement'

export type ArticleEngagementLoggedEvent = {
  type: 'engagement.article.logged'
  userId: string
  articleId: string
  segment: ArticleEngagementSegment
  durationSec: number
  occurredAt: Date
}

type ApplicationEvent = ArticleEngagementLoggedEvent
type Handler<T extends ApplicationEvent> = (event: T) => Promise<void> | void

class ApplicationEventBus {
  private engagementHandlers: Handler<ArticleEngagementLoggedEvent>[] = []

  onArticleEngagementLogged(handler: Handler<ArticleEngagementLoggedEvent>) {
    this.engagementHandlers.push(handler)
  }

  async emit(event: ApplicationEvent): Promise<void> {
    if (event.type === 'engagement.article.logged') {
      for (const handler of this.engagementHandlers) {
        await handler(event)
      }
    }
  }
}

const globalBus = globalThis as unknown as {
  infl0AppEventBus?: ApplicationEventBus
}

export const applicationEventBus = globalBus.infl0AppEventBus ?? new ApplicationEventBus()

if (!globalBus.infl0AppEventBus) {
  globalBus.infl0AppEventBus = applicationEventBus
}

