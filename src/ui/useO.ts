import { is } from '@alloc/is'
import { useMemoOne as useMemo } from 'use-memo-one'
import { emptyArray } from '../common'
import { Derived, isDerived, WithDerived } from '../derive'
import { noto } from '../noto'
import { o } from '../o'
import { useDerived } from './useDerived'

export function useO<T extends object>(
  state: Exclude<T, Function>,
  deps?: readonly any[]
): WithDerived<T>

/**
 * Create an observable getter that is managed by React.
 * This lets you memoize an expensive combination of observable values.
 */
export function useO<T>(
  create: () => () => T,
  deps?: readonly any[]
): Derived<T>

/** Create observable component state. */
export function useO<T>(
  create: () => Exclude<T, Function>,
  deps?: readonly any[]
): T

/** Memoize an object and return its observable proxy. Non-objects are returned as-is. */
export function useO<T>(state: T, deps?: readonly any[]): T

/** @internal */
export function useO(state: any, deps?: readonly any[]) {
  const result = useMemo<any>(
    () => (convertDerived(is.function(state) ? noto(state) : state)),
    deps || emptyArray
  )
  // Beware: Never switch between observable getter and observable object.
  return is.function(result) ? useDerived(result, [result]) : o(result)
}

// Convert observable getters into property getters.
// This is *not* responsible for disposal.
function convertDerived(state: any) {
  if (is.plainObject(state)) {
    for (const key in state) {
      const desc = Object.getOwnPropertyDescriptor(state, key)!
      if (isDerived(desc.value) && desc.configurable) {
        Object.defineProperty(state, key, {
          get: desc.value,
        })
      }
    }
  }
  return state
}
