import { is } from '@alloc/is'
import { getOwnDescriptor, setHidden } from './common'
import { derive, Derived } from './derive'
import { canMakeObservable, Observable, ObserverTarget } from './observable'
import { $O } from './symbols'

/**
 * Pass an **object** to receive an observable proxy.
 * Pass a **function** to receive an observable getter.
 * Anything else is returned as-is.
 */
export function o<T>(
  value: T
): T extends () => infer U ? Derived<U> : T extends Function ? Derived : T

export function o(value: ObserverTarget) {
  let state = value && value[$O]
  if (!state || !getOwnDescriptor(value, $O)) {
    if (!canMakeObservable(value)) {
      return value
    }
    if (is.function(value)) {
      return derive(auto => auto.run(value))
    }
    if (Object.isFrozen(value)) {
      return value
    }
    setHidden(value, $O, (state = new Observable(value)))
  }
  // The proxy does not exist for observable functions.
  return state.proxy || value
}
