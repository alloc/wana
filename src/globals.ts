import { Auto } from './auto'
import { Change, ObserverTarget } from './observable'

type OnRender = (
  auto: Auto,
  depth: number,
  component: React.FunctionComponent<any>
) => void

type Globals = {
  /** Notify the current observer. */
  observe: ((target: ObserverTarget, key: any) => void) | null
  /** The `Auto` object for the current `withAuto` component being rendered. */
  auto: Auto | null
  /** For debugging re-renders. Only called in development. */
  onRender: OnRender | null
  /** For spying on every change event. */
  onChange: ((change: Change) => void) | null
}

export const globals: Globals = {
  observe: null,
  auto: null,
  onRender: null,
  onChange: null,
}

/** Tell the current observer to track the given object/key pair  */
export const observe = (target: ObserverTarget, key: any) =>
  !!globals.observe && (globals.observe(target, key), true)
