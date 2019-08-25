import { Auto } from './auto'
import { Disposable, setHidden } from './common'
import { observe, untracked } from './global'
import { Observable } from './observable'
import { $$, $O } from './symbols'

/** A getter that memoizes its result until an observed value is changed. The memoization is observable. */
export type Derived<T = any> = (() => T) &
  Disposable & {
    /** Recompute the value on next call */
    clear: () => void
  }

/** Create an observable getter. */
export function derive<T>(fn: () => T, lazy?: boolean): Derived<T> {
  const observable = new Observable()
  const auto = new Auto({
    lazy,
    delay: 0,
    onDirty: () => (
      observable.emit({
        op: 'clear',
        target: derived,
        oldValue: lastResult,
      }),
      (lastResult = undefined)
    ),
  })
  let lastResult: any
  const derived: Derived<T> = () => {
    observe(derived, $O)
    return auto.dirty
      ? (lastResult = untracked(() => auto.run(fn)))!
      : lastResult!
  }
  setHidden(derived, $$, auto)
  setHidden(derived, $O, observable)
  derived.clear = () => auto['_onChange']()
  derived.dispose = () => auto.dispose()
  return derived
}
