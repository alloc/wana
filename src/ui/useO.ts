import { useEffect } from 'react'
import { useMemoOne as useMemo } from 'use-memo-one'
import { emptyArray, isFunction } from '../common'
import { derive, Derived } from '../derive'
import { untracked } from '../global'
import { o } from '../o'
import { $$ } from '../symbols'
import { useDispose } from './common'

/** Create a derived function that is managed by React. */
export function useO<T extends any[], U>(
  create: () => (...args: T) => U,
  deps?: readonly any[]
): Derived<T, U>

/** Create observable component state. */
export function useO<T>(
  create: () => Exclude<T, Function>,
  deps?: readonly any[]
): T

/** Memoize an object and return its observable proxy. Non-objects are returned as-is. */
export function useO<T>(state: Exclude<T, Function>, deps?: readonly any[]): T

/** @internal */
export function useO(state: any, deps?: readonly any[]) {
  let result = useMemo<any>(
    () => (isFunction(state) ? untracked(state) : state),
    deps || emptyArray
  )
  if (isFunction(result)) {
    result = useMemo(() => {
      const derived = derive(result)
      derived[$$].lazy = true
      return derived
    }, [result])
    useDispose(result.dispose)
    useEffect(() => {
      result[$$].commit()
    })
  }
  return o(result)
}
