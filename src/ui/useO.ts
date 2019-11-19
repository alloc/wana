import is from '@sindresorhus/is'
import { useMemoOne as useMemo } from 'use-memo-one'
import { emptyArray } from '../common'
import { Derived } from '../derive'
import { noto } from '../noto'
import { o } from '../o'
import { useDerived } from './useDerived'

/** Memoize an object and return its observable proxy. Non-objects are returned as-is. */
export function useO<T>(state: Exclude<T, Function>, deps?: readonly any[]): T

/** Create observable component state. */
export function useO<T>(
  create: () => Exclude<T, Function>,
  deps?: readonly any[]
): T

/**
 * Create an observable getter that is managed by React.
 * This lets you memoize an expensive combination of observable values.
 */
export function useO<T>(
  create: () => () => T,
  deps?: readonly any[]
): Derived<T>

/** @internal */
export function useO(state: any, deps?: readonly any[]) {
  const result = useMemo<any>(
    () => (is.function_(state) ? noto(state) : state),
    deps || emptyArray
  )
  // Beware: Never switch between observable getter and observable object.
  return is.function_(result) ? useDerived(result, [result]) : o(result)
}
