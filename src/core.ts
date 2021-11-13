// Observation
export { o } from './o'
export { auto, Auto } from './auto'
export { when } from './when'
export { watch, Watcher } from './watch'
export { isDerived, setDerived, removeDerived } from './derive'
export { shallowChanges } from './observable'
export type { Derived } from './derive'
export type { AutoConfig } from './auto'
export type { Change, ChangeObserver, Observer } from './observable'

// Escape hatches
export { no } from './no'
export { noto } from './noto'

// Internals
export { $O, $T, $$ } from './symbols'
export { globals } from './globals'
export { flushSync } from './batch'
export { mountAuto } from './mountAuto'
export { ObjectTraps } from './proxy'
export { Observable, ObservedSlot } from './observable'
export type { ObserverTarget } from './observable'
