import { noto, o } from '../src'
import { global } from '../src/global'
import { $$, $O, SIZE } from '../src/symbols'

const observed: any[] = []
afterEach(() => {
  observed.length = 0
})

const track = (effect: () => void) => {
  global.observe = (target, key) => observed.push([target, key])
  effect()
  global.observe = null
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
  it('is a no-op for primitives and functions', () => {
    expect(o(0)).toBe(0)
    expect(o(true)).toBe(true)
    expect(o(null)).toBe(null)
    expect(o(undefined)).toBe(undefined)
    expect(o(o)).toBe(o)
  })
  it('is a no-op for frozen objects', () => {
    const obj = Object.freeze({})
    expect(o(obj)).toBe(obj)
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

describe('noto()', () => {
  it('returns the original object of an observable proxy', () => {
    let orig: any = {}
    expect(noto(o(orig))).toBe(orig)
    orig = []
    expect(noto(o(orig))).toBe(orig)
    orig = new Set()
    expect(noto(o(orig))).toBe(orig)
    orig = new Map()
    expect(noto(o(orig))).toBe(orig)
  })
  it('wraps functions to disable implicit observation for future calls', () => {
    const state = o({ a: 1 })
    const increment = noto(() => ++state.a)
    track(() => {
      expect(increment()).toBe(2)
    })
    expect(observed).toEqual([])
  })
})
