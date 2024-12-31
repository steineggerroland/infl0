import { defineContentConfig, defineCollection, z } from '@nuxt/content'

export default defineContentConfig({
  collections: {
    articles: defineCollection({
      type: 'data',
      source: 'articles/**/*.json',
      schema: z.object({
        id: z.string().describe('A unique identifier for the article'),
        title: z.string().describe('The title of the article'),
        link: z.string().url().describe('The URL of the original article'),
        author: z.string().optional().describe('The author'),
        summary: z
          .string()
          .optional()
          .describe('A short summary of the article'),
        publishedAt: z.date().describe('The publication date of the article'),
        updatedAt: z
          .date()
          .optional()
          .describe('The last updated date of the article'),
        teaser: z
          .string()
          .optional()
          .describe('A short teaser text to grab attention'),
        summary_long: z
          .string()
          .optional()
          .describe('A detailed summary of the article'),
        category: z
          .array(z.string())
          .optional()
          .describe('Categories associated with the article'),
        tags: z.array(z.string()).optional().describe('Tags for the article'),
        tone: z
          .array(z.string())
          .optional()
          .describe('Tone of the article (e.g., informative, engaging)'),
        tld: z.string().optional().describe('Top level domain of article'),
        source_type: z.string().describe('The type of source (e.g., rss, html)')
      })
    })
  }
})
