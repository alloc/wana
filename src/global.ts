import { ObservedState } from './observable'

interface Global {
  /** React-managed render batching. Defaults to no-op. */
  batchedUpdates: (effect: () => void) => void
  /** Notify the current observer. */
  observe: ((obj: ObservedState, key: any) => void) | null
}

export const global: Global = {
  batchedUpdates: effect => effect(),
  observe: null,
}

/** Tell the current observer to track the given object/key pair  */
export const observe = (obj: ObservedState, key: any) =>
  !!global.observe && (global.observe(obj, key), true)
