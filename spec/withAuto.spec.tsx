import { render } from '@testing-library/react'
import { flushMicroTasks } from 'flush-microtasks'
import React from 'react'
import { o, withAuto } from '../src'

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
    it.todo('waits until the chain is finished updating')
    it.todo('skips updating when the chain stops early')
  })

  describe('when an observed value changes between render and commit', () => {
    it.todo('forces a re-render')
    it.todo('works when observing an entire array')
    it.todo('works when observing the length of an array')
    it.todo('works when observing an entire Set object')
    it.todo('works when observing the size of a Set object')
  })
})
