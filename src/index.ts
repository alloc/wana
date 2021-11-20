import './shims'

export {
  Auto,
  auto,
  isDerived,
  setDerived,
  clearDerived,
  removeDerived,
  no,
  noto,
  o,
  shallowChanges,
  watch,
  when,
} from './core'

export type {
  AutoConfig,
  Change,
  ChangeObserver,
  Derived,
  Watcher,
} from './core'

export * from './ui'
