import { useEffect } from 'react'
import { useMemoOne as useMemo } from 'use-memo-one'
import { emptyArray } from '../common'
import { derive } from '../derive'
import { $$ } from '../symbols'
import { useDispose } from './common'

/**
 * Create an observable function that is managed by React.
 * This lets you memoize an expensive combination of observable values.
 */
export function useDerived<T extends any[], U>(
  fn: (...args: T) => U,
  deps?: any[]
) {
  const derived = useMemo(() => derive(fn, true), deps || emptyArray)
  useDispose(derived.dispose)
  useEffect(() => {
    // The first commit is lazy, but the rest are not.
    derived[$$].commit()
    derived[$$].lazy = false
  }, [derived])
  return derived
}
