import {
  forwardRef,
  MutableRefObject,
  ReactNode,
  useEffect,
  useReducer,
} from 'react'
import { useMemoOne as useMemo } from 'use-memo-one'
import { auto, Auto } from './auto'
import { emptyArray, isFunction } from './common'
import { o } from './observable'

const useForceUpdate = () => useReducer(() => ({}), {})[1] as (() => void)

/** Wrap a component with magic observable tracking */
export function withAuto<T, Props extends object>(
  component: (props: Props) => ReactNode
): typeof component

/** Wrap a component with `forwardRef` and magic observable tracking */
export function withAuto<T, Props extends object>(
  component: (props: Props, ref: MutableRefObject<T>) => ReactNode
): typeof component

/** @internal */
export function withAuto(render: any) {
  const component = (props: object, ref?: any) => {
    const forceUpdate = useForceUpdate()
    const auto = useMemo(() => new Auto({ onDirty: forceUpdate }), emptyArray)
    return auto.run(() => render(props, ref))
  }
  // prettier-ignore
  return render.length > 1
    ? forwardRef(component as any)
    : component
}

/** Run an effect when implicit dependencies are changed */
export function useAuto(effect: () => void, deps?: any[]) {
  useEffect(() => {
    const observer = auto(effect)
    return () => observer.dispose()
  }, deps)
}

/** Create observable component state */
export function useO<T extends object>(
  state: Exclude<T, Function> | (() => T),
  deps?: readonly any[]
): T {
  return useMemo(
    () => o(isFunction(state) ? state() : state),
    deps || emptyArray
  )
}
