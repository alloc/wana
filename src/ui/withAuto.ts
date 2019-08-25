import {
  forwardRef,
  ForwardRefExoticComponent,
  PropsWithoutRef,
  ReactElement,
  RefAttributes,
  RefForwardingComponent,
  useEffect,
} from 'react'
import { Auto } from '../auto'
import { useConstant, useDispose, useForceUpdate } from './common'

interface Component<P> {
  (props: P): ReactElement | null
  displayName?: string
}

/** Wrap a component with magic observable tracking */
export function withAuto<P>(component: Component<P>): Component<P>

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
