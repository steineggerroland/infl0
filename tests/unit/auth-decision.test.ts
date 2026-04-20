import { describe, expect, it } from 'vitest'
import { resolveAuthDecision, type AuthMode } from '../../utils/auth-decision'

describe('resolveAuthDecision', () => {
  describe('public pages', () => {
    const mode: AuthMode = 'public'

    it('allows access without checking the user', () => {
      expect(resolveAuthDecision({ mode, user: null, requestedPath: '/help' }))
        .toEqual({ kind: 'allow', requiresAuthLookup: false })
    })

    it('still allows when a user is signed in', () => {
      expect(
        resolveAuthDecision({
          mode,
          user: { id: 'u1' },
          requestedPath: '/help',
        }),
      ).toEqual({ kind: 'allow', requiresAuthLookup: false })
    })
  })

  describe('auth entry pages (login, register)', () => {
    const mode: AuthMode = 'entry'

    it('requires the auth lookup', () => {
      expect(
        resolveAuthDecision({ mode, user: null, requestedPath: '/login' }).requiresAuthLookup,
      ).toBe(true)
    })

    it('redirects signed-in users to the home timeline', () => {
      expect(
        resolveAuthDecision({
          mode,
          user: { id: 'u1' },
          requestedPath: '/login',
        }),
      ).toEqual({ kind: 'redirect', to: '/', requiresAuthLookup: true })
    })

    it('lets signed-out users reach the entry page', () => {
      expect(resolveAuthDecision({ mode, user: null, requestedPath: '/login' }))
        .toEqual({ kind: 'allow', requiresAuthLookup: true })
    })
  })

  describe('required pages (default)', () => {
    const mode: AuthMode = 'required'

    it('requires the auth lookup', () => {
      expect(
        resolveAuthDecision({ mode, user: null, requestedPath: '/feeds' }).requiresAuthLookup,
      ).toBe(true)
    })

    it('redirects signed-out users to /login with the original path encoded', () => {
      expect(
        resolveAuthDecision({
          mode,
          user: null,
          requestedPath: '/feeds?foo=bar',
        }),
      ).toEqual({
        kind: 'redirect',
        to: '/login?redirect=%2Ffeeds%3Ffoo%3Dbar',
        requiresAuthLookup: true,
      })
    })

    it('allows signed-in users through', () => {
      expect(
        resolveAuthDecision({
          mode,
          user: { id: 'u1' },
          requestedPath: '/feeds',
        }),
      ).toEqual({ kind: 'allow', requiresAuthLookup: true })
    })
  })

  describe('default / missing mode', () => {
    it('treats an undefined mode as required', () => {
      expect(
        resolveAuthDecision({
          mode: undefined,
          user: null,
          requestedPath: '/feeds',
        }),
      ).toEqual({
        kind: 'redirect',
        to: '/login?redirect=%2Ffeeds',
        requiresAuthLookup: true,
      })
    })

    it('rejects unknown mode values with a clear error', () => {
      expect(() =>
        resolveAuthDecision({
          mode: 'wat' as AuthMode,
          user: null,
          requestedPath: '/feeds',
        }),
      ).toThrowError(/unknown auth mode/i)
    })
  })
})
