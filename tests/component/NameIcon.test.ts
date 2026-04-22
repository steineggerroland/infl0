// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import NameIcon from '../../components/NameIcon.vue'

describe('NameIcon', () => {
  it('renders neutral initials for ordinary names', () => {
    const w = mount(NameIcon, { props: { name: 'Maria Kowalski' } })
    expect(w.get('[aria-hidden="true"]').text()).toBe('MK')
  })

  it('does not show SS as a two-letter badge (sanitized initials)', () => {
    const w = mount(NameIcon, { props: { name: 'Sam Smith' } })
    expect(w.get('[aria-hidden="true"]').text()).toBe('SZ')
  })

  it('does not show AH as a two-letter badge', () => {
    const w = mount(NameIcon, { props: { name: 'Anna Hansen' } })
    // A from Anna, H from Hansen → AH
    expect(w.get('[aria-hidden="true"]').text()).toBe('A0')
  })
})
