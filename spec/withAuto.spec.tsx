import { render } from '@testing-library/react'
import { flushMicroTasks } from 'flush-microtasks'
import React from 'react'
import { Derived, flushSync, o } from '../src/core'
import { withAuto } from 'wana'

describe('withAuto', () => {
  describe('when a parent component reacts to the same observed change', () => {
    const renders: any[] = []
    const expectRenders = (order: any[]) => {
      expect(renders).toEqual(order)
      renders.length = 0
    }

    it('avoids rendering more than once in response', async () => {
      const state = o({ count: 0 })
      const Child = withAuto(() => {
        renders.push(Child)
        return <div>{state.count}</div>
      })
      const Parent = withAuto(() => {
        renders.push(Parent)
        return (
          <div>
            {state.count}
            <Child />
          </div>
        )
      })

      render(<Parent />)
      expectRenders([Parent, Child])

      state.count++
      expectRenders([])

      await flushMicroTasks()
      expectRenders([Parent, Child])
    })

    it('renders itself when memoized', async () => {
      const state = o({ count: 0 })
      const Child = withAuto(() => {
        renders.push(Child)
        return <div>{state.count}</div>
      })
      const child = <Child />
      const Parent = withAuto(() => {
        renders.push(Parent)
        return (
          <div>
            {state.count}
            {child}
          </div>
        )
      })

      render(<Parent />)
      expectRenders([Parent, Child])

      state.count++
      expectRenders([])

      await flushMicroTasks()
      expectRenders([Parent, Child])
    })
  })

  describe('when a chain of derivations is observed', () => {
    let state: { count: number; bonus: number }
    let memo1: Derived<number>
    let memo2: Derived<number>

    beforeEach(() => {
      state = o({ count: 1, bonus: 1 })
      memo1 = o(() => Math.abs(state.count))
      memo2 = o(() => memo1() + state.bonus)
    })

    it('rerenders when a direct dependency is changed', () => {
      const onRender = jest.fn()
      const Test = withAuto(() => {
        onRender(memo2())
        return null
      })

      render(<Test />)
      expect(onRender).toBeCalledWith(2)

      state.bonus++
      flushSync()

      expect(onRender).toBeCalledWith(3)
    })

    it('rerenders when an upstream dependency is changed', () => {
      const onRender = jest.fn()
      const Test = withAuto(() => {
        onRender(memo2())
        return null
      })

      render(<Test />)
      expect(onRender).toBeCalledWith(2)

      state.count++
      flushSync()

      expect(onRender).toBeCalledWith(3)
    })

    it('does not rerender when a memoized dependency is unchanged', () => {
      const onRender = jest.fn()
      const Test = withAuto(() => {
        onRender(memo2())
        return null
      })

      render(<Test />)
      onRender.mockReset()

      // Flip the count, which adds `memo1` to the next batch,
      // but its result will be unchanged.
      state.count = -1
      flushSync()

      expect(onRender).not.toBeCalled()
    })
  })

  describe('when an observed value changes between render and commit', () => {
    it.todo('forces a re-render')
    it.todo('works when observing an entire array')
    it.todo('works when observing the length of an array')
    it.todo('works when observing an entire Set object')
    it.todo('works when observing the size of a Set object')
  })
})
