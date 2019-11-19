import is from '@sindresorhus/is'
import { getOwnDescriptor, setHidden } from './common'
import { derive, Derived } from './derive'
import { canMakeObservable, Observable, ObservedState } from './observable'
import { $O } from './symbols'

/** Create an observable getter that memoizes its result. */
export function o<T>(fn: () => T): Derived<T>

/** Create an observable getter that memoizes its result. */
export function o(fn: Function): Derived

/** Get an observable proxy for an object. Non-objects are returned as-is. */
export function o<T>(value: T): T

export function o(value: ObservedState) {
  let state = value && value[$O]
  if (!state || !getOwnDescriptor(value, $O)) {
    if (is.function_(value)) {
      return derive(auto => auto.run(value))
    }
    if (!canMakeObservable(value) || Object.isFrozen(value)) {
      return value
    }
    setHidden(value, $O, (state = new Observable(value)))
  }
  // The proxy does not exist for observable functions.
  return state.proxy || value
}
