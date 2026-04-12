/**
 * Normalize $fetch / ofetch / useFetch errors for UI messages.
 */
export function parseFetchError(e: unknown): { statusCode?: number; message: string } {
  const err = e as {
    statusCode?: number
    status?: number
    statusMessage?: string
    message?: string
    data?: { statusMessage?: string }
  }
  const statusCode = err?.statusCode ?? err?.status
  const message =
    (typeof err?.data?.statusMessage === 'string' && err.data.statusMessage) ||
    (typeof err?.statusMessage === 'string' && err.statusMessage) ||
    (typeof err?.message === 'string' && err.message) ||
    ''
  return { statusCode, message }
}
