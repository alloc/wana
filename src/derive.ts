import { Auto } from './auto'
import { Disposable, setHidden } from './common'
import { observe } from './global'
import { noto } from './noto'
import { Observable } from './observable'
import { $O } from './symbols'

/**
 * An observable getter that memoizes its result.
 */
export interface Derived<T = any> extends Disposable {
  /** Get the current value */
  (): T
}

/**
 * Create an observable getter that memoizes its result.
 *
 * Values are observed on every memoization, which send events to observers
 * of the `Derived` function.
 */
export function derive<T>(fn: () => T, lazy?: boolean): Derived<T> {
  // The memoized result
  let memo: T | undefined

  // For being observed
  const observable = new Observable()

  // For observing others
  const auto = new Auto({
    lazy,
    onDirty() {
      observable.emit({
        op: 'clear',
        target: derived,
        oldValue: memo,
      })
      memo = undefined
    },
  })

  // The observable getter
  const derived: Derived<T> = () => {
    if (auto.dirty) {
      noto(() => {
        memo = auto.run(fn)
      })
    }
    observe(derived, $O)
    return memo!
  }

  setHidden(derived, '_auto', auto)
  setHidden(derived, $O, observable)

  derived.dispose = () => auto.dispose()
  return derived
}
