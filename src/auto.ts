import { batch } from './batch'
import { rethrowError } from './common'
import { track } from './global'
import { ObservedState, ObservedValue, Observer } from './observable'
import { $O } from './symbols'

/** Run an effect when its tracked values change. */
export function auto(effect: () => void, config?: AutoConfig) {
  const auto = new Auto(config || {})
  auto.run(effect)
  return auto
}

export interface AutoConfig {
  /** When true, you must call `commit` to subscribe to observed values */
  lazy?: boolean
  /** When true, react to changes immediately. By default, changes are delayed until the next microtask loop */
  sync?: boolean
  /** By default, rerun the last effect */
  onDirty?: Auto['onDirty']
  /** By default, errors are rethrown */
  onError?: Auto['onError']
}

export class Auto {
  lazy: boolean
  sync: boolean
  dirty = true
  onDirty: (this: Auto) => void
  onError: (this: Auto, error: Error) => void
  lastObserver: AutoObserver | null = null
  nextObserver: AutoObserver | null = null

  constructor(config: AutoConfig = {}) {
    this.lazy = !!config.lazy
    this.sync = !!config.sync
    this.onDirty = config.onDirty || this._onDirty
    this.onError = config.onError || rethrowError
  }

  /** The nonce from the last commit */
  get nonce() {
    return this.lastObserver!.nonce
  }

  run<T>(effect: () => T): T | undefined {
    const observer = new AutoObserver(effect)
    let result: T | undefined
    try {
      result = track(effect, (target, key) => {
        observer.observe(target, key)
      })
      this.nextObserver = observer
      this.dirty = false
      if (!this.lazy) {
        this.commit()
      }
    } catch (error) {
      if (!this.lazy) {
        observer.dispose()
      }
      this.dirty = false
      this.onError(error)
    }
    return result
  }

  /** Rerun the last effect and commit its observer */
  rerun() {
    return this.run(this.lastObserver!.effect)
  }

  /** Commit the observer from the last run, except when the observer is dirty */
  commit() {
    const observer = this.nextObserver
    if (observer) {
      this.nextObserver = null
      if (this.lastObserver) {
        this.lastObserver.dispose()
      }

      // Check for changes between run and commit.
      if (observer.dirty) {
        this.lastObserver = null
        return false
      }

      // Attach to the observed values.
      observer.commit(this._onChange.bind(this))
      this.lastObserver = observer
    }
    return true
  }

  dispose() {
    const { lastObserver } = this
    if (lastObserver) {
      lastObserver.dispose()
      // Prevent delayed changes.
      this.lastObserver = null
    }
    // Prevent the next commit.
    this.nextObserver = null
  }

  protected _onChange() {
    if (!this.dirty) {
      this.dirty = true
      this.onDirty()
    }
  }

  protected _onDirty() {
    if (this.sync) {
      this.rerun()
    } else {
      batch.run(this)
    }
  }
}

export class AutoObserver extends Observer {
  observed = new Set<ObservedValue>()
  nonce = 0

  constructor(readonly effect: () => void) {
    super()
  }

  get dirty() {
    let nonce = 0
    this.observed.forEach(observable => {
      nonce += observable.nonce
    })
    return nonce != this.nonce
  }

  observe(state: ObservedState, key: keyof any) {
    const { observed } = this
    const { size } = observed

    const observable = state[$O]!.get(key)
    observed.add(observable)

    if (observed.size > size) {
      this.nonce += observable.nonce
    }
  }

  commit(onChange: () => void) {
    this.onChange = onChange
    this.observed.forEach(observable => observable.add(this))
  }
}
