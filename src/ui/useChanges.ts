import { useLayoutEffect } from 'react-layout-effect'
import { useMemoOne as useMemo } from 'use-memo-one'
import { emptyArray } from '../common'
import { Change, ChangeObserver, ObserverTarget } from '../observable'
import { $O } from '../symbols'

/** Listen for shallow changes to an observable object. */
export function useChanges(
  target: ObserverTarget,
  onChange: (change: Change) => void,
  deps?: readonly any[]
) {
  const observable = target[$O]
  if (!observable) {
    throw Error('Expected an observable object')
  }

  const observer = useMemo<ChangeObserver>(
    () => ({ onChange } as any),
    emptyArray
  )

  useLayoutEffect(() => {
    observer.onChange = onChange
  }, deps)

  useLayoutEffect(() => {
    const observers = observable.get($O)
    observers.add(observer)
    return () => {
      observers.delete(observer)
    }
  }, [observable])
}
