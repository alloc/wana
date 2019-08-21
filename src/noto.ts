import { isFunction, setHidden } from './common'
import { untracked } from './global'
import { $$ } from './symbols'

/**
 * Get the original object from an observable proxy,
 * or wrap a function to disable observation inside it.
 */
export function noto<T>(value: T): T {
  if (isFunction(value)) {
    function fn(this: any) {
      return untracked(value as any, this)
    }
    setHidden(fn, 'name', value.name)
    return fn as any
  }
  return (value && value[$$]) || value
}
