import { flushMicroTasks } from 'flush-microtasks'
import { auto, o, watch, Watcher } from '../src'

let spy: jest.Mock
let root: any
let counts: Map<object, number>
let watcher: Watcher

function withRoot(base: object) {
  if (watcher) watcher.dispose()
  watcher = watch((root = o(base)), (spy = jest.fn()))
  counts = watcher.counts
}

describe('watch()', () => {
  it('observes the root object deeply when created', () => {
    withRoot({
      a: o([o(new Map([[0, o(new Set())]]))]),
    })
    expect(counts.get(root)).toBe(1)
    expect(counts.get(root.a)).toBe(1)
    expect(counts.get(root.a[0])).toBe(1)
    expect(counts.get(root.a[0].get(0))).toBe(1)
    root.b = true
    root.a.push(0)
    root.a[0].set(1, 1)
    root.a[0].get(0).add(1)
    expect(spy.mock.calls).toMatchSnapshot()
  })

  it('observes new objects deeply when added', () => {
    withRoot({ a: o([]), s: o(new Set()), m: o(new Map()) })
    const obj: any = o({})

    root.a.push(obj)
    expect(spy).toBeCalledTimes(1)
    expect(counts.get(obj)).toBe(1)

    root.s.add(obj)
    expect(spy).toBeCalledTimes(2)
    expect(counts.get(obj)).toBe(2)

    root.m.set(obj, obj)
    expect(spy).toBeCalledTimes(3)
    expect(counts.get(obj)).toBe(4)

    root.new = obj
    expect(spy).toBeCalledTimes(4)
    expect(counts.get(obj)).toBe(5)

    obj.a = 1
    expect(spy).toBeCalledTimes(5)
    expect(counts.get(obj)).toBe(5)
  })

  it('only observes the first occurrence', () => {
    withRoot({})
    const obj: any = { a: 0 }

    // The new object is not observable here.
    root.new = obj
    expect(spy).toBeCalledTimes(1)
    obj.a++
    expect(spy).toBeCalledTimes(1)

    // Passing the object to `o()` is not enough.
    o(obj).a++
    expect(spy).toBeCalledTimes(1)

    // Adding the object somewhere new is not enough.
    root.new2 = obj
    expect(spy).toBeCalledTimes(2)
    obj.a++
    expect(spy).toBeCalledTimes(2)
  })

  it('stops observing replaced objects', () => {
    const obj = o({ b: 1 })
    withRoot({ a: obj })

    root.a = null
    expect(spy).toBeCalledTimes(1)
    obj.b++
    expect(spy).toBeCalledTimes(1)
  })

  it('does not leak into observer that triggered the change', async () => {
    const obj = o({ a: 0, b: 0 })

    const watchFn = jest.fn(() => {
      obj.a // Access observable property.
    })
    watch(obj, watchFn)

    let calls = 0
    auto(() => {
      obj.a = obj.b + 1
      calls += 1
    })
    expect(watchFn).toBeCalled()

    // This mutation should not be seen by the AutoObserver.
    obj.a += 1

    await flushMicroTasks()
    expect(calls).toBe(1)
  })

  it.todo('observes object keys in Map objects')

  it.todo('crawls non-observable objects')

  it.todo('survives circular references')

  it.todo('survives duplicate references')
})
