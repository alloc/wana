import { isMap, isObject, setHidden } from './common'
import { $O, $P, SIZE } from './symbols'
import { traps } from './traps'

/**
 * Get an observable proxy for the given value,
 * except for functions and primitives.
 */
export function o<T>(value: T): T {
  let proxy: any = value && value[$P]
  if (!proxy) {
    if (!isObject(value) || Object.isFrozen(value)) {
      return value
    }
    proxy = new Proxy(value, traps[value.constructor.name] || traps.Object)
    setHidden(value, $P, proxy)
    setHidden(value, $O, new Observable())
  }
  return proxy
}

/** Any value acting as an object key */
type ObservedKey = any

/** An observer set with metadata about what's being observed */
export interface ObserverSet extends Set<Observer> {
  key: ObservedKey
  owner: Observable
}

/** Glorified event emitter */
export class Observable {
  private observers = new Map<ObservedKey, ObserverSet>()

  add(key: ObservedKey, observer: Observer) {
    let observers = this.observers.get(key)!
    if (observers) {
      observers.add(observer)
    } else {
      observers = new Set([observer]) as any
      observers.key = key
      observers.owner = this
      this.observers.set(key, observers)
    }
    observer.observed.add(observers)
  }

  remove(key: ObservedKey, observer: Observer) {
    const observers = this.observers.get(key)
    if (observers) {
      observer.observed.delete(observers)
      observers.delete(observer)
      if (!observers.size) {
        this.observers.delete(key)
      }
    }
  }

  emit(change: Change) {
    if (change.op !== 'clear') {
      this._notify(change.key, change)
    } else if (isMap(change.oldValue)) {
      change.oldValue.forEach((_, key) => this._notify(key, change))
    }
    if (change.key !== SIZE) {
      this._notify($O, change)
    }
  }

  private _notify(key: any, change: Change) {
    const observers = this.observers.get(key)
    if (observers) {
      // Clone the "observers" in case they get mutated by an effect.
      for (const observer of Array.from(observers)) {
        if (!observer.disposed) {
          observer['_onChange'](change)
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

export abstract class Observer {
  observed = new Set<ObserverSet>()
  disposed = false

  dispose() {
    if (!this.disposed) {
      this.disposed = true
      this.observed.forEach(cache => {
        cache.owner.remove(cache.key, this)
      })
    }
  }

  protected abstract _onChange(change: Change): void
}
