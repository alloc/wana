import { setHidden } from './common'
import { global, observe } from './global'
import { $$, $O } from './symbols'

export const shims: Array<[Function, string[]]> = [
  [Object, ['keys', 'values', 'entries']],
  [Array, ['from']],
]

shims.forEach(([namespace, keys]) =>
  keys.forEach(key => {
    const fn = namespace[key]
    const shim = (...args: any[]) => {
      const target = args[0] && args[0][$$]
      if (target) {
        observe(target, $O)
        args[0] = target
      }
      return fn(...args)
    }
    setHidden(shim, 'name', fn.name)
    Object.defineProperty(namespace, key, {
      get: () => (global.observe ? shim : fn),
    })
  })
)
