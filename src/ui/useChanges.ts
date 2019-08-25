import { useEffect } from 'react'
import { emptyArray } from '../common'
import { Change, ObservedState } from '../observable'
import { $O } from '../symbols'

/** Listen for shallow changes to an observable object. */
export function useChanges(
  target: ObservedState,
  onChange: (change: Change) => void,
  deps?: any[]
) {
  const observable = target[$O]
  if (!observable) {
    throw Error('Expected an observable object')
  }
  useEffect(() => {
    const observers = observable.get($O)
    const observer = {
      onChange,
      dispose() {
        observers.delete(observer)
      },
    }
    observers.add(observer)
    return observer.dispose
  }, deps || emptyArray)
}
