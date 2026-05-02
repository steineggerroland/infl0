import { describe, expect, it } from 'vitest'
import { parseInflowAnchorPath, pathForInflowAnchor } from '../../utils/inflow-route'

describe('inflow route helpers', () => {
  it('builds and parses article deep-link paths', () => {
    const path = pathForInflowAnchor({ type: 'article', id: 'article/with spaces' })

    expect(path).toBe('/inflow/article/article%2Fwith%20spaces')
    expect(parseInflowAnchorPath(path)).toEqual({
      type: 'article',
      id: 'article/with spaces',
    })
  })

  it('builds and parses onboarding deep-link paths', () => {
    const path = pathForInflowAnchor({ type: 'onboarding', id: 'onboarding/scoring' })

    expect(path).toBe('/inflow/onboarding/scoring')
    expect(parseInflowAnchorPath(path)).toEqual({
      type: 'onboarding',
      id: 'onboarding/scoring',
    })
  })

  it('returns null for non-inflow and malformed paths', () => {
    expect(parseInflowAnchorPath('/')).toBeNull()
    expect(parseInflowAnchorPath('/settings')).toBeNull()
    expect(parseInflowAnchorPath('/inflow/article/%E0%A4%A')).toBeNull()
    expect(parseInflowAnchorPath('/inflow/onboarding/')).toBeNull()
  })
})

