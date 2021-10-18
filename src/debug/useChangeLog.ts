import { useChanges } from '../ui/useChanges'
import { logChange } from './logChange'
import { ChangeLogConfig } from './logChanges'

declare const process: any

/**
 * Log any shallow changes to the given observable object.
 */
export function useChangeLog(
  target: object,
  { name, onChange }: ChangeLogConfig = {}
) {
  useChanges(target, change => {
    if (onChange) {
      onChange(change)
    }
    if (process.env.NODE_ENV !== 'test') {
      logChange(change, name)
    }
  })
}
