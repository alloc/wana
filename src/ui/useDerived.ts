import { useLayoutEffect } from 'react-layout-effect'
import { useMemoOne as useMemo } from 'use-memo-one'
import { Auto, AutoObserver } from '../auto'
import { emptyArray, Falsy } from '../common'
import { derive, Derived } from '../derive'

type State = {
  auto?: Auto
  observer?: AutoObserver
  nonce?: number
  mounted?: boolean
}

const getInitialState = (): State => ({})

/**
 * Create an observable getter that is managed by React.
 * This lets you memoize an expensive combination of observable values.
 *
 * If the `compute` argument changes over the course of a component's lifetime,
 * its value should be added to the `deps` array.
 *
 * When `deps` are changed, the derived state is reset. This is useful when
 * the `compute` function is using a variable from another function scope.
 */
export function useDerived<T>(
  compute: () => T,
  deps?: readonly any[]
): Derived<T>

export function useDerived<T>(
  compute: (() => T) | Falsy,
  deps?: readonly any[]
): Derived<T> | null

export function useDerived<T>(compute: (() => T) | Falsy, deps = emptyArray) {
  const state = useMemo(getInitialState, deps)
  const derived = useMemo(
    () =>
      compute
        ? derive(auto => {
            const observer = auto.start(compute)
            try {
              var result = compute()
            } finally {
              auto.stop()
            }
            if (state.mounted) {
              auto.commit(observer)
            } else {
              state.auto = auto
              state.observer = observer
              state.nonce = observer.nonce
            }
            return result
          })
        : null,
    deps
  )

  useLayoutEffect(() => {
    if (derived) {
      const { auto, observer, nonce } = state
      if (auto && !auto.commit(observer!, nonce)) {
        auto.clear()
      }
      state.mounted = true
      return derived.dispose
    }
  }, deps)

  return derived
}
