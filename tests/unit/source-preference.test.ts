import { describe, expect, it } from 'vitest'
import {
  SOURCE_PREFERENCE_BONUS,
  SOURCE_PREFERENCE_STEPS,
  quantizeSourcePreference,
  validateSourcePreference,
} from '../../utils/timeline-score-factors'

describe('source preference quantization', () => {
  it('exposes the nine canonical steps', () => {
    expect(SOURCE_PREFERENCE_STEPS).toEqual([
      -1, -0.75, -0.5, -0.25, 0, 0.25, 0.5, 0.75, 1,
    ])
  })

  it('quantize snaps values onto the 0.25 grid and clamps', () => {
    expect(quantizeSourcePreference(0)).toBe(0)
    expect(quantizeSourcePreference(0.3)).toBe(0.25)
    expect(quantizeSourcePreference(0.13)).toBe(0.25)
    expect(quantizeSourcePreference(-0.1)).toBe(0)
    expect(quantizeSourcePreference(-1.4)).toBe(-1)
    expect(quantizeSourcePreference(7)).toBe(1)
  })

  it('quantize rejects non-numbers / NaN', () => {
    expect(quantizeSourcePreference('1' as unknown)).toBeNull()
    expect(quantizeSourcePreference(NaN)).toBeNull()
    expect(quantizeSourcePreference(null)).toBeNull()
  })

  it('validate accepts only on-grid values inside [-1, +1]', () => {
    expect(validateSourcePreference(0)).toBe(0)
    expect(validateSourcePreference(0.5)).toBe(0.5)
    expect(validateSourcePreference(-0.75)).toBe(-0.75)
    expect(validateSourcePreference(1)).toBe(1)
    expect(validateSourcePreference(-1)).toBe(-1)
  })

  it('validate rejects off-grid or out-of-range values', () => {
    expect(validateSourcePreference(0.3)).toBeNull()
    expect(validateSourcePreference(0.1)).toBeNull()
    expect(validateSourcePreference(1.25)).toBeNull()
    expect(validateSourcePreference(-1.5)).toBeNull()
    expect(validateSourcePreference('0.5' as unknown)).toBeNull()
    expect(validateSourcePreference(null)).toBeNull()
  })

  it('bonus constant is the documented 0.5', () => {
    expect(SOURCE_PREFERENCE_BONUS).toBe(0.5)
  })
})
