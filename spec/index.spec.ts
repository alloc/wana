import { $$, $O, auto, flushSync, globals, no, o } from 'wana/core'
import { SIZE } from '../src/symbols'

const observed: any[] = []
afterEach(() => {
  observed.length = 0
})

const track = (effect: () => void) => {
  globals.observe = (target, key) => observed.push([target, key])
  effect()
  globals.observe = null
}

const watch = (obj: object) => {
  const spy = jest.fn()
  const observer = { onChange: spy }
  obj[$O].get($O).add(observer)
  obj[$O].get(SIZE).add(observer)
  return spy.mock.calls
}

describe('o()', () => {
  it('never creates more than one proxy per object', () => {
    const obj = {}
    expect(o(obj)).toBe(o(obj))
    expect(o(obj)).not.toBe(obj)
  })

  it('is a no-op for primitives', () => {
    expect(o(0)).toBe(0)
    expect(o(true)).toBe(true)
    expect(o(null)).toBe(null)
    expect(o(undefined)).toBe(undefined)
  })

  it('is a no-op for certain built-in types', () => {
    const date = new Date()
    expect(o(date)).toBe(date)

    const regExp = /./g
    expect(o(regExp)).toBe(regExp)

    const nativePromise = Promise.resolve()
    expect(o(nativePromise)).toBe(nativePromise)

    const generatorFn = function*() {}
    expect(o(generatorFn)).toBe(generatorFn)

    const generator = generatorFn()
    expect(o(generator)).toBe(generator)

    const asyncFn = async () => {}
    expect(o(asyncFn)).toBe(asyncFn)

    const weakMap = new WeakMap()
    expect(o(weakMap)).toBe(weakMap)

    const weakSet = new WeakSet()
    expect(o(weakSet)).toBe(weakSet)
  })

  it('is a no-op for frozen objects', () => {
    const obj = Object.freeze({})
    expect(o(obj)).toBe(obj)
  })

  describe('property getter', () => {
    it('is called with the proxy as its "this" value', () => {
      class Foo {
        get foo() {
          return this
        }
      }
      const foo = o(new Foo())
      expect(foo.foo).toBe(foo)
    })
  })

  describe('property setter', () => {
    it('is called with the proxy as its "this" value', () => {
      class Foo {
        this: any
        get foo() {
          return this
        }
        set foo(out: Foo) {
          out.this = this
        }
      }
      const foo = o(new Foo())
      foo.foo = foo
      expect(foo.this).toBe(foo)
    })
  })
})

describe('o(Object)', () => {
  describe('[[Get]]', () => {
    it('works with no observer', () => {
      const obj: any = o({ a: 1 })
      expect(obj.a).toBe(1)
      expect(obj.b).toBeUndefined()
    })

    it('tracks known keys', () => {
      const obj: any = o({ a: 1 })
      track(() => obj.a)
      expect(observed.length).toBe(1)
      expect(observed[0][0]).toBe(obj[$$])
      expect(observed[0][1]).toBe('a')

      obj.b = 1
      track(() => obj.b)
      expect(observed.length).toBe(2)
      expect(observed[1][0]).toBe(obj[$$])
      expect(observed[1][1]).toBe('b')
    })

    it('tracks unknown keys', () => {
      const obj: any = o({})
      track(() => obj.a)
      expect(observed.length).toBe(1)
      expect(observed[0][0]).toBe(obj[$$])
      expect(observed[0][1]).toBe('a')
    })

    it('ignores inherited keys', () => {
      const obj: any = o({})
      track(() => obj.toString)
      expect(obj.toString).toBeDefined()
      expect(observed).toEqual([])
    })

    describe('own getter', () => {
      it('is called with observable this', () => {
        const obj = o({
          get a() {
            expect(this).toBe(obj)
            return 0
          },
        })
        obj.a // tslint:disable-line
        expect.assertions(1)
      })
    })

    describe('inherited getter', () => {
      it('is called with observable this', () => {
        const obj: any = o({
          __proto__: {
            get a() {
              expect(this).toBe(obj)
              return 0
            },
          },
        })
        obj.a // tslint:disable-line
        expect.assertions(1)
      })
    })
  })

  describe('[[Set]]', () => {
    it('emits for new keys', () => {
      const obj: any = o({})
      const calls = watch(obj)
      obj.a = 1
      expect(calls[0][0].target).toBe(obj[$$])
      expect(calls).toMatchSnapshot()
    })

    it('emits for new values', () => {
      const obj: any = o({ a: 0 })
      const calls = watch(obj)
      obj.a = 1
      expect(calls[0][0].target).toBe(obj[$$])
      expect(calls).toMatchSnapshot()
    })

    it('skips emit for old values', () => {
      const obj: any = o({ a: 1 })
      const calls = watch(obj)
      obj.a = 1
      expect(calls).toEqual([])
    })

    it('throws when a non-writable property is assigned to', () => {
      const obj: any = o({})
      Object.defineProperty(obj, 'a', { value: 1 })
      expect(() => {
        obj.a = 2
      }).toThrowErrorMatchingInlineSnapshot(
        `"Cannot assign to read only property 'a' of object '#<Object>'"`
      )
    })

    it('throws when a getter is assigned to', () => {
      const obj: any = o({})
      Object.defineProperty(obj, 'a', { get: () => 1 })
      expect(() => {
        obj.a = 2
      }).toThrowErrorMatchingInlineSnapshot(
        `"'set' on proxy: trap returned falsish for property 'a'"`
      )
    })

    describe('own setter', () => {
      it('is called with observable this', () => {
        const obj = o({
          get a() {
            return 0
          },
          set a(_val) {
            expect(this).toBe(obj)
          },
        })
        obj.a = 1
        expect.assertions(1)
      })

      it('can be observed', () => {
        const obj = o({
          get a() {
            return 0
          },
          set a(_val) {
            expect(globals.observe).toBeTruthy()
          },
        })
        auto(() => {
          obj.a = 1
        })
        expect.assertions(1)
      })
    })

    describe('inherited setter', () => {
      it('is called with observable this', () => {
        const obj: any = o({
          __proto__: {
            get a() {
              return 0
            },
            set a(_val) {
              expect(this).toBe(obj)
            },
          },
        })
        obj.a = 1
        expect.assertions(1)
      })

      it('can be observed', () => {
        const obj: any = o({
          __proto__: {
            get a() {
              return 0
            },
            set a(_val) {
              expect(globals.observe).toBeTruthy()
            },
          },
        })
        auto(() => {
          obj.a = 1
        })
        expect.assertions(1)
      })
    })
  })

  describe('[[Delete]]', () => {
    it('emits for known keys', () => {
      const obj: any = o({ a: 1 })
      const calls = watch(obj)
      delete obj.a
      expect(calls[0][0].target).toBe(obj[$$])
      expect(calls).toMatchSnapshot()
    })

    it('skips emit for unknown keys', () => {
      const obj: any = o({})
      const calls = watch(obj)
      delete obj.a
      expect(calls).toEqual([])
    })
  })

  describe('"in" operator', () => {
    it.todo('tracks known keys')
    it.todo('tracks unknown keys')
    it.todo('tracks inherited keys')
  })

  describe('[[DefineOwnProperty]]', () => {
    it('emits for new property', () => {
      const obj: any = o({})
      const calls = watch(obj)

      // 1. Define with "get" descriptor
      Object.defineProperty(obj, 'a', {
        get: () => 1,
      })

      // 2. Define with "value" descriptor
      Object.defineProperty(obj, 'b', {
        value: 2,
      })

      expect(calls).toMatchSnapshot()
    })

    it('emits for redefined property', () => {
      const obj = o({
        get a() {
          return 1
        },
      })
      const calls = watch(obj)

      // 1. Redefine with "get" descriptor
      Object.defineProperty(obj, 'a', {
        get: () => 2,
      })

      // 2. Redefine with "value" descriptor
      Object.defineProperty(obj, 'a', {
        value: 3,
        writable: true,
      })

      // 3. Redefine with "value" descriptor (again)
      Object.defineProperty(obj, 'a', {
        value: 4,
      })

      expect(calls).toMatchSnapshot()
    })
  })
})

describe('o(Array)', () => {
  it('works with Array.isArray', () => {
    const arr = o([])
    expect(Array.isArray(arr)).toBeTruthy()
  })

  describe('[[Get]]', () => {
    it('ignores known indices', () => {
      const arr = o([0])
      track(() => arr[0])
      expect(observed).toEqual([])

      arr[2] = 2
      track(() => arr[2])
      expect(observed).toEqual([])
    })

    it('ignores unknown indices', () => {
      const arr = o([])
      track(() => arr[0])
      expect(observed).toEqual([])
    })
  })

  describe('[[Set]]', () => {
    it('emits for new indices', () => {
      const arr: any[] = o([])
      const calls = watch(arr)
      arr[1] = 1
      expect(calls[0][0].target).toBe(arr[$$])
      expect(calls).toMatchSnapshot()
    })

    it('emits for new values', () => {
      const arr: any[] = o([0])
      const calls = watch(arr)
      arr[0] = 1
      expect(calls[0][0].target).toBe(arr[$$])
      expect(calls).toMatchSnapshot()
    })

    it('skips emit for old values', () => {
      const arr: any[] = o([1])
      const calls = watch(arr)
      arr[0] = 1
      expect(calls).toEqual([])
    })
  })

  describe('.length', () => {
    it('can be tracked', () => {
      const arr = o([])
      track(() => arr.length)
      expect(observed.length).toBe(1)
      expect(observed[0][0]).toBe(arr[$$])
      expect(observed[0][1]).toBe(SIZE)
    })

    it('emits when set directly', () => {
      const arr = o([])
      const calls = watch(arr)
      // No "splice" event is emitted when increasing length like this,
      // because all of the indices are holes:
      arr.length = 3
      expect(calls.length).toBe(1)
      // Emit a "splice" event here, even if all of the truncated indices
      // are holes, since checking for holes isn't worth the extra logic:
      arr.length = 0
      expect(calls[0][0].target).toBe(arr[$$])
      expect(calls).toMatchSnapshot()
    })

    it('skips emit when set to same length', () => {
      const arr = o([1])
      const calls = watch(arr)
      arr.length = 1
      expect(calls).toEqual([])
    })
  })

  describe('.splice()', () => {
    describe('removal', () => {
      it('can splice the start', () => {
        const arr = o([1, 2, 3])
        const calls = watch(arr)
        arr.splice(0, 2)
        expect(calls).toMatchSnapshot()
      })

      it('can splice the middle', () => {
        const arr = o([1, 2, 3, 4])
        const calls = watch(arr)
        arr.splice(1, 2)
        expect(calls).toMatchSnapshot()
      })

      it('can splice the end', () => {
        const arr = o([1, 2, 3])
        const calls = watch(arr)
        arr.splice(1, 2)
        expect(calls).toMatchSnapshot()
      })
    })

    describe('insertion', () => {
      it('can insert at the start', () => {
        const arr = o([1])
        const calls = watch(arr)
        arr.splice(0, 0, 3, 2)
        expect(calls).toMatchSnapshot()
      })

      it('can insert into the middle', () => {
        const arr = o([1, 2])
        const calls = watch(arr)
        arr.splice(1, 0, 0, 0)
        expect(calls).toMatchSnapshot()
      })

      it('can insert at the end', () => {
        const arr = o([1])
        const calls = watch(arr)
        arr.splice(1, 0, 2, 3)
        expect(calls).toMatchSnapshot()
      })
    })

    describe('remove count', () => {
      it('removes nothing when zero or less', () => {
        const arr = o([1, 2])
        const calls = watch(arr)
        arr.splice(0, 0)
        arr.splice(1, -1)
        expect(calls).toEqual([])
      })

      it('can exceed the last index', () => {
        const arr = o([1, 2])
        const calls = watch(arr)
        arr.splice(1, 3)
        expect(calls).toMatchSnapshot()
      })
    })

    describe('negative start index', () => {
      it('starts from the end', () => {
        const arr = o([1, 2, 3])
        const calls = watch(arr)
        arr.splice(-2, 1)
        expect(calls).toMatchSnapshot()
      })

      it('stops at zero', () => {
        const arr = o([1, 2])
        const calls = watch(arr)
        arr.splice(-100, 1)
        expect(calls).toMatchSnapshot()
      })
    })

    it('can insert and remove at the same time', () => {
      const arr = o([1, 2, 3])
      const calls = watch(arr)
      // more insertions
      arr.splice(1, 1, 0, 0)
      expect(calls).toMatchSnapshot()
      calls.length = 0
      // more removals
      arr.splice(1, 2, 3)
      expect(calls).toMatchSnapshot()
      calls.length = 0
      // equal amounts
      arr.splice(1, 1, 0)
      expect(calls).toMatchSnapshot()
    })

    // To avoid extra logic for rare edge cases:
    it('emits even if values did not change', () => {
      const arr = o([1, 2, 3])
      const calls = watch(arr)
      arr.splice(0, arr.length, ...arr)
      expect(calls).toMatchSnapshot()
    })
  })

  describe('.push()', () => {
    it.todo('emits any changes')
    it.todo('skips emit when nothing is added')
  })

  describe('.unshift()', () => {
    it.todo('emits any changes')
    it.todo('skips emit when nothing is added')
  })

  describe('.shift()', () => {
    it.todo('emits any changes')
    it.todo('skips emit if empty')
  })

  describe('.pop()', () => {
    it.todo('emits any changes')
    it.todo('skips emit if empty')
  })

  describe('.reverse()', () => {
    it.todo('emits any changes')
    // To avoid extra logic for rare edge cases:
    it.todo('emits even if nothing changes')
  })

  describe('.sort()', () => {
    it.todo('emits any changes')
    // To avoid extra logic for rare edge cases:
    it.todo('emits even if nothing changes')
  })
})

describe('o(Set)', () => {
  describe('.has()', () => {
    it.todo('observes the entire set')
  })

  describe('.add()', () => {
    it('emits for new values', () => {
      const set = o(new Set())
      const calls = watch(set)
      set.add(1)
      expect(calls[0][0].target).toBe(set[$$])
      expect(calls).toMatchSnapshot()
    })

    it('skips emit for old values', () => {
      const set = o(new Set([1]))
      const calls = watch(set)
      set.add(1)
      expect(calls).toEqual([])
    })
  })

  describe('.delete()', () => {
    it('emits for known values', () => {
      const set = o(new Set([1]))
      const calls = watch(set)
      set.delete(1)
      expect(calls[0][0].target).toBe(set[$$])
      expect(calls).toMatchSnapshot()
    })

    it('skips emit for unknown values', () => {
      const set = o(new Set())
      const calls = watch(set)
      set.delete(1)
      expect(calls).toEqual([])
    })
  })

  describe('.clear()', () => {
    it('emits only when not empty', () => {
      const set = o(new Set())
      const calls = watch(set)
      set.clear()
      expect(calls).toEqual([])
      set.add(1).add(2)
      calls.length = 0
      set.clear()
      expect(calls).toMatchSnapshot()
    })
  })
})

describe('o(Map)', () => {
  describe('.has()', () => {
    it.todo('works with no observer')
    it.todo('tracks known keys')
    it.todo('tracks unknown keys')
  })

  describe('.get()', () => {
    it.todo('works with no observer')
    it.todo('tracks known keys')
    it.todo('tracks unknown keys')
  })

  describe('.set()', () => {
    it.todo('emits for known keys')
    it.todo('emits for unknown keys')
    it.todo('skips emit if unchanged')
  })

  describe('.delete()', () => {
    it.todo('emits for known keys')
    it.todo('skips emit for unknown keys')
  })

  describe('.clear()', () => {
    it.todo('emits only when not empty')
  })
})

// Note: See "useDerived.spec.tsx" for more tests.
describe('o(Function)', () => {
  it.todo('returns an observable getter')
  it.todo('avoids wrapping an already observable getter')

  it('can be observed by an "auto" call', () => {
    const state = o({ count: 1 })

    const get = jest.fn(() => Math.abs(state.count) * 2)
    const memo = o(get)

    const effect = jest.fn(() => memo())
    const reaction = auto(effect)
    const onDirty = (reaction.onDirty = jest.fn(
      reaction.onDirty.bind(reaction)
    ))

    const expectedCalls = new Map<any, number>()
    const expectCalls = (fn: jest.Mock, count: number) => {
      let sum = expectedCalls.get(fn)
      if (sum == null) sum = 0
      expect(fn).toBeCalledTimes((sum += count))
      expectedCalls.set(fn, sum)
    }

    // The effect is run immediately.
    expectCalls(effect, 1)

    // Initialize the `memo` value.
    expect(memo()).toBe(2)
    expectCalls(get, 1)

    // Flip the count, so its value is changed,
    // but the `memo` value stays the same.
    state.count = -1

    // No reaction should happen yet.
    expectCalls(effect, 0)
    // ...but it should have been batched.
    expectCalls(onDirty, 1)

    // Synchronous derivation should still work.
    expect(memo()).toBe(2)
    expectCalls(get, 1)

    // Flush the batch and no reaction should occur,
    // because the `memo` value is unchanged.
    flushSync()
    expectCalls(effect, 0)

    // Ensure the `memo` value will be different.
    state.count = 2

    // The reaction should not be synchronous.
    expectCalls(effect, 0)
    // ...but it should have been batched.
    expectCalls(onDirty, 1)

    // Synchronous derivation should still work.
    expect(memo()).toBe(4)
    expectCalls(get, 1)

    // The reaction should happen when flushing the batch,
    // because the `memo` value has changed.
    flushSync()
    expectCalls(effect, 1)
  })

  it('can be observed by a sync "auto" call', () => {
    const state = o({ count: 1 })

    const get = jest.fn(() => Math.abs(state.count) * 2)
    const memo = o(get)

    const effect = jest.fn()
    auto(() => effect(memo()), { sync: true })

    expect(effect).toBeCalledWith(2)
    effect.mockReset()

    state.count++
    expect(effect).toBeCalledWith(4)
    effect.mockReset()

    // This calls into `get`, but `memo` stays the same.
    state.count = -state.count
    expect(effect).not.toBeCalled()
  })

  describe('observing another observable getter', () => {
    it('can rerun synchronously if needed', () => {
      const state = o({ count: 1 })

      const dub = jest.fn(() => state.count * 2)
      const dubMemo = o(dub)

      const quad = jest.fn(() => dubMemo() * 2)
      const quadMemo = o(quad)

      // First run
      expect(quadMemo()).toBe(4)

      // Change a dependency
      state.count += 1

      // The affected getter is not called immediately
      expect(dub).toBeCalledTimes(1)

      // Synchronous rerun
      expect(quadMemo()).toBe(8)
      expect(dub).toBeCalledTimes(2)
    })
  })
})

describe('no()', () => {
  it('returns the original object of an observable proxy', () => {
    let orig: any = {}
    expect(no(o(orig))).toBe(orig)
    orig = []
    expect(no(o(orig))).toBe(orig)
    orig = new Set()
    expect(no(o(orig))).toBe(orig)
    orig = new Map()
    expect(no(o(orig))).toBe(orig)
  })

  it('wraps functions to disable implicit observation for future calls', () => {
    const state = o({ a: 1 })
    const increment = no(() => ++state.a)
    track(() => {
      expect(increment()).toBe(2)
    })
    expect(observed).toEqual([])
  })
})
