import { noop, rethrowError } from './common'
import { track } from './global'
import { Observer } from './observable'
import { $O } from './symbols'

/** Run an effect when its tracked values change. */
export function auto(effect: () => void, config: AutoConfig = {}) {
  const auto = new Auto(config)
  auto.run(effect)
  return auto
}

export interface AutoConfig {
  delay?: number
  /** By default, calls the `run` method with the previous effect */
  onDirty?: Auto['onDirty']
  /** By default, errors are rethrown */
  onError?: Auto['onError']
}

export class Auto extends Observer {
  dirty = true
  delay: number
  onDirty: (this: Auto) => void
  onError: (this: Auto, error: Error) => void
  prevEffect = noop

  constructor(config: AutoConfig = {}) {
    super()
    this.delay = config.delay || 0
    this.onDirty = config.onDirty || this.rerun
    this.onError = config.onError || rethrowError
  }

  run<T>(effect: () => T): T | undefined {
    const { observed } = this
    this.observed = new Set()
    let result: T | undefined
    try {
      result = track(effect, (target, key) => target[$O].add(key, this))
      this.prevEffect = effect
      this.dirty = false
    } catch (error) {
      this.observed.clear()
      this.onError(error)
    } finally {
      observed.forEach(set => {
        if (!this.observed.has(set)) {
          set.owner.remove(set.key, this)
        }
      })
    }
    return result
  }

  rerun() {
    this.run(this.prevEffect)
  }

  protected _onChange() {
    if (!this.dirty) {
      this.dirty = true
      if (this.delay > 0) {
        setTimeout(() => this.disposed || this.onDirty(), this.delay)
      } else {
        this.onDirty()
      }
    }
  }
}
