import { render } from '@testing-library/react'
import * as React from 'react'
import { createHook, o } from '../src'

const { useEffect } = React

describe('createHook', () => {
  it('can re-render when an accessed property is changed', async () => {
    const calls: number[] = []
    const state = o({ count: 0 })
    const useState = createHook(state)
    const Test = () => {
      const { count } = useState()
      useEffect(() => {
        calls.push(count)
      })
      return null
    }

    render(<Test />)
    expect(calls).toEqual([0])

    state.count++
    await Promise.resolve()
    expect(calls).toEqual([0, 1])
  })

  it('prevents observation after the commit phase', async () => {
    const calls: number[] = []
    const state = o({ count: 0 })
    const useState = createHook(state)
    const Test = () => {
      const state = useState()
      useEffect(() => {
        // Since "state.count" is only accessed in this effect, nothing is observed.
        calls.push(state.count)
      })
      return null
    }

    render(<Test />)
    expect(calls).toEqual([0])

    state.count++
    await Promise.resolve()
    expect(calls).toEqual([0]) // Nothing changed.
  })
})
