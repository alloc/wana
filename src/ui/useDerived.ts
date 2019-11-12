import { useLayoutEffect } from 'react-layout-effect'
import { useMemoOne as useMemo } from 'use-memo-one'
import { Auto, AutoObserver } from '../auto'
import { emptyArray } from '../common'
import { derive } from '../derive'

type State = {
  auto?: Auto
  observer?: AutoObserver
  nonce?: number
  mounted?: boolean
}

/**
 * Create an observable getter that is managed by React.
 * This lets you memoize an expensive combination of observable values.
 */
export function useDerived<T>(compute: () => T, deps = emptyArray) {
  const state = useMemo<State>(() => ({}), deps)
  const derived = useMemo(
    () =>
      derive(auto => {
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
      }),
    deps
  )

  useLayoutEffect(() => {
    const { auto, observer, nonce } = state
    if (auto && !auto.commit(observer!, nonce)) {
      auto.clear()
    }
    state.mounted = true
    return derived.dispose
  }, deps)

  return derived
}
