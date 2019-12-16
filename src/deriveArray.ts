import { useMemoOne } from 'use-memo-one'
import { Disposable } from './common'
import { emitRemove, emitReplace, emitSplice } from './emit'
import { observe } from './global'
import { o } from './o'
import { ChangeObserver, ObserverTarget } from './observable'
import { $O, SIZE } from './symbols'
import { useDispose } from './ui/common'

export type ObservedArray<T = unknown> = ObserverTarget & readonly T[]

export type ArrayObserver<T = unknown> = ChangeObserver & {
  target: ObservedArray<T>
}

export type ArraySpliceEvent<T = unknown> = {
  op: 'splice'
  key: number
  oldValue: readonly T[]
  newValue: readonly T[]
  target: ObservedArray<T>
}

export type ArrayRemoveEvent<T = unknown> = {
  op: 'remove'
  key: number
  oldValue: T
  target: ObservedArray<T>
}

export type ArrayChange<T = unknown> = ArraySpliceEvent | ArrayRemoveEvent

export interface DerivedArray<T = unknown> extends Array<T>, Disposable {}

export function deriveArray<T>(
  target: ObservedArray<T>,
  compute: (value: T) => T
) {
  const observable = target[$O]
  if (!observable) {
    throw Error('Expected an observable object')
  }

  const memo: DerivedArray<T> = target.map(compute) as any

  const observer: ArrayObserver<T> = {
    target,
    onChange: arg => {
      const oldLength = memo.length
      const change = arg as ArrayChange<T>
      const i = change.key
      if (change.op == 'splice') {
        const { oldValue, newValue } = change
        const values = newValue.map(value => compute(value as T))
        const deleteCount = oldValue.length
        memo.splice(i, deleteCount, ...values)
        emitSplice(memo, i, values, oldValue)
        emitReplace(
          memo,
          SIZE,
          oldLength + (newValue.length - deleteCount),
          oldLength
        )
      } else if (change.op == 'remove') {
        emitRemove(memo, i, memo.splice(i, 1)[0])
        emitReplace(memo, SIZE, oldLength - 1, oldLength)
      }
    },
    dispose: () => {
      observable.get($O).delete(observer)
    },
  }

  observable.get($O).add(observer)
  memo.dispose = observer.dispose
  return o(memo)
}

export function useDerivedArray<T>(
  target: readonly T[],
  compute: (value: T) => T
) {
  const memo = useMemoOne(() => deriveArray(target, compute), [target])
  useDispose(() => memo.dispose())
  observe(memo, $O)
  return memo
}
