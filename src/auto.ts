import { isDev } from '@alloc/is-dev'
import { batch } from './batch'
import { rethrowError } from './common'
import { addDebugAction, getDebug } from './debug'
import { global } from './global'
import { Change, ObservedValue, Observer } from './observable'
import { $O } from './symbols'

/** Run an effect when its tracked values change. */
export function auto(effect: () => void, config?: AutoConfig) {
  const auto = new Auto(config || {})
  auto.run(effect)
  return auto
}

export interface AutoConfig {
  /** When true, react to changes immediately. By default, changes are delayed until the next microtask loop */
  sync?: boolean
  /** By default, rerun the last effect (after any delay) */
  onDirty?: Auto['onDirty']
  /** By default, errors are rethrown */
  onError?: Auto['onError']
}

export class Auto {
  sync: boolean
  dirty = true
  nonce?: number
  observer: AutoObserver | null = null
  onDirty: (this: Auto) => void
  onError: (this: Auto, error: Error) => void

  constructor(config: AutoConfig = {}) {
    this.sync = !!config.sync
    this.onDirty = config.onDirty || this._onDirty
    this.onError = config.onError || rethrowError
  }

  run<T extends Function>(compute: T) {
    const observer = this.start(compute)
    try {
      const result = compute()
      this.stop().commit(observer)
      return result
    } catch (error) {
      this.stop().onError(error)
    }
  }

  /** Rerun the last effect and commit its observer */
  rerun() {
    return this.observer && this.run(this.observer.effect)
  }

  /**
   * Replace the current `observer`.
   *
   * Pass a nonce to bail out if observed values have since changed.
   */
  commit(observer: AutoObserver, nonce?: number) {
    if (this.observer) {
      this.observer.dispose()
    }

    // Stop observing when changes occur between run and commit.
    if (nonce && nonce != observer.nonce) {
      this.observer = null
      return false
    }

    // Attach to the observed values.
    observer.onChange = this._onChange.bind(this)
    observer.observed.forEach(observable => observable.add(observer))
    this.observer = observer
    return true
  }

  dispose() {
    if (this.observer) {
      // Stop observing.
      this.observer.dispose()
      // Cancel batched effects.
      this.observer = null
    }
  }

  /**
   * @internal
   * Create an observer and start observing.
   *
   * The given `effect` is used by `rerun` calls made after
   * the new observer is committed.
   */
  start(effect: Function) {
    if (global.observe) {
      throw Error('Nested tracking is forbidden')
    }
    const observer = new AutoObserver(effect)
    global.auto = this
    global.observe = (target, key) => {
      observer.observed.add(target[$O]!.get(key))
    }
    return observer
  }

  /**
   * @internal
   * Stop observing and reset the `dirty` flag.
   */
  stop() {
    if (global.auto == this) {
      global.auto = global.observe = null
    }
    this.dirty = false
    return this
  }

  /**
   * @internal
   * Replace the current `observer` when appropriate.
   */
  clear() {
    if (!this.dirty) {
      this.dirty = true
      this.onDirty()
    }
  }

  protected _onChange(change: Change) {
    if (isDev && getDebug(this)) {
      addDebugAction(this, change)
    }
    this.clear()
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
  constructor(readonly effect: Function) {
    super()
  }
}
