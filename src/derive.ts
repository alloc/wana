import { is } from '@alloc/is'
import { Auto } from './auto'
import { batch } from './batch'
import { Disposable, setHidden } from './common'
import { emitReplace } from './emit'
import { observe } from './globals'
import { noto } from './noto'
import { Observable } from './observable'
import { $O } from './symbols'

/**
 * An observable getter that memoizes its result.
 *
 * The memoization is observed, so when a dependency changes,
 * the memoized value is released and observers are notified.
 */
export interface Derived<T = any> extends Disposable {
  /** The underlying observable */
  [$O]?: Observable
  /** The underlying observer */
  auto: Auto
  /** Get the current value */
  (): T
}

/** @internal */
export function derive<T>(
  run: (auto: Auto) => T,
  discard?: (memo: T, oldMemo: T | undefined) => boolean
): Derived<T> {
  // The memoized result
  let memo: T | undefined

  // For being observed
  const observable = new Observable()

  // For observing others
  const auto = new Auto({
    onDirty() {
      if (observable.has($O)) {
        batch.run(derived)

        // Tell our observers to join the next batch to see if our `memo`
        // value has changed.
        // Avoid mutating the `nonce` of our observers until our getter
        // produces a new value (which may never happen).
        observable.get($O).onChange({
          op: 'clear',
          target: derived,
          oldValue: memo,
        })
      }
    },
  })

  // The observable getter
  const derived = () => {
    if (auto.dirty) {
      noto(() => {
        const oldMemo = memo
        const newMemo = run(auto)
        if (newMemo !== oldMemo && !(discard && discard(newMemo, oldMemo))) {
          emitReplace(derived, null, (memo = newMemo), oldMemo)
        }
      })
    }
    observe(derived)
    return memo!
  }

  derived.auto = auto
  derived.dispose = () => auto.dispose()

  setHidden(derived, $O, observable)
  return derived
}

export function isDerived(value: unknown): value is Derived {
  return is.function(value) && !!value[$O]
}

/** Convert all `Derived<T>` property types into `T` */
export type WithDerived<T extends object> = {
  [P in keyof T]: T[P] extends Derived<infer U> ? U : T[P]
}

/**
 * Create an observable getter and bind it to the given property name.
 *
 * ⚠️ Make sure you call `removeDerived` at some point to avoid memory leaks.
 */
export function setDerived<T extends object, P extends keyof T>(
  obj: T,
  key: P,
  compute: () => T[P],
  discard?: (memo: T[P], oldMemo: T[P] | undefined) => boolean
) {
  Object.defineProperty(obj, key, {
    get: derive(auto => auto.run(compute), discard),
  })
}

/**
 * If you call `setDerived` on an object, you must call `removeDerived` on
 * the same object before trying to release its memory, or else it will be
 * retained by the observables being observed by its derived properties
 * (leading to a memory leak).
 *
 * Note: The derived properties' latest values will still be accessible,
 * but they won't be automatically updated anymore.
 */
export function removeDerived(obj: object) {
  const props = Object.getOwnPropertyDescriptors(obj)
  for (const prop in props) {
    const derived = props[prop].get as Derived
    if (derived[$O]) {
      derived.dispose()
    }
  }
}
