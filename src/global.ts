import { Auto } from './auto'
import { ObserverTarget } from './observable'

type OnRender = (
  auto: Auto,
  depth: number,
  component: React.FunctionComponent<any>
) => void

interface Global {
  /** React-managed render batching. Defaults to no-op. */
  batchedUpdates: (effect: () => void) => void
  /** Notify the current observer. */
  observe: ((target: ObserverTarget, key: any) => void) | null
  /** The `Auto` object for the current `withAuto` component being rendered. */
  auto: Auto | null
  /** For debugging re-renders. Only called in development. */
  onRender: OnRender | null
}

export const global: Global = {
  onRender: () => {},
  batchedUpdates: effect => effect(),
  observe: null,
  auto: null,
}

/** Tell the current observer to track the given object/key pair  */
export const observe = (target: ObserverTarget, key: any) =>
  !!global.observe && (global.observe(target, key), true)
