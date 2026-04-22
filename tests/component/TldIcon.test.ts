// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import TldIcon from '../../components/TldIcon.vue'

describe('TldIcon', () => {
  it('sanitizes hyphenated host label initials like NameIcon', () => {
    const w = mount(TldIcon, { props: { tld: 'sam-smith.example' } })
    expect(w.get('[aria-hidden="true"]').text()).toBe('SZ')
  })

  it('sanitizes AH from label segments', () => {
    const w = mount(TldIcon, { props: { tld: 'anna-hansen.example' } })
    expect(w.get('[aria-hidden="true"]').text()).toBe('A0')
  })
})
