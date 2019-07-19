import { act, render } from '@testing-library/react'
import * as React from 'react'
import { o, useAuto, withAuto } from '../src'

describe('useAuto', () => {
  it('reacts to observable changes', () => {
    const calls = []
    const state = o({ count: 0 })
    const Test = () => {
      useAuto(() => {
        calls.push(state.count)
      })
      return null
    }
    render(<Test />)
    expect(calls).toEqual([0])
    for (let i = 0; i < 999; i++) {
      state.count++
    }
    expect(calls.length).toBe(1000)
  })
  it('can be used inside a "withAuto" component', () => {
    const calls = []
    const state = o({ count: 0 })
    const Test = withAuto(() => {
      useAuto(() => {
        calls.push(state.count)
      })
      return <div>{state.count}</div>
    })
    render(<Test />)
    expect(calls).toEqual([0])
    for (let i = 0; i < 999; i++) {
      act(() => {
        state.count++
      })
    }
    expect(calls.length).toBe(1000)
  })
})
