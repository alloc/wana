import { render } from '@testing-library/react'
import React from 'react'
import { o, useEffects } from '../src'

describe('useEffects', () => {
  describe('with array', () => {
    it('mounts an effect for each value', () => {
      testMount(o([1, 2]), [[1], [2]])
    })
    it('mounts an effect for added value', () => {
      testAdded(o([0]), [
        arr => (arr.push(1, 2), [[1], [2]]),
        arr => ((arr[10] = 3), [[3]]),
      ])
    })
    it('unmounts the effect for removed value', () => {
      testRemoved(o([1, 2, 3, 4]), [
        arr => (arr.pop(), [[4]]),
        arr => (arr.shift(), [[1]]),
        arr => (delete arr[0], [[2]]),
      ])
    })
    it('unmounts all effects when component unmounts', () => {
      testUnmount(o([1, 2]), [[1], [2]])
    })
    it('checks for duplicate values', () => {
      const arr = o([1, 1])
      testMount(arr, [[1]])
      testAdded(arr, [() => (arr.push(1), [])])
      testRemoved(arr, [() => (arr.pop(), [])])
      testUnmount(arr, [[1]])
    })
    it('handles splice events', () => {
      const arr = o([1, 2, 3, 4])
      const unmount = jest.fn()
      const mount = jest.fn((...args: any[]) => () => unmount(...args))
      const Test = () => {
        useEffects(arr, mount)
        return null
      }
      render(<Test />)
      mount.mockReset()
      arr.splice(1, 2, 0)
      expect(unmount.mock.calls).toEqual([[2], [3]])
      expect(mount.mock.calls).toEqual([[0]])
    })
  })

  describe('with Set object', () => {
    it('mounts an effect for each value', () => {
      const set = o(new Set([1, 2]))
      testMount(set, [[1], [2]])
    })
    it('mounts an effect for added value', () => {
      const set = o(new Set([1, 2]))
      testAdded(set, [
        () => (set.add(3), [[3]]), //
        () => (set.add(3), []),
      ])
    })
    it('unmounts the effect for removed value', () => {
      const set = o(new Set([1, 2, 3]))
      testRemoved(set, [
        () => (set.delete(2), [[2]]),
        () => (set.delete(2), []),
        () => (set.clear(), [[1], [3]]),
      ])
    })
    it('unmounts all effects when component unmounts', () => {
      const set = o(new Set([1, 2]))
      testUnmount(set, [[1], [2]])
    })
  })

  describe('with Map object', () => {
    it('mounts an effect for each key', () => {
      const map = o(
        new Map([
          [1, 0],
          [2, 0],
        ])
      )
      testMount(map, [
        [0, 1],
        [0, 2],
      ])
    })
    it('mounts an effect for added key', () => {
      const map = o(new Map())
      testAdded(map, [
        () => (map.set(1, 0), [[0, 1]]), // added key
        () => (map.set(1, 1), [[1, 1]]), // changed value
        () => (map.set(1, 1), []), // unchanged value
      ])
    })
    it('unmounts the effect for removed key', () => {
      const map = o(
        new Map([
          [1, 0],
          [2, 0],
          [3, 0],
        ])
      )
      testRemoved(map, [
        () => (map.set(1, 1), [[0, 1]]), // changed value
        () => (map.delete(1), [[1, 1]]), // removed key
        () => (map.delete(1), []), // unchanged key
        () => (
          map.clear(),
          [
            [0, 2],
            [0, 3],
          ]
        ),
      ])
    })
    it('unmounts all effects when component unmounts', () => {
      const map = o(
        new Map([
          [1, 0],
          [2, 0],
        ])
      )
      testUnmount(map, [
        [0, 1],
        [0, 2],
      ])
    })
  })

  describe('with plain object', () => {
    it('mounts an effect for each key', () => {
      const obj = o({ a: 1, b: 2 })
      testMount(obj, [
        [1, 'a'],
        [2, 'b'],
      ])
    })
    it('mounts an effect for added key', () => {
      const obj = o<any>({})
      testAdded(obj, [
        () => ((obj.a = 0), [[0, 'a']]), // added key
        () => ((obj.a = 1), [[1, 'a']]), // changed value
        () => ((obj.a = 1), []), // unchanged value
      ])
    })
    it('unmounts the effect for removed key', () => {
      const obj = o({ a: 0 })
      testRemoved(obj, [
        () => ((obj.a = 1), [[0, 'a']]), // changed value
        () => (delete obj.a, [[1, 'a']]), // removed key
        () => (delete obj.a, []), // unchanged key
      ])
    })
    it('unmounts all effects when component unmounts', () => {
      const obj = o({ a: 1, b: 2 })
      testUnmount(obj, [
        [1, 'a'],
        [2, 'b'],
      ])
    })
  })
})

type Source<T = any> =
  | { [key: string]: T }
  | ReadonlyArray<T>
  | ReadonlySet<T>
  | ReadonlyMap<any, T>

function testMount(values: Source, calls: any[][]) {
  const mount = jest.fn()
  const Test = () => {
    useEffects(values, mount)
    return null
  }
  render(<Test />)
  expect(mount.mock.calls).toEqual(calls)
}

function testAdded<T extends Source>(
  values: T,
  mutations: Array<(values: T) => any[][]>
) {
  const mount = jest.fn()
  const Test = () => {
    useEffects(values, mount as any)
    return null
  }
  render(<Test />)
  mutations.forEach(mutate => {
    mount.mockReset()
    const calls = mutate(values)
    expect(mount.mock.calls).toEqual(calls)
  })
}

function testRemoved<T extends Source>(
  values: T,
  mutations: Array<(values: T) => any[][]>
) {
  const unmount = jest.fn()
  const Test = () => {
    useEffects(values, ((...args: any[]) => () => unmount(...args)) as any)
    return null
  }
  render(<Test />)
  mutations.forEach(mutate => {
    unmount.mockReset()
    const calls = mutate(values)
    expect(unmount.mock.calls).toEqual(calls)
  })
}

function testUnmount(values: Source, calls: any[][]) {
  const unmount = jest.fn()
  const Test = () => {
    useEffects(values, ((...args: any[]) => () => unmount(...args)) as any)
    return null
  }

  const elem = render(<Test />)
  expect(unmount).not.toBeCalled()

  elem.unmount()
  expect(unmount.mock.calls).toEqual(calls)
}
