import { $O, auto, o } from 'wana/core'
import { shims } from 'wana/shims'
import { getObservers } from './auto.spec'

shims.forEach(([namespace, keys]) => {
  keys.forEach(key => {
    describe(namespace.name + '.' + key, () => {
      describe('when observed', () => {
        it('observes the entire object', () => {
          const obj = o(new (namespace as any)())
          auto(() => namespace[key](obj))
          expect(getObservers(obj, $O).size).toBe(1)
        })
      })
      describe('when not observed', () => {
        it('returns the native impl', () => {
          expect(namespace[key].toString()).toBe(
            `function ${key}() { [native code] }`
          )
        })
      })
    })
  })
})
