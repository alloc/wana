import { auto, o, when } from 'wana'

// Sleep for `n` microtask queue flushes.
const sleep = (n = 1) => {
  let p: Promise<void> | undefined
  while (n--) p = p ? p.then(() => {}) : Promise.resolve()
  return p
}

describe('when()', () => {
  describe('first run', () => {
    it('remains pending when the condition is false', async () => {
      const state = o({ flag: false })
      const promise = when(() => state.flag)

      const resolve = jest.fn()
      promise.then(resolve, resolve)

      await sleep(2)
      expect(resolve).not.toBeCalled()
    })

    it('fulfills its promise when the condition is true', async () => {
      const state = o({ flag: true })
      const promise = when(() => state.flag)

      const fulfill = jest.fn()
      promise.then(fulfill)

      await sleep(2)
      expect(fulfill).toBeCalled()
    })

    it('rejects its promise when the condition throws', async () => {
      const promise = when(() => {
        throw Error('test')
      })

      const reject = jest.fn()
      promise.catch(reject)

      await sleep(2)
      expect(reject).toBeCalled()
    })
  })

  describe('after an observable change', () => {
    it('remains pending when the condition returns false', async () => {
      const state = o({ count: 0 })
      const promise = when(() => state.count == 2)

      const resolve = jest.fn()
      promise.then(resolve, resolve)
      await sleep(2)

      state.count = 1
      await sleep(2)
      expect(resolve).not.toBeCalled()
    })

    it('fulfills its promise when the condition returns true', async () => {
      const state = o({ count: 0 })
      const promise = when(() => state.count == 1)

      const fulfill = jest.fn()
      promise.then(fulfill)
      await sleep(2)

      state.count = 1
      await sleep(2)
      expect(fulfill).toBeCalled()
    })

    it('rejects its promise when the condition throws', async () => {
      const state = o({ count: 0 })
      const promise = when(() => {
        if (state.count > 0) {
          throw Error('test')
        }
        return false
      })

      const reject = jest.fn()
      promise.catch(reject)
      await sleep(2)

      state.count = 1
      await sleep(2)
      expect(reject).toBeCalled()
    })
  })

  describe('resolved promise', () => {
    it.todo('stops observing every value')
  })

  describe('rejected promise', () => {
    it.todo('stops observing every value')
  })

  describe('reaction to change made by an observer', () => {
    it('does not throw', () => {
      const a = o({ b: 0 })
      expect(() => {
        when(() => a.b > 0)
        auto(() => a.b++)
      }).not.toThrow()
    })
  })
})
