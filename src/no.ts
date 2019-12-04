import is from '@alloc/is'
import { setHidden } from './common'
import { noto } from './noto'
import { $$ } from './symbols'

/**
 * Get the original object from an observable proxy,
 * or wrap a function to disable observation inside it.
 *
 * Read `no` as "non-observable", essentially the reverse of the `o` function.
 */
export function no<T>(value: T): T {
  if (is.function_(value)) {
    const fn = (...args: any[]) => noto(() => value(...args))
    setHidden(fn, 'name', value.name)
    setHidden(fn, $$, value)
    return fn as any
  }
  return (value && value[$$]) || value
}
