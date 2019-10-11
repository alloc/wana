import { forwardRef, ReactElement, Ref, RefAttributes, useEffect } from 'react'
import { Auto } from '../auto'
import { useConstant, useDispose, useForceUpdate } from './common'

interface Component<P = any> {
  (props: P): ReactElement | null
  displayName?: string
}

interface RefForwardingComponent<T = any, P = any> {
  (props: P, ref: Ref<T>): ReactElement | null
  displayName?: string
}

/** Wrap a component with magic observable tracking */
export function withAuto<T extends Component>(component: T): T

/** Wrap a component with `forwardRef` and magic observable tracking */
export function withAuto<T extends RefForwardingComponent>(
  component: T
): T &
  ((
    props: T extends RefForwardingComponent<infer U, infer P>
      ? P & RefAttributes<U>
      : never
  ) => ReactElement | null)

/** @internal */
export function withAuto(render: any) {
  const component = (props: object, ref?: any) => {
    const onDirty = useForceUpdate()
    const auto = useConstant(() => new Auto({ lazy: true, onDirty }))
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
