import { isFunction, setHidden } from './common'
import { untracked } from './global'
import { $$ } from './symbols'

/**
 * Get the original object from an observable proxy,
 * or wrap a function to disable observation inside it.
 *
 * Read `no` as "non-observable", essentially the reverse of the `o` function.
 */
export function no<T>(value: T): T {
  if (isFunction(value)) {
    const fn = untracked.bind(null, value as any)
    setHidden(fn, 'name', value.name)
    return fn as any
  }
  return (value && value[$$]) || value
}
