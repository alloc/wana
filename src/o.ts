import { isFunction, isObject, setHidden } from './common'
import { derive, Derived } from './derive'
import { Observable, ObservedState } from './observable'
import { $O } from './symbols'

/** Create an observable getter that memoizes its result. */
export function o<T>(fn: () => T): Derived<T>

/** Get an observable proxy for an object. Non-objects are returned as-is. */
export function o<T>(value: Exclude<T, Function>): T

/**
 * Get an observable proxy for the given value,
 * except for functions and primitives.
 */
export function o(value: ObservedState) {
  let state = value && value[$O]
  if (!state) {
    if (isFunction(value)) {
      return derive(value as any)
    }
    if (!isObject(value) || Object.isFrozen(value)) {
      return value
    }
    setHidden(value, $O, (state = new Observable(value)))
  }
  // The proxy does not exist for observable functions.
  return state.proxy || value
}
