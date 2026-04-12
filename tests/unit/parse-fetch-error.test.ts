import { describe, expect, it } from 'vitest'
import { parseFetchError } from '../../utils/parse-fetch-error'

describe('parseFetchError', () => {
  it('reads statusCode and data.statusMessage', () => {
    expect(
      parseFetchError({
        statusCode: 422,
        data: { statusMessage: 'Invalid feed URL' },
      }),
    ).toEqual({ statusCode: 422, message: 'Invalid feed URL' })
  })

  it('falls back to statusMessage', () => {
    expect(parseFetchError({ statusCode: 500, statusMessage: 'Server error' })).toEqual({
      statusCode: 500,
      message: 'Server error',
    })
  })

  it('uses status when statusCode missing', () => {
    expect(parseFetchError({ status: 401, message: 'Unauthorized' })).toEqual({
      statusCode: 401,
      message: 'Unauthorized',
    })
  })

  it('returns empty message for unknown input', () => {
    expect(parseFetchError(null)).toEqual({ statusCode: undefined, message: '' })
    expect(parseFetchError({})).toEqual({ statusCode: undefined, message: '' })
  })
})
