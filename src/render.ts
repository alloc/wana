import {
  forwardRef,
  ForwardRefExoticComponent,
  PropsWithoutRef,
  ReactElement,
  RefAttributes,
  RefForwardingComponent,
  useEffect,
  useReducer,
  useRef,
} from 'react'
import { useMemoOne as useMemo } from 'use-memo-one'
import { auto, Auto } from './auto'
import { emptyArray, isFunction } from './common'
import { o } from './observable'

const useForceUpdate = () => useReducer(() => ({}), {})[1] as (() => void)
const useConstant = <T>(create: () => T) => useMemo(create, emptyArray)
const useDispose = (dispose: () => void) => useEffect(() => dispose, emptyArray)

type Component = (props: object) => ReactElement | null

/** Wrap a component with magic observable tracking */
export function withAuto<T extends Component>(component: T): T

/** Wrap a component with `forwardRef` and magic observable tracking */
export function withAuto<T, P = {}>(
  component: RefForwardingComponent<T, P>
): ForwardRefExoticComponent<PropsWithoutRef<P> & RefAttributes<T>>

/** @internal */
export function withAuto(render: any) {
  const component = (props: object, ref?: any) => {
    const onDirty = useForceUpdate()
    const auto = useConstant(() => new Auto({ onDirty }))
    useDispose(() => auto.dispose())
    return auto.run(() => render(props, ref))
  }
  // prettier-ignore
  return render.length > 1
    ? forwardRef(component as any)
    : component
}

/** Run an effect when implicit dependencies are changed */
export function useAuto(effect: () => void, deps?: any[]) {
  const effectRef = useRef(effect)
  useEffect(() => {
    effectRef.current = effect
  })
  useEffect(() => {
    const observer = auto(() => effectRef.current())
    return () => observer.dispose()
  }, deps || emptyArray)
}

/** Create observable component state */
export function useO<T>(
  state: Exclude<T, Function> | (() => T),
  deps?: readonly any[]
): T {
  return useMemo(
    () => o(isFunction(state) ? state() : state),
    deps || emptyArray
  )
}
