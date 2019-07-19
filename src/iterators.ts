import { observe } from './global'
import { $$, $O } from './symbols'

// These methods observe everything.
const observeAll = [
  Symbol.iterator,
  'every',
  'filter',
  'find',
  'findIndex',
  'flat',
  'flatMap',
  'forEach',
  'includes',
  'indexOf',
  'join',
  'lastIndexOf',
  'map',
  'reduce',
  'reduceRight',
  'slice',
  'some',
]

const wrapIterators = (ctr: Function) =>
  observeAll.reduce(
    (methods, name) => (
      ctr.prototype[name] &&
        (methods[name] = function(...args: any[]) {
          const self = this[$$]
          observe(self, $O)
          return self[name](...args)
        }),
      methods
    ),
    {} as object
  )

export const ArrayIterators = wrapIterators(Array)
export const MapIterators = wrapIterators(Map)
export const SetIterators = wrapIterators(Set)
