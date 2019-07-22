import { act, render } from '@testing-library/react'
import * as React from 'react'
import { o, useAuto, withAuto } from '../src'
import { Auto } from '../src/auto'

beforeAll(() => {
  const update = Auto.prototype['_onDelay']
  Auto.prototype['_onDelay'] = function() {
    act(() => void update.call(this))
  }
})

describe('useAuto', () => {
  it('reacts to observable changes', async () => {
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

    state.count++
    state.count++
    await Promise.resolve()
    expect(calls).toEqual([0, 2])
  })
  it('can be used inside a "withAuto" component', async () => {
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

    state.count++
    state.count++
    await Promise.resolve()
    expect(calls).toEqual([0, 2])
  })
})
