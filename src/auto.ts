import { isUndefined, noop, rethrowError } from './common'
import { track } from './global'
import { o } from './o'
import { ObservedState, ObservedValue, Observer } from './observable'
import { $O } from './symbols'

/** Run an effect when its tracked values change. */
export function auto(effect: () => void, config?: AutoConfig) {
  const auto = new Auto(config || {})
  auto.run(effect)
  return auto
}

export interface AutoConfig {
  /** When true, commits must be manual */
  lazy?: boolean
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
  lazy: boolean
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
    this.lazy = !!config.lazy
    this.delay = isUndefined(config.delay) || config.delay
    this.onDirty = config.onDirty || this.rerun
    this.onDelay = config.onDelay || this._onDelay
    this.onError = config.onError || rethrowError
  }

  wrap<T extends object>(state: Exclude<T, Function>, reset?: boolean): T {
    const observer = reset
      ? (this.nextObserver = new AutoObserver(this.lazy && []))
      : this.nextObserver!

    const auto = this
    const traps: ProxyHandler<T> = {
      get(obj, key) {
        const value = obj[key]
        if (observer.values) {
          observer.observe(obj, key)
          if (value && value[$O]) {
            return auto.wrap(value)
          }
        } else {
          // This proxy is outdated. Make it pass through.
          traps.get = Reflect.get
        }
        return value
      },
    }

    return new Proxy(o(state), traps)
  }

  run<T>(effect: () => T): T | undefined {
    let result: T | undefined
    try {
      const observer = new AutoObserver(this.lazy && [])
      result = track(effect, (target, key) => {
        observer.observe(target, key)
      })
      this.nextObserver = observer
      this.nextEffect = effect
      this.dirty = false
      if (!this.lazy) {
        this.commit()
      }
    } catch (error) {
      this.dirty = false
      this.onError(error)
    }
    return result
  }

  /** Rerun the last effect and commit its observer */
  rerun() {
    return this.run(this.lastEffect)
  }

  /** Commit the observer from the last run, except when the observer is dirty */
  commit() {
    const observer = this.nextObserver
    if (observer) {
      this.nextObserver = null
      if (this.lastObserver) {
        this.lastObserver.dispose()
      }

      this.lastEffect = this.nextEffect
      this.nextEffect = noop

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
  observed = new Set<ObservedValue>()
  onChange: (() => void) | null = null

  constructor(public values?: any[] | false) {
    super()
  }

  /** Returns false when the observed values are still current */
  get dirty() {
    const { values } = this
    return (
      !!values &&
      Array.from(this.observed).some((value, i) => values[i] !== value.get())
    )
  }

  commit(onChange: () => void) {
    this.values = false
    this.onChange = onChange
    this.observed.forEach(value => value.add(this))
  }

  observe(state: ObservedState, key: keyof any) {
    const { observed, values } = this
    const { size } = observed

    const observable = state[$O]!.get(key)
    observed.add(observable)

    if (observed.size > size) {
      if (values) {
        values.push(observable.get())
      } else {
        observable.add(this)
      }
    }
  }
}
