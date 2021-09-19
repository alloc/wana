import { useMemo } from 'react'
import { useLayoutEffect } from 'react-layout-effect'
import { emptyArray, Falsy } from '../common'
import { derive, Derived } from '../derive'
import { mountAuto } from '../mountAuto'

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

export function useDerived<T>(
  compute: () => T,
  discard: (memo: T, oldMemo: T | undefined) => boolean,
  deps?: readonly any[]
): Derived<T>

export function useDerived<T>(
  compute: (() => T) | Falsy,
  discard: (memo: T, oldMemo: T | undefined) => boolean,
  deps?: readonly any[]
): Derived<T> | null

export function useDerived<T>(
  compute: (() => T) | Falsy,
  discardOrDeps?:
    | ((memo: T, oldMemo: T | undefined) => boolean)
    | readonly any[],
  deps?: readonly any[]
) {
  let discard: ((memo: T, oldMemo: T | undefined) => boolean) | undefined
  if (typeof discardOrDeps == 'function') {
    discard = discardOrDeps
  } else {
    deps = discardOrDeps
  }

  const [derived, setState] = useMemo(() => {
    if (!compute) {
      return [null, null]
    }
    const derived = derive(auto => {
      const observer = auto.start(compute)
      try {
        var result = compute()
      } finally {
        auto.stop()
      }
      setState({ observer })
      return result
    }, discard)
    const setState = mountAuto(derived.auto)
    return [derived, setState]
  }, deps || emptyArray)

  useLayoutEffect(() => {
    if (setState) {
      setState({ mounted: true })
      return () => setState({ mounted: false })
    }
  }, [setState])

  return derived
}
