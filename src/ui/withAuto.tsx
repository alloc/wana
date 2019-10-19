import React from 'react'
import { forwardRef, ReactElement, Ref, RefAttributes, useEffect } from 'react'
import { Auto } from '../auto'
import { batch } from '../batch'
import { AutoContext, useAutoContext } from './AutoContext'
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
    const { depth } = useAutoContext()
    const forceUpdate = useForceUpdate()
    const auto = useConstant(
      () =>
        new Auto({
          lazy: true,
          onDirty() {
            const { nonce } = auto
            batch.render(depth, () => {
              // Trigger a render except when the latest render is pending
              // or was committed before the batch was flushed.
              if (!auto.nextObserver && nonce == auto.nonce) {
                forceUpdate()
              }
            })
          },
        })
    )
    useDispose(() => auto.dispose())
    useEffect(() => {
      // The commit fails to subscribe to observed values
      // that changed between the render and commit phases.
      // In that case, re-render immediately.
      if (!auto.commit()) {
        forceUpdate()
      }
    })
    return (
      <AutoContext depth={depth + 1}>
        {auto.run(() => {
          return render(props, ref)
        })}
      </AutoContext>
    )
  }
  // prettier-ignore
  return render.length > 1
    ? forwardRef(component as any)
    : component
}
