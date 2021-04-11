import { render } from '@testing-library/react'
import { flushMicroTasks } from 'flush-microtasks'
import React from 'react'
import { o, useBinding } from '../src'

describe('useBinding', () => {
  it('can observe a whole object', () => {
    const spy = jest.fn(() => null) as Function
    const state = o({ a: 1, b: 2 })

    const Test = () => {
      const { a, b } = useBinding(state)
      return spy(a, b)
    }

    render(<Test />)
    expect(spy).toHaveBeenCalledWith(1, 2)

    state.a = 5
    expect(spy).toHaveBeenCalledWith(5, 2)

    state.b = 5
    expect(spy).toHaveBeenCalledWith(5, 5)
  })

  it('can observe a whole Map', () => {
    const spy = jest.fn((_: any) => null)
    const state = o(new Map([[1, 2]]))

    const Test = () => {
      const entries = Array.from(useBinding(state).entries())
      return spy(entries)
    }

    render(<Test />)
    expect(spy).toBeCalledWith([[1, 2]])

    state.set(3, 3)
    expect(spy).toBeCalledWith([
      [1, 2],
      [3, 3],
    ])

    state.clear()
    expect(spy).toBeCalledWith([])
  })

  it('can observe an object property', () => {
    const spy = jest.fn((_: any) => null)
    const state = o({ a: 1, b: 2 })

    const Test = () => {
      const a = useBinding(state, 'a')
      return spy(a)
    }

    render(<Test />)
    expect(spy).toBeCalledWith(state.a)
    spy.mockClear()

    state.b++
    expect(spy).not.toBeCalled()

    state.a++
    expect(spy).toBeCalledWith(state.a)
  })

  it('can observe a derived getter', async () => {
    const spy = jest.fn((_: any) => null)
    const state = o({ a: 1, b: 2 })
    const getSum = o(() => state.a + state.b)

    const Test = () => {
      const sum = useBinding(getSum)
      return spy(sum)
    }

    render(<Test />)
    expect(spy).toBeCalledWith(3)
    spy.mockClear()

    state.b++
    expect(spy).not.toBeCalled()

    // Derived getters are always batched.
    await flushMicroTasks()
    expect(spy).toBeCalledWith(4)
  })

  it('can observe an array length', () => {
    const spy = jest.fn((_: any) => null)
    const state = o([1])

    const Test = () => {
      const len = useBinding(state, 'length')
      return spy(len)
    }

    render(<Test />)
    expect(spy).toBeCalledWith(1)

    state.push(1)
    expect(spy).toBeCalledWith(2)
  })

  it.todo('can observe a Map entry')
  it.todo('cannot observe a Map size')
  it.todo('can observe a Set size')
})
