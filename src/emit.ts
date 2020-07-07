import { is } from '@alloc/is'
import { globals } from './globals'
import { Change, Observable, ObservedSlot, ObserverTarget } from './observable'
import { $O, SIZE } from './symbols'

const { get } = Map.prototype

function onChange(observable: Observable, key: any, change: Change) {
  const observers: ObservedSlot = get.call(observable, key)
  if (observers) {
    // Increase the nonce even if no observers exist, because there
    // might be a pending observer (like a "withAuto" component).
    observers.nonce++
    observers.onChange(change)
  }
}

function emit(target: ObserverTarget, change: Change) {
  const observable = target[$O]!
  console.log('wana:emit (%O, %O)', change.op, change.key)

  if (globals.onChange) {
    globals.onChange(change)
  }

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
    onChange(observable, $O, change)
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

export const emitDefine = (
  target: object,
  key: keyof any,
  value: PropertyDescriptor,
  oldValue?: PropertyDescriptor
) =>
  emit(target, {
    op: 'define',
    target,
    key,
    value,
    oldValue,
  })
