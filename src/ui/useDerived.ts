import { useEffect } from 'react'
import { useMemoOne as useMemo } from 'use-memo-one'
import { Auto } from '../auto'
import { emptyArray } from '../common'
import { derive } from '../derive'
import { useDispose } from './common'

/**
 * Create an observable getter that is managed by React.
 * This lets you memoize an expensive combination of observable values.
 */
export function useDerived<T>(fn: () => T, deps?: readonly any[]) {
  const derived = useMemo(() => derive(fn, true), deps || emptyArray)
  useDispose(derived.dispose)
  useEffect(() => {
    const auto: Auto = derived['_auto']
    // The first commit is lazy, but the rest are not.
    auto.commit()
    auto.lazy = false
  }, [derived])
  return derived
}
