import { isDev } from 'is-dev'
import { Disposable, isMap } from './common'
import { setDebug } from './debug'
import { $O, SIZE } from './symbols'
import { traps } from './traps'

/** Mutable state with an associated observable */
export type ObservedState = object & { [$O]?: Observable }

/** Any value acting as an object key */
export type ObservedKey = any

/** An observer set with metadata about what's being observed */
export class ObservedValue extends Set<ChangeObserver> {
  nonce = 0
  constructor(readonly owner: Observable, readonly key: ObservedKey) {
    super()
  }
}

/** Glorified event emitter */
export class Observable<T extends object = any> extends Map<
  ObservedKey,
  ObservedValue
> {
  readonly proxy: T | undefined
  nonce = 0

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
    } else if (isMap(change.oldValue)) {
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

  dispose() {
    if (this.onChange) {
      this.onChange = null
      this.observed.forEach(value => value.delete(this))
    }
  }
}
