import { is } from '@alloc/is'
import { useMemo, useRef } from 'react'
import { useLayoutEffect } from 'react-layout-effect'
import { noop } from '../common'
import { no } from '../no'
import { Change } from '../observable'
import { SIZE } from '../symbols'
import { useChanges } from './useChanges'

type UnmountFn = () => undefined | void

type Source<T = any> =
  | { [key: string]: T }
  | ReadonlyArray<T>
  | ReadonlySet<T>
  | ReadonlyMap<any, T>

type Effect<T extends Source> = T extends Source<infer U>
  ? T extends ReadonlyMap<infer P, U>
    ? (value: U, key: P) => UnmountFn | void
    : T extends ReadonlyArray<U> | ReadonlySet<U>
    ? (value: U) => UnmountFn | void
    : (value: U, key: string) => UnmountFn | void
  : never

/**
 * Create a layout effect for every key of your `values` object.
 *
 * Values are passed to your `effect` function as they are added and replaced.
 * The `effect` can return a cleanup function to call for removed values.
 *
 * Map objects use their keys
 */
export function useEffects<T extends Source>(
  source: T,
  effect: Effect<T>,
  deps?: readonly any[]
) {
  const unmountFns = useMemo(() => new Map<any, UnmountFn>(), [])

  type UsedEffect = (value: any, key?: any) => UnmountFn | void
  const usedEffect = useRef<UsedEffect>(effect)
  useLayoutEffect(() => {
    usedEffect.current = effect
  }, deps)

  const target = no(source)
  const isValueBased = is.array(target) || is.set(target)

  // Process the initial values.
  useLayoutEffect(() => {
    if (is.function(target.forEach)) {
      target.forEach(mount)
    } else {
      Object.keys(target).forEach(key => mount(target[key], key))
    }
    return () => unmountFns.forEach(unmount => unmount())
  }, [source])

  // Subscribe to changes.
  useChanges(source, onChange)

  function mount(value: any, key?: any) {
    const cacheKey = isValueBased ? value : key
    if (!(is.array(target) && unmountFns.has(cacheKey))) {
      const effect = usedEffect.current
      const unmount = isValueBased ? effect(value) : effect(value, key)
      unmountFns.set(cacheKey, unmount || noop)
    }
  }

  function onChange({ op, key, value, oldValue }: Change) {
    if (key == SIZE) return
    if (op == 'clear') {
      unmountFns.forEach(unmount => unmount())
      unmountFns.clear()
    } else if (op == 'splice') {
      if (is.array(target)) {
        oldValue.forEach((value: any) => {
          if (!target.includes(value)) {
            unmountFns.get(value)!()
            unmountFns.delete(value)
          }
        })
        value.forEach((value: any) => {
          if (!unmountFns.has(value)) {
            mount(value)
          }
        })
      }
    } else {
      if (op != 'add') {
        const cacheKey = isValueBased ? oldValue : key
        if (!(is.array(target) && target.includes(cacheKey))) {
          unmountFns.get(cacheKey)!()
          unmountFns.delete(cacheKey)
        }
      }
      if (op != 'remove') {
        const cacheKey = isValueBased ? value : key
        if (!(is.array(target) && unmountFns.has(cacheKey))) {
          mount(value, key)
        }
      }
    }
  }
}
