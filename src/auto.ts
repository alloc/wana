import { isUndefined, noop, rethrowError } from './common'
import { track } from './global'
import { ObservedValue, Observer } from './observable'
import { $O } from './symbols'

/** Run an effect when its tracked values change. */
export function auto(effect: () => void, config?: AutoConfig) {
  const auto = new Auto(config || {})
  auto.run(effect)
  auto.commit(true)
  return auto
}

export interface AutoConfig {
  /** By default, delay changes until the next microtask loop */
  delay?: number | boolean
  /** By default, rerun the last effect */
  onDirty?: Auto['onDirty']
  /** By default, attach the `update` callback to a promise or timeout */
  onDelay?: Auto['onDelay']
  /** By default, errors are rethrown */
  onError?: Auto['onError']
}

export class Auto {
  dirty = true
  delay: number | boolean
  onDirty: (this: Auto) => void
  onDelay: (this: Auto, update: () => void) => void
  onError: (this: Auto, error: Error) => void
  lastObserver: AutoObserver | null = null
  lastEffect = noop
  nextObserver: AutoObserver | null = null
  nextEffect = noop

  constructor(config: AutoConfig = {}) {
    this.delay = isUndefined(config.delay) || config.delay
    this.onDirty = config.onDirty || this.rerun
    this.onDelay = config.onDelay || this._onDelay
    this.onError = config.onError || rethrowError
  }

  run<T>(effect: () => T): T | undefined {
    let result: T | undefined
    try {
      const observed = new Set<ObservedValue>()
      result = track(effect, (target, key) => {
        observed.add(target[$O]!.get(key))
      })
      this.nextObserver = new AutoObserver(observed)
      this.nextEffect = effect
      this.dirty = false
    } catch (error) {
      this.dirty = false
      this.onError(error)
    }
    return result
  }

  /** Rerun the last effect and commit its observer */
  rerun() {
    this.run(this.lastEffect)
    this.commit(true)
  }

  /** Commit the observer from the last run, except when the observer is dirty */
  commit(force?: boolean) {
    const observer = this.nextObserver
    if (observer) {
      this.nextObserver = null
      if (this.lastObserver) {
        this.lastObserver.dispose()
      }

      this.lastEffect = this.nextEffect
      this.nextEffect = noop

      // Check for changes between run and commit.
      if (!force && observer.dirty) {
        this.lastObserver = null
        return false
      }

      observer.values = null
      observer.onChange = this._onChange.bind(this)
      observer.observed.forEach(value => value.add(observer!))
      this.lastObserver = observer
    }
    return true
  }

  dispose() {
    const observer = this.lastObserver
    if (observer) {
      observer.dispose()
      // Prevent delayed changes.
      this.lastObserver = null
    }
    // Prevent the next commit.
    this.nextObserver = null
  }

  protected _onChange() {
    if (!this.dirty) {
      this.dirty = true
      if (this.delay > 0) {
        const observer = this.lastObserver
        this.onDelay(() => observer == this.lastObserver && this.onDirty())
      } else {
        this.onDirty()
      }
    }
  }

  protected _onDelay(update: () => void) {
    if (this.delay === true) {
      Promise.resolve().then(update)
    } else {
      setTimeout(update, this.delay as any)
    }
  }
}

export class AutoObserver extends Observer {
  values: any[] | null = []
  onChange: (() => void) | null = null

  constructor(readonly observed: ReadonlySet<ObservedValue>) {
    super()
    observed.forEach(value => {
      this.values!.push(value.get())
    })
  }

  /** Returns false when the observed values are still current */
  get dirty() {
    const { values } = this
    return (
      !values ||
      Array.from(this.observed).some((value, i) => values[i] !== value.get())
    )
  }
}
