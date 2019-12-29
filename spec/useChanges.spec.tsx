import { render } from '@testing-library/react'
import React from 'react'
import { $O, Change, o, useChanges } from '../src'

describe('useChanges', () => {
  it('lets you observe Change events for an observable object', () => {
    const spy = jest.fn()
    const state = o({ count: 0 })
    const Test = () => {
      useChanges(state, spy)
      return null
    }

    render(<Test />)

    state.count++ // Replace
    delete state.count // Remove
    state.count = 0 // Add

    expect(spy.mock.calls).toMatchSnapshot()
  })

  it('uses the callback from the last render by default', () => {
    const state = o({ count: 0 })
    const Test = (props: { onChange: (change: Change) => void }) => {
      useChanges(state, props.onChange)
      return null
    }

    const spy1 = jest.fn()
    const elem = render(<Test onChange={spy1} />)

    const spy2 = jest.fn()
    elem.rerender(<Test onChange={spy2} />)

    state.count++
    expect(spy1).not.toHaveBeenCalled()
    expect(spy2).toHaveBeenCalled()
  })

  it('has a deps argument for conditionally replacing the callback', () => {
    const state = o({ count: 0 })
    const Test = (props: { onChange: (change: Change) => void }) => {
      useChanges(state, props.onChange, [])
      return null
    }

    const spy1 = jest.fn()
    const elem = render(<Test onChange={spy1} />)

    const spy2 = jest.fn()
    elem.rerender(<Test onChange={spy2} />)

    state.count++
    expect(spy1).toHaveBeenCalled()
    expect(spy2).not.toHaveBeenCalled()
  })

  it('stops observing on dismount', () => {
    const state = o({ count: 0 })
    const Test = () => {
      useChanges(state, () => {})
      return null
    }

    expect(state[$O].get($O).size).toBe(0)
    const elem = render(<Test />)
    expect(state[$O].get($O).size).toBe(1)
    elem.unmount()
    expect(state[$O].get($O).size).toBe(0)
  })

  it.todo('works with arrays')

  it.todo('works with Set objects')

  it.todo('works with Map objects')
})
