import {
  forwardRef,
  ForwardRefExoticComponent,
  PropsWithoutRef,
  ReactElement,
  RefAttributes,
  RefForwardingComponent,
  useEffect,
  useReducer,
} from 'react'
import { useMemoOne as useMemo } from 'use-memo-one'
import { Auto } from './auto'
import { emptyArray, isFunction } from './common'
import { untracked } from './global'
import { o } from './observable'

const useForceUpdate = () => useReducer(() => ({}), {})[1] as (() => void)
const useConstant = <T>(create: () => T) => useMemo(create, emptyArray)
const useDispose = (dispose: () => void) => useEffect(() => dispose, emptyArray)

interface Component<P> {
  (props: P): ReactElement | null
  displayName?: string
}

/** Wrap a component with magic observable tracking */
export function withAuto<P>(component: Component<P>): Component<P>

/** Wrap a component with `forwardRef` and magic observable tracking */
export function withAuto<T, P = {}>(
  component: RefForwardingComponent<T, P>
): ForwardRefExoticComponent<PropsWithoutRef<P> & RefAttributes<T | undefined>>

/** @internal */
export function withAuto(render: any) {
  const component = (props: object, ref?: any) => {
    const onDirty = useForceUpdate()
    const auto = useConstant(() => new Auto({ onDirty }))
    useDispose(() => auto.dispose())
    useEffect(() => {
      if (!auto.commit()) onDirty()
    })
    return auto.run(() => render(props, ref))
  }
  // prettier-ignore
  return render.length > 1
    ? forwardRef(component as any)
    : component
}

/** Run an effect when implicit dependencies are changed */
export function useAuto(effect: () => void, deps?: any[]) {
  const auto = useConstant(() => new Auto())
  useDispose(() => auto.dispose())
  useEffect(() => {
    auto.run(effect)
    auto.commit(true)
  }, deps)
}

/** Create observable component state */
export function useO<T>(create: () => T, deps?: readonly any[]): T
export function useO<T>(state: Exclude<T, Function>, deps?: readonly any[]): T
export function useO<T>(
  state: Exclude<T, Function> | (() => T),
  deps?: readonly any[]
): T {
  return useMemo(
    () => o(isFunction(state) ? untracked(state) : state),
    deps || emptyArray
  )
}
