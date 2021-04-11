import { is } from '@alloc/is'
import { useLayoutEffect } from 'react-layout-effect'
import { Derived } from '../derive'
import { Observable } from '../observable'
import { $O, SIZE } from '../symbols'
import { useForceUpdate } from './common'

/**
 * An alternative to `withAuto` that re-renders the caller
 * when the given observable value is changed.
 *
 * If you pass an object without a key, the entire object
 * is observed.
 *
 * ⚠️ This hook has performance drawbacks! It cannot automatically
 * batch React updates, so you need to wrap changes with `batchedUpdates`
 * to avoid multiple re-renders. It also cannot wait for ancestor
 * components to re-render first, which also leads to excessive re-renders.
 */
export function useBinding<T extends object, P extends keyof T>(
  target: T extends ReadonlyMap<any, any> ? never : T,
  key: P
): T[P]
export function useBinding<K, V>(
  target: ReadonlyMap<K, V>,
  key: K
): V | undefined
export function useBinding<T>(target: Derived<T>): T
export function useBinding<T extends object>(target: T): T
export function useBinding(
  target: Record<string, any> & { [$O]?: Observable },
  key?: any
) {
  const observable = target[$O]
  const forceUpdate = useForceUpdate()
  useLayoutEffect(
    () =>
      observable?.observe(resolveKey(target, key), change => {
        // Ignore "clear" event from a derived getter, which only serves
        // as a signal to check its nonce in the next batch. Since we don't
        // use batching in this hook, just wait for a "replace" event.
        if (change.op == 'clear' && is.function(target)) return
        forceUpdate()
      }).dispose,
    [observable, key]
  )

  // Return the current value.
  return key
    ? is.map(target)
      ? target.get(key)
      : target[key]
    : is.function(target)
    ? target()
    : target
}

const resolveKey = (target: any, key: any = $O) =>
  (key == 'length' && is.array(target)) || (key == 'size' && is.set(target))
    ? SIZE
    : key
