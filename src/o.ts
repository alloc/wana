import { isObject, setHidden } from './common'
import { Observable } from './observable'
import { $O } from './symbols'

/**
 * Get an observable proxy for the given value,
 * except for functions and primitives.
 */
export function o<T>(value: T): T {
  let state: Observable<T> | undefined = value && value[$O]
  if (!state) {
    if (!isObject(value) || Object.isFrozen(value)) {
      return value
    }
    setHidden(value, $O, (state = new Observable(value as any)))
  }
  return state.proxy!
}
