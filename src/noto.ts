import { isFunction } from './common'
import { untracked } from './global'
import { $$ } from './symbols'

/**
 * Get the original object from an observable proxy,
 * or call a given function with implicit observation disabled.
 */
export function noto<T>(
  value: T
): T extends (...args: any[]) => infer U ? U : T {
  return isFunction(value)
    ? untracked(value as any)
    : (value && value[$$]) || value
}
