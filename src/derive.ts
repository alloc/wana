import { Auto } from './auto'
import { Disposable, setHidden } from './common'
import { observe, untracked } from './global'
import { Observable } from './observable'
import { $$, $O } from './symbols'

/** A function that memoizes its result until an observed value is changed. The memoization is observable. */
export type Derived<T extends any[] = any[], U = any> = ((...args: T) => U) &
  Disposable & {
    /** Recompute the value on next call */
    clear: () => void
  }

export function derive<T extends any[], U>(
  fn: (...args: T) => U,
  lazy?: boolean
): Derived<T, U>

export function derive(fn: Function, lazy?: boolean): Derived

/** Create an observable function. */
export function derive(fn: Function, lazy?: boolean) {
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
  const derived: Derived = (...args) => {
    observe(derived, $O)
    return auto.dirty
      ? (lastResult = untracked(() => auto.run(() => fn(...args))))!
      : lastResult!
  }
  setHidden(derived, $$, auto)
  setHidden(derived, $O, observable)
  derived.clear = () => auto['_onChange']()
  derived.dispose = () => auto.dispose()
  return derived
}
