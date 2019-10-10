import { render } from '@testing-library/react'
import * as React from 'react'
import { $O, o, useAuto, useDerived } from '../src'
import { Derived } from '../src/derive'

describe('useDerived', () => {
  it('memoizes the result until an observed value changes', () => {
    const state = o({ a: 1, b: 1 })
    const spy = jest.fn(() => state.a + state.b)
    const Test = () => {
      const fn = useDerived(spy)
      expect(fn()).toBe(state.a + state.b)
      return null
    }

    const elem = render(<Test />)
    expect(spy).toHaveBeenCalledTimes(1)

    elem.rerender(<Test />)
    expect(spy).toHaveBeenCalledTimes(1)

    state.a = 2
    elem.rerender(<Test />)
    expect(spy).toHaveBeenCalledTimes(2)
  })
  it('can be called outside the render phase', () => {
    const state = o({ a: 1, b: 1 })
    const spy = jest.fn(() => state.a + state.b)
    const Test = () => {
      const fn = useDerived(spy)
      React.useEffect(() => {
        expect(fn()).toBe(state.a + state.b)
      })
      return null
    }

    const elem = render(<Test />)
    expect(spy).toHaveBeenCalledTimes(1)

    elem.rerender(<Test />)
    expect(spy).toHaveBeenCalledTimes(1)

    state.a = 2
    elem.rerender(<Test />)
    expect(spy).toHaveBeenCalledTimes(2)

    expect.assertions(6)
  })
  it('lets you observe its memoization', async () => {
    const state = o({ a: 1, b: 1 })
    const spy = jest.fn(() => state.a + state.b)
    const Test = () => {
      const fn = useDerived(spy)
      useAuto(() => {
        expect(fn()).toBe(state.a + state.b)
      })
      return null
    }

    render(<Test />)
    expect(spy).toHaveBeenCalledTimes(1)

    state.a = 2
    state.b = 2
    await Promise.resolve()
    expect(spy).toHaveBeenCalledTimes(2)

    expect.assertions(4)
  })
  it('does not let you observe its computation', () => {
    const state = o({ a: 1, b: 1 })
    const spy = jest.fn(() => state.a + state.b)

    let derived!: Derived<number>
    const Test = () => {
      derived = useDerived(spy)
      useAuto(() => void derived())
      return null
    }

    render(<Test />)

    // The "derived" is observed by "useAuto"
    expect(derived[$O].get($O).size).toBe(1)

    // The "state" is observed by "derived"
    expect(state[$O].get('a').size).toBe(1)
    expect(state[$O].get('b').size).toBe(1)
  })
  it('has a deps argument for using props in the computation', () => {
    let prevN: number | undefined
    let prevFn: Function | undefined
    const state = o({ a: 1 })
    const Test = ({ n }: { n: number }) => {
      const fn = useDerived(() => n + state.a, [n])
      expect(fn()).toBe(n + state.a)
      if (n !== prevN) {
        expect(fn).not.toBe(prevFn)
        prevN = n
        prevFn = fn
      } else {
        expect(fn).toBe(prevFn)
      }
      return null
    }

    const elem = render(<Test n={1} />)
    elem.rerender(<Test n={1} />)
    elem.rerender(<Test n={2} />)

    expect.assertions(6)
  })
  it.todo('avoids subscribing to observed values until commit phase')
  it('stops observing on dismount', () => {
    const state = o({ a: 1 })
    const Test = () => {
      useDerived(() => state.a + 1)()
      return null
    }

    expect(state[$O].get('a').size).toBe(0)
    const elem = render(<Test />)
    expect(state[$O].get('a').size).toBe(1)
    elem.unmount()
    expect(state[$O].get('a').size).toBe(0)
  })
})
