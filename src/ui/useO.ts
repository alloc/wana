import { useMemoOne as useMemo } from 'use-memo-one'
import { emptyArray, isFunction } from '../common'
import { untracked } from '../global'
import { o } from '../observable'

/** Create observable component state */
export function useO<T>(create: () => T, deps?: readonly any[]): T
export function useO<T>(state: Exclude<T, Function>, deps?: readonly any[]): T
export function useO<T>(
  state: Exclude<T, Function> | (() => T),
  deps?: readonly any[]
): T {
  return useMemo(
    () => o(isFunction(state) ? untracked(state) : state),
    deps || emptyArray
  )
}
