import { is } from '@alloc/is'
import { isDev } from '@alloc/is-dev'
import { batch } from './batch'
import { noop, rethrowError } from './common'
import { addDebugAction, getDebug } from './debug'
import { globals } from './globals'
import { noto } from './noto'
import { Change, ObservedSlot, Observer } from './observable'
import { $O } from './symbols'

/** Run an effect when its tracked values change. */
export function auto(effect: () => void, config?: AutoConfig) {
  const auto = new Auto(config)
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
  /** Run an effect after an `observer` is activated */
  onCommit?: Auto['onCommit']
  /** Run an effect after being disposed */
  onDispose?: Auto['onDispose']
}

export class Auto {
  sync: boolean
  dirty = true
  nonce = 0
  observer: AutoObserver | null = null
  onDirty: (this: Auto) => void
  onError: (this: Auto, error: Error) => void
  onCommit: (observer: AutoObserver) => void
  onDispose: () => void

  constructor(config: AutoConfig = {}) {
    this.sync = !!config.sync
    this.onDirty = config.onDirty || this._onDirty
    this.onError = config.onError || rethrowError
    this.onCommit = config.onCommit || noop
    this.onDispose = config.onDispose || noop
  }

  run<T extends Function>(compute: T) {
    const observer = this.start(compute)
    try {
      const result = compute()
      this.stop().commit(observer)
      this.nonce = observer.nonce
      return result
    } catch (error: any) {
      this.stop().onError(error)
    }
  }

  /** Rerun the last effect and commit its observer */
  rerun() {
    const { observer } = this
    return observer && noto(() => this.run(observer.effect))
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
    this.onCommit(observer)
    return true
  }

  dispose() {
    if (this.observer) {
      // Stop observing.
      this.observer.dispose()
      // Cancel batched effects.
      this.observer = null
      // Run any side effects.
      this.onDispose()
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
    if (globals.observe) {
      throw Error('Nested tracking is forbidden')
    }
    const observer = new AutoObserver(effect)
    globals.auto = this
    globals.observe = (target, key) => {
      observer.observed.add(target[$O]!.get(key))
    }
    return observer
  }

  /**
   * @internal
   * Stop observing and reset the `dirty` flag.
   */
  stop() {
    if (globals.auto == this) {
      globals.auto = globals.observe = null
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
    // Derived values used by sync reactions are forced to rerun immediately
    // so the reactions can know whether the value actually changed.
    if (this.sync && change.op == 'clear' && is.function(change.target)) {
      change.target()
    }
    this.clear()
  }

  protected _onDirty() {
    const { observer, nonce } = this
    const maybeRerun = () =>
      // If the current nonce is not greater, no dependencies have changed.
      observer!.nonce > nonce //
        ? this.rerun()
        : (this.dirty = false)

    if (this.sync) {
      maybeRerun()
    } else {
      batch.run(
        // The observer is replaced when the effect is rerun or when disposed.
        () => observer == this.observer && maybeRerun()
      )
    }
  }
}

export class AutoObserver extends Observer {
  observed = new Set<ObservedSlot>()
  constructor(readonly effect: Function) {
    super()
  }
}
