import { describe, expect, it } from 'vitest'
import apiCatchAll from '../../server/api/[...path]'

/**
 * `/api/*` must always behave as an API surface.
 *
 * This test pins the fallback contract for unknown API routes:
 * - HTTP 404 status
 * - structured JSON body
 * - includes the requested path for debugging
 */
describe('server/api/[...path] fallback', () => {
  it('returns JSON 404 for unknown API paths', async () => {
    const event = {
      path: '/api/not-existing',
      node: {
        res: {
          statusCode: 200,
          statusMessage: 'OK',
        },
      },
    } as unknown as Parameters<typeof apiCatchAll>[0]

    const payload = await apiCatchAll(event)

    expect(event.node.res.statusCode).toBe(404)
    expect(event.node.res.statusMessage).toBe('Not Found')
    expect(payload).toEqual({
      statusCode: 404,
      message: 'Not found',
      path: '/api/not-existing',
    })
  })
})

