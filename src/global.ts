import { Auto } from './auto'
import { ObservedState } from './observable'

interface Global {
  /** React-managed render batching. Defaults to no-op. */
  batchedUpdates: (effect: () => void) => void
  /** Notify the current observer. */
  observe: ((obj: ObservedState, key: any) => void) | null
  /** The `Auto` object for the current `withAuto` component being rendered. */
  auto: Auto | null
}

export const global: Global = {
  batchedUpdates: effect => effect(),
  observe: null,
  auto: null,
}

/** Tell the current observer to track the given object/key pair  */
export const observe = (obj: ObservedState, key: any) =>
  !!global.observe && (global.observe(obj, key), true)
