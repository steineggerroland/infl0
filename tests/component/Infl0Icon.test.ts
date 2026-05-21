// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import Infl0Icon from '../../components/Infl0Icon.vue'

describe('Infl0Icon', () => {
  it('renders SVG markup for a registry icon', () => {
    const wrapper = mount(Infl0Icon, {
      props: { name: 'episode.play', size: 'lg' },
    })

    expect(wrapper.find('svg').exists()).toBe(true)
    expect(wrapper.element.tagName).not.toBe('INFL0ICON')
    expect(wrapper.attributes('aria-hidden')).toBe('true')
    expect(wrapper.attributes('role')).toBeUndefined()
  })

  it('uses the optional label as the accessible icon name', () => {
    const wrapper = mount(Infl0Icon, {
      props: { name: 'episode.play', label: 'Play episode' },
    })

    expect(wrapper.attributes('role')).toBe('img')
    expect(wrapper.attributes('aria-label')).toBe('Play episode')
    expect(wrapper.attributes('aria-hidden')).toBeUndefined()
  })
})
