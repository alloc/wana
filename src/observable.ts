import is from '@alloc/is'
import { isDev } from '@alloc/is-dev'
import { Disposable } from './common'
import { setDebug } from './debug'
import { $O, SIZE } from './symbols'
import { traps } from './traps'

/** Mutable state with an associated observable */
export type ObservedState = object & { [$O]?: Observable }

/** Any value acting as an object key */
export type ObservedKey = any

/** An observer set with metadata about what's being observed */
export class ObservedValue extends Set<ChangeObserver> {
  nonce = 1
  constructor(readonly owner: Observable, readonly key: ObservedKey) {
    super()
  }
}

/** Return true if `value` could be made observable or is already observable */
export const canMakeObservable = (value: unknown): boolean =>
  is.object(value) &&
  !is.date(value) &&
  !is.regExp(value) &&
  !is.nativePromise(value) &&
  !is.generator(value) &&
  !is.generatorFunction(value) &&
  !is.asyncFunction(value) &&
  !is.weakMap(value) &&
  !is.weakSet(value)

/** Glorified event emitter */
export class Observable<T extends object = any> extends Map<
  ObservedKey,
  ObservedValue
> {
  readonly proxy: T | undefined
  nonce = 1

  constructor(readonly source?: T) {
    super()
    if (isDev) {
      setDebug(this, {
        name: this.constructor.name || 'Unknown',
      })
    }
    if (source) {
      this.proxy = new Proxy(
        source,
        traps[source.constructor.name] || traps.Object
      )
    }
  }

  get(key: ObservedKey): ObservedValue {
    let observers = super.get(key)!
    if (!observers) {
      observers = new ObservedValue(this, key)
      this.set(key, observers)
    }
    return observers
  }

  emit(change: Change) {
    if (change.op !== 'clear') {
      this._notify(change.key, change)
    } else if (is.map(change.oldValue)) {
      change.oldValue.forEach((_, key) => this._notify(key, change))
    }
    if (change.key !== SIZE) {
      this.nonce++
      this._notify($O, change)
    }
  }

  private _notify(key: any, change: Change) {
    const observers = super.get(key)
    if (observers) {
      // Increase the nonce even if no observers exist, because there
      // might be a pending observer (like a "withAuto" component).
      observers.nonce++

      if (observers.size) {
        // Clone the "observers" in case they get mutated by an effect.
        for (const observer of Array.from(observers)) {
          if (observer.onChange) {
            observer.onChange(change)
          }
        }
      }
    }
  }
}

export interface Change {
  op: 'add' | 'replace' | 'remove' | 'splice' | 'clear'
  target: object
  key?: any
  value?: any
  oldValue?: any
}

export interface ChangeObserver extends Disposable {
  onChange: ((change: Change) => void) | null
}

export abstract class Observer implements Disposable {
  observed!: ReadonlySet<ObservedValue>
  onChange: ((change: Change) => void) | null = null

  /** The current nonce of our observed values combined */
  get nonce() {
    let nonce = 0
    this.observed.forEach(observable => {
      nonce += observable.nonce
    })
    return nonce
  }

  dispose() {
    if (this.onChange) {
      this.onChange = null
      this.observed.forEach(value => value.delete(this))
    }
  }
}
