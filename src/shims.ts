import { setHidden } from './common'
import { observe } from './global'
import { $$, $O } from './symbols'

const shims: Array<[object, string[]]> = [
  [Object, ['keys', 'values', 'entries']],
  [Array, ['from']],
]

shims.forEach(([namespace, keys]) =>
  keys.forEach(key => {
    const fn = namespace[key]
    const shim = (namespace[key] = (...args: any[]) => {
      const target = args[0] && args[0][$$]
      if (target) {
        observe(target, $O)
        args[0] = target
      }
      return fn(...args)
    })
    setHidden(shim, 'name', fn.name)
  })
)
