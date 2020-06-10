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
export function derive<T>(run: (auto: Auto) => T): Derived<T> {
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
        observable.get($O).emit({
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
        memo = run(auto)
        if (memo !== oldMemo) {
          emitReplace(derived, null, memo, oldMemo)
        }
      })
    }
    observe(derived, $O)
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
