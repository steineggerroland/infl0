export type ArticleReadStateResponse = {
  ok: true
  readAt: string | null
}

export function useArticleReadState() {
  async function setReadState(articleId: string, read: boolean): Promise<ArticleReadStateResponse> {
    return await $fetch<ArticleReadStateResponse>(
      `/api/me/articles/${encodeURIComponent(articleId)}/read-state`,
      {
        method: 'PATCH',
        body: { read },
        credentials: 'include',
      },
    )
  }

  return { setReadState }
}
