import { render } from '@testing-library/react'
import { flushMicroTasks } from 'flush-microtasks'
import React from 'react'
import { $O, noto, o, Derived } from 'wana/core'
import { useAuto, useDerived } from 'wana'

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

  it('can be observed', async () => {
    const state = o({ a: 1, b: 1 })
    const spy = jest.fn(() => state.a + state.b)
    const Test = () => {
      const fn = useDerived(spy)
      useAuto(() => {
        expect(fn()).toBe(noto(() => state.a + state.b))
      })
      return null
    }

    render(<Test />)
    expect(spy).toHaveBeenCalledTimes(1)

    state.a = 2
    state.b = 2
    await flushMicroTasks()
    expect(spy).toHaveBeenCalledTimes(2)

    expect.assertions(4)
  })

  it('prevents callers from observing its dependencies', () => {
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
    expect(derived[$O]!.get($O).size).toBe(1)

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

  // Note: In this context, "eager" means "in the next microtask"
  it('eagerly computes its value when observed', async () => {
    const state = o({ a: 1, b: 1 })
    const spy = jest.fn(() => state.a + state.b)

    // In the 1st "useAuto" call, no memoized value will exist,
    // because the first derivation is always lazy.
    let beforeRun = () => expect(spy).toHaveBeenCalledTimes(0)

    const Test = () => {
      const run = useDerived(spy)
      useAuto(() => {
        beforeRun()
        run()
      })
      return null
    }

    render(<Test />)
    expect(spy).toHaveBeenCalledTimes(1)

    state.a = 2
    expect(spy).toHaveBeenCalledTimes(1)

    // In the 2nd "useAuto" call, the memoized value should be
    // updated *before* an explicit "run" call.
    beforeRun = () => expect(spy).toHaveBeenCalledTimes(2)
    await flushMicroTasks()
  })

  // Note: In this context, "lazy" means "when called next"
  it('lazily computes its value when not observed', async () => {
    const state = o({ a: 1, b: 1 })
    const spy = jest.fn(() => state.a + state.b)

    let fn!: () => number
    const Test = () => {
      fn = useDerived(spy)
      return null
    }

    render(<Test />)
    expect(spy).toHaveBeenCalledTimes(0)

    expect(fn()).toBe(2)
    expect(spy).toHaveBeenCalledTimes(1)

    state.a = 2
    expect(spy).toHaveBeenCalledTimes(1)

    await flushMicroTasks()
    expect(spy).toHaveBeenCalledTimes(1)

    expect(fn()).toBe(3)
    expect(spy).toHaveBeenCalledTimes(2)
  })

  it('only tells observers if its memoized value has changed', async () => {
    const state = o({ a: 1, b: 1 })

    let fn: () => number
    const spy = jest.fn(() => void fn())

    const Test = () => {
      fn = useDerived(() => state.a + state.b)
      useAuto(spy)
      return null
    }

    render(<Test />)
    expect(spy).toHaveBeenCalledTimes(1)

    state.a += state.b
    state.b = 0

    await flushMicroTasks()
    expect(spy).toHaveBeenCalledTimes(1)
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
