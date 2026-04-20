import { describe, expect, it } from 'vitest'
import {
    TIMELINE_SHOW_READ_STORAGE_KEY,
    parseStoredShowRead,
    serializeShowRead,
} from '../../utils/timeline-preferences'

describe('timeline preferences storage helpers', () => {
    describe('parseStoredShowRead', () => {
        it('treats "1" as true', () => {
            expect(parseStoredShowRead('1')).toBe(true)
        })

        it('treats "0" as false', () => {
            expect(parseStoredShowRead('0')).toBe(false)
        })

        it('returns null for anything else so callers can keep the default', () => {
            expect(parseStoredShowRead(null)).toBeNull()
            expect(parseStoredShowRead('')).toBeNull()
            expect(parseStoredShowRead('true')).toBeNull()
            expect(parseStoredShowRead('false')).toBeNull()
        })
    })

    describe('serializeShowRead', () => {
        it('is the inverse of parseStoredShowRead', () => {
            expect(parseStoredShowRead(serializeShowRead(true))).toBe(true)
            expect(parseStoredShowRead(serializeShowRead(false))).toBe(false)
        })
    })

    it('exposes a single, stable storage key', () => {
        expect(TIMELINE_SHOW_READ_STORAGE_KEY).toBe('infl0.timeline.showRead')
    })
})
