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

/** @internal */
export function derive<T>(run: (auto: Auto) => T): Derived<T> {
  // The memoized result
  let memo: T | undefined

  // For being observed
  const observable = new Observable()

  // For observing others
  const auto = new Auto({
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
        memo = run(auto)
      })
    }
    observe(derived, $O)
    return memo!
  }

  derived.dispose = () => auto.dispose()

  setHidden(derived, $O, observable)
  return derived
}
