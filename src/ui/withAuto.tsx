import { isDev } from 'is-dev'
import React, {
  forwardRef,
  ReactElement,
  Ref,
  RefAttributes,
  useEffect,
} from 'react'
import { Auto } from '../auto'
import { batch } from '../batch'
import { addDebugAction, getDebug, setDebug } from '../debug'
import { global } from '../global'
import { AutoContext, useAutoContext } from './AutoContext'
import { useConstant, useDispose, useForceUpdate } from './common'
import { useAutoValue } from './useAutoValue'

interface Component<P = any> {
  (props: P): ReactElement | null
  displayName?: string
}

interface RefForwardingComponent<T = any, P = any> {
  (props: P, ref: Ref<T>): ReactElement | null
  displayName?: string
}

type RefForwardingAuto<T extends RefForwardingComponent> = T &
  ((
    props: T extends RefForwardingComponent<infer U, infer P>
      ? P & RefAttributes<U>
      : never
  ) => ReactElement | null)

/** Wrap a component with magic observable tracking */
export function withAuto<T extends Component>(component: T): T

/** Wrap a component with `forwardRef` and magic observable tracking */
export function withAuto<T extends RefForwardingComponent>(
  component: T
): RefForwardingAuto<T>

/** @internal */
export function withAuto(render: any) {
  let component: React.FunctionComponent<any> = (props, ref) => {
    const { depth } = useAutoContext()
    const auto = useAutoRender(component, depth)
    if (isDev) {
      getDebug(auto).renders!++
      if (global.onRender) {
        global.onRender(auto, depth, component)
      }
    }
    return (
      <AutoContext depth={depth + 1}>
        {useAutoValue(auto, render, props, ref)}
      </AutoContext>
    )
  }
  if (render.length > 1) {
    // Bind its component name to the ref forwarder.
    Object.defineProperty(component, 'displayName', {
      get: () => component.displayName,
    })
    component = forwardRef(component)
  }
  return component
}

function useAutoRender(component: React.FunctionComponent<any>, depth: number) {
  const forceUpdate = useForceUpdate()
  const auto = useConstant(() => {
    const auto = new Auto({
      lazy: true,
      onDirty() {
        if (isDev) {
          addDebugAction(auto, 'dirty')
        }
        const { nonce } = auto
        batch.render(depth, () => {
          // Trigger a render except when the latest render is pending
          // or was committed before the batch was flushed.
          if (!auto.nextObserver && nonce == auto.nonce) {
            if (isDev) {
              addDebugAction(auto, 'batch')
            }
            forceUpdate()
          }
        })
      },
    })
    if (isDev) {
      setDebug(auto, {
        name: component.displayName || 'Anonymous',
        actions: ['init'],
        renders: 0,
      })
    }
    return auto
  })
  useDispose(() => auto.dispose())
  useEffect(() => {
    if (isDev) {
      getDebug(auto).actions = []
    }
    // The commit fails to subscribe to observed values
    // that changed between the render and commit phases.
    // In that case, re-render immediately.
    if (!auto.commit()) {
      if (isDev) {
        addDebugAction(auto, 'dirty')
      }
      forceUpdate()
    } else if (isDev) {
      addDebugAction(auto, 'observe')
    }
  })
  return auto
}
