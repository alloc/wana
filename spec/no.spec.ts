import { no, o } from '../src'
import { globals } from '../src/globals'

describe('no()', () => {
  it('returns the original object when given an observable proxy', () => {
    const obj = {}
    const proxy = o(obj)
    expect(proxy).not.toBe(obj)
    expect(no(proxy)).toBe(obj)
  })

  it('returns a wrapped function when given a function', () => {
    const obj = o({ a: 1 })
    const fn = jest.fn((inc = 0) => inc + obj.a)
    const wrap = no(fn)
    const observe = (globals.observe = jest.fn())
    expect(wrap(1)).toBe(2)
    expect(observe).not.toHaveBeenCalled()
    expect(fn).toHaveBeenCalled()
    fn()
    expect(observe).toHaveBeenCalled()
  })

  it('returns the argument as-is when not observable', () => {
    expect(no(1)).toBe(1)
  })
})
