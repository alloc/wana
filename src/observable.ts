import { is } from '@alloc/is'
import { isDev } from '@alloc/is-dev'
import { Disposable } from './common'
import { setDebug } from './debug'
import { createProxy } from './proxy'
import { $O } from './symbols'

/** Return true if `value` could be made observable or is already observable */
export const canMakeObservable = (value: unknown): boolean =>
  is.object(value) &&
  !is.date(value) &&
  !is.regExp(value) &&
  !is.promise(value) &&
  !is.generator(value) &&
  !is.generatorFunction(value) &&
  !is.asyncFunction(value) &&
  !is.weakMap(value) &&
  !is.weakSet(value)

/** A function that can subscribe to observable objects. */
export abstract class Observer implements Disposable {
  observed!: ReadonlySet<ObservedSlot>
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

/** @internal */
export class Observable<T extends object = any> extends Map<
  ObservedKey,
  ObservedSlot
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
      this.proxy = createProxy(source)
    }
  }

  /** Return true if at least one observer exists for the given key. */
  has(key: ObservedKey) {
    const observers = super.get(key)
    return !!(observers && observers.size)
  }

  /** Return a `Set` of observers for the given key, even if not observed. */
  get(key: ObservedKey): ObservedSlot {
    let observers = super.get(key)
    if (!observers) {
      observers = new ObservedSlot(this, key)
      this.set(key, observers)
    }
    return observers
  }
}

/** Mutable state with an associated observable */
export type ObserverTarget = object & { [$O]?: Observable }

/** Any value acting as an object key */
export type ObservedKey = any

/** An observer set with metadata about what's being observed */
export class ObservedSlot extends Set<ChangeObserver> {
  nonce = 1
  constructor(readonly owner: Observable, readonly key: ObservedKey) {
    super()
  }
}

/** An observed mutation of an observable object. */
export interface Change<T = any> {
  op: 'add' | 'replace' | 'remove' | 'splice' | 'clear'
  target: object
  key?: any
  value?: T
  oldValue?: T
}

/** The most basic observer of changes. */
export interface ChangeObserver extends Disposable {
  onChange: ((change: Change) => void) | null
}
