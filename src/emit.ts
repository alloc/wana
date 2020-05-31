import { is } from '@alloc/is'
import { globals } from './globals'
import { Change, Observable, ObservedSlot } from './observable'
import { $O, SIZE } from './symbols'

const { get } = Map.prototype

function onChange(observable: Observable, key: any, change: Change) {
  const observers: ObservedSlot = get.call(observable, key)
  if (observers) {
    // Increase the nonce even if no observers exist, because there
    // might be a pending observer (like a "withAuto" component).
    observers.nonce++

    if (observers.size) {
      // Clone the "observers" in case they get mutated by an effect.
      for (const observer of Array.from(observers)) {
        if (observer.onChange) {
          observer.onChange(change)
        }
      }
    }
  }
}

function emit(target: object, change: Change) {
  const observable = target[$O]

  // The "clear" op never has a key.
  if (change.op !== 'clear') {
    onChange(observable, change.key, change)
  }
  // When a `Map` object is cleared, notify every key observer.
  else if (is.map(change.oldValue)) {
    change.oldValue.forEach((_, key) => onChange(observable, key, change))
  }

  // Size changes always come after a related change,
  // so avoid notifying `$O` observers more than once.
  if (change.key !== SIZE) {
    observable.nonce++
    onChange(observable, $O, change)
  }

  if (globals.onChange) {
    globals.onChange(change)
  }

  return true
}

export const emitAdd = (target: object, key: any, value: any) =>
  emit(target, {
    op: 'add',
    target,
    key,
    value,
  })

export const emitRemove = (target: object, key: any, oldValue: any) =>
  emit(target, {
    op: 'remove',
    target,
    key,
    oldValue,
  })

export const emitReplace = (
  target: object,
  key: any,
  value: any,
  oldValue: any
) =>
  emit(target, {
    op: 'replace',
    target,
    key,
    value,
    oldValue,
  })

export const emitSplice = (
  target: any[],
  key: number,
  value: readonly any[],
  oldValue: readonly any[]
) =>
  emit(target, {
    op: 'splice',
    target,
    key,
    value,
    oldValue,
  })

export const emitClear = (target: object, oldValue: any) =>
  emit(target, {
    op: 'clear',
    target,
    oldValue,
  })
