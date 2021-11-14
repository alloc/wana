import { observe } from './globals'
import { $$ } from './symbols'

// These methods observe everything.
const observeAll = [
  Symbol.iterator,
  'entries',
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
  'keys',
  'lastIndexOf',
  'map',
  'reduce',
  'reduceRight',
  'slice',
  'some',
  'values',
]

const wrapIterators = (ctr: Function) =>
  observeAll.reduce(
    (methods, name) => (
      ctr.prototype[name] &&
        (methods[name] = function (...args: any[]) {
          const self = this[$$]
          observe(self)
          return self[name](...args)
        }),
      methods
    ),
    {} as object
  )

export const ArrayIterators = wrapIterators(Array)
export const MapIterators = wrapIterators(Map)
export const SetIterators = wrapIterators(Set)
