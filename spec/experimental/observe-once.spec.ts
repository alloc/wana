import { o, flushSync } from '../../src/core'
import { observeOnce } from './observe-once'

test('observeOnce', () => {
  const state = o({ a: 10, b: 0 })
  const log = jest.fn()
  observeOnce(firstRun => {
    if (firstRun) {
      // Do something computationally expensive whose dependencies
      // should be observed.
      log(state.a)
    } else {
      // Do something when the observed values are changed.
      // Any observable state we use here is *not* observed.
      log(state.b)
    }
  })

  // firstRun equaled true
  expect(log).toBeCalledTimes(1)
  expect(log).toBeCalledWith(10)
  log.mockClear()

  state.a -= 1
  flushSync()

  // state.a was observed
  expect(log).toBeCalledTimes(1)
  expect(log).toBeCalledWith(0)
  log.mockClear()

  state.b += 1
  flushSync()

  // state.b was not observed
  expect(log).not.toBeCalled()
})
