import { Change, ObserverTarget } from '../observable'
import { $O } from '../symbols'
import { logChange } from './logChange'

export type ChangeLogConfig = {
  name?: string
  onChange?: (change: Change) => void
}

export function logChanges(
  target: ObserverTarget,
  { name, onChange }: ChangeLogConfig = {}
) {
  const observable = target[$O]
  if (!observable) {
    throw Error('Expected an observable object')
  }

  const observers = observable.get($O)
  const observer = {
    onChange: (change: Change) => {
      if (onChange) {
        onChange(change)
      }
      logChange(change, name)
    },
    dispose: () => {
      observers.delete(observer)
    },
  }

  observers.add(observer)
  return observer
}
