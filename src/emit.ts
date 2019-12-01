import { Change } from './observable'
import { $O } from './symbols'

const emit = (target: object, change: Change) => (target[$O].emit(change), true)

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

export const emitClear = <T extends Set<any> | Map<any, any>>(
  target: T,
  oldValue: T
) =>
  emit(target, {
    op: 'clear',
    target,
    oldValue,
  })
