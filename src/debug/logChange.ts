import { is } from '@alloc/is'
import { isDev } from '@alloc/is-dev'
import { getDebug } from '../debug'
import { Change } from '../observable'
import { format } from './format'

let prevTime = Date.now()

export function logChange(change: Change, targetId?: string) {
  let verb: string
  let meta: object
  if (change.op == 'add') {
    verb = 'Added'
    meta = { value: change.value }
  } else if (change.op == 'remove') {
    verb = 'Removed'
    meta = { oldValue: change.oldValue }
  } else if (change.op == 'replace') {
    verb = 'Replaced'
    meta = { value: change.value, oldValue: change.oldValue }
  } else if (change.op == 'splice') {
    verb = 'Spliced'
    meta = { value: change.value, oldValue: change.oldValue }
  } else {
    verb = 'Cleared'
    meta = { oldValue: change.oldValue }
  }

  console.log(
    ...format(
      '$verb $key of $targetId with',
      {
        verb,
        key: is.string(change.key) ? `"${change.key}"` : change.key,
        targetId:
          targetId ||
          (getDebug(change.target) || change.target.constructor).name,
      },
      {
        verb: '',
        targetId: 'color: #7BB347',
      }
    ),
    meta,
    change.target
  )

  if (isDev && console.groupCollapsed) {
    const now = Date.now()
    console.groupCollapsed(`Stack trace (+${now - prevTime}ms)`)
    console.trace()
    console.groupEnd()
    prevTime = now
  }
}

declare global {
  interface Console {
    groupCollapsed(name: string): void
    groupEnd(): void
  }
}
