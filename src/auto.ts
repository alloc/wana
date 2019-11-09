import { isDev } from 'is-dev'
import { batch } from './batch'
import { rethrowError } from './common'
import { addDebugAction, getDebug } from './debug'
import { global } from './global'
import { Change, ObservedValue, Observer } from './observable'
import { $O } from './symbols'
import { useAutoValue } from './ui/useAutoValue'

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
  /** By default, rerun the last effect (after any delay) */
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
    return this.lastObserver && this.lastObserver.nonce
  }

  run<T>(effect: () => T) {
    // The "run" implementation was extracted into a React hook
    // so that "withAuto" can avoid unnecessary indirection.
    return useAutoValue(this, effect)
  }

  /** Rerun the last effect and commit its observer */
  rerun() {
    const { lastObserver } = this
    return lastObserver && this.run(lastObserver.effect)
  }

  /**
   * @internal
   * Create an observer that tracks any observable properties that are
   * accessed before the `finish` method is called.
   *
   * The given `effect` is never called, except in `rerun` calls when
   * the observer has been committed.
   */
  start(effect: () => any) {
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
   * Once tracking is done, mark our observer as "ready to commit".
   * Commit the observer immediately when `this.lazy` is false.
   */
  finish(observer: AutoObserver) {
    this.dirty = false
    this.nextObserver = observer

    global.auto = null
    global.observe = null

    // Compute the observer nonce at the end, in case the observed
    // effect mutates any of the observed values.
    observer.observed.forEach(observable => {
      observer.nonce += observable.nonce
    })

    if (!this.lazy) {
      this.commit()
    }
  }

  /**
   * @internal
   * Stop tracking since an effect threw an error.
   */
  catch(error: Error) {
    global.auto = null
    global.observe = null

    this.dirty = false
    this.onError(error)
  }

  /**
   * Commit the last observer passed to `finish`, unless an observed value
   * changed since then.
   */
  commit() {
    const observer = this.nextObserver
    if (observer) {
      this.nextObserver = null
      if (this.lastObserver) {
        this.lastObserver.dispose()
      }

      // Stop observing when changes occur between run and commit.
      if (this.lazy && observer.dirty) {
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

  protected _onChange(change: Change) {
    if (isDev && getDebug(this)) {
      addDebugAction(this, change)
    }
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

  constructor(readonly effect: () => any) {
    super()
  }

  get dirty() {
    let nonce = 0
    this.observed.forEach(observable => {
      nonce += observable.nonce
    })
    return nonce != this.nonce
  }

  commit(onChange: (change: Change) => void) {
    this.onChange = onChange
    this.observed.forEach(observable => observable.add(this))
  }
}
