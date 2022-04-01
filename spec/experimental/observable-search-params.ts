import { emitChange, observe, Observable } from 'wana/core'

/**
 * `URLSearchParams` but observable!
 *
 * Note: Only the `get` method is observable, and only the `set`
 * method will trigger observers.
 */
export class ObservableSearchParams extends URLSearchParams {
  protected observable = new Observable(this)

  get(name: string) {
    observe(this.observable, name)
    return super.get(name)
  }

  set(name: string, value: string) {
    const oldValue = super.get(name)
    super.set(name, value)
    emitChange(this.observable, {
      op: 'replace',
      target: this,
      key: name,
      value,
      oldValue,
    })
  }
}
