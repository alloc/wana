import { isDev } from '@alloc/is-dev'
import * as React from 'react'
import { forwardRef, ReactElement, Ref, RefAttributes, useMemo } from 'react'
import { useLayoutEffect } from 'react-layout-effect'
import { Auto, AutoObserver } from '../auto'
import { batch } from '../batch'
import { addDebugAction, getDebug, setDebug } from '../debug'
import { globals } from '../globals'
import { AutoContext, useAutoContext } from './AutoContext'
import { RenderAction, useDispose, useForceUpdate } from './common'

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
export function withAuto<T extends Component>(render: T): T

/** Wrap a component with `forwardRef` and magic observable tracking */
export function withAuto<T extends RefForwardingComponent>(
  render: T
): RefForwardingAuto<T>

/** @internal */
export function withAuto(render: any) {
  let component: React.FunctionComponent<any> = (props, ref) => {
    const { auto, depth, commit } = useAutoRender(component)

    // Subscribe to observables as early as possible, because
    // we don't want effects to trigger the previous observer.
    useLayoutEffect(() => commit(observer, nonce))

    // Track which observable state is used during render.
    const observer = auto.start(render)
    try {
      var content = render(props, ref)
    } finally {
      auto.stop()
    }

    // Cache the nonce for cancellation purposes.
    const { nonce } = observer

    // React might discard this render without telling us, but we can
    // detect that with our first child's render phase.
    const recon = (
      <RenderAction
        useAction={() => {
          auto.nonce = nonce
        }}
      />
    )

    return (
      <AutoContext depth={depth + 1}>
        {recon}
        {content}
      </AutoContext>
    )
  }
  if (render.length > 1) {
    // Bind its component name to the ref forwarder.
    Object.defineProperty(component, 'displayName', {
      get: () => component.displayName,
    })
    component = forwardRef(component as any)
  }
  if (/^[A-Z]/.test(render.name)) {
    component.displayName = render.name
  }
  if (isDev) {
    Object.defineProperty(component, '__render', {
      value: render,
    })
  }
  return component
}

// withAuto.dev is used by @wana/babel-plugin-with-auto
if (isDev) {
  withAuto.dev = (render: any) => {
    const Component = render.length > 1 ? React.forwardRef(render) : render
    function AutoRender(props: any) {
      const { auto, depth, commit } = useAutoRender(Component)
      function useCommit(observer: AutoObserver) {
        let nonce = 0
        useLayoutEffect(() => commit(observer, nonce))
        return () => {
          nonce = observer.nonce
          return (
            <RenderAction
              useAction={() => {
                auto.nonce = nonce
              }}
            />
          )
        }
      }
      return (
        <AutoContext depth={depth}>
          <Component {...props} $auto={auto} $useCommit={useCommit} />
        </AutoContext>
      )
    }
    Object.defineProperty(AutoRender, 'displayName', {
      get: () => 'AutoRender',
      set(displayName) {
        Component.displayName = displayName
      },
    })
    return AutoRender
  }
}

function useAutoRender(component: React.FunctionComponent<any>) {
  const { depth } = useAutoContext()

  const forceUpdate = useForceUpdate()
  const auto = useMemo(() => {
    const auto = new Auto({
      onDirty() {
        if (isDev) {
          addDebugAction(auto, 'dirty')
        }
        const { observer } = auto
        // If no observer exists, our `component` is either unmounted
        // or its first render is not committed yet. In the latter case,
        // the reconciled nonce will soon be validated in a layout effect.
        if (!observer) {
          return
        }
        // The `dirty` flag is reset when our `component` rerenders,
        // which means this `onDirty` function can be called again,
        // before this batched update is ever processed.
        batch.render(depth, () => {
          // When the observer changes before the batch can be flushed,
          // we bail out to avoid using the nonce of a value no longer observed.
          if (observer == auto.observer) {
            if (observer.nonce > auto.nonce) {
              if (isDev) {
                addDebugAction(auto, 'batch')
              }
              forceUpdate()
            } else {
              auto.dirty = false
            }
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
  }, [])

  if (isDev) {
    getDebug(auto).renders!++
    if (globals.onRender) {
      globals.onRender(auto, depth, component)
    }
  }

  useDispose(() => auto.dispose())
  return {
    auto,
    depth,
    commit(observer: AutoObserver, nonce: number) {
      if (isDev) {
        getDebug(auto).actions = []
      }
      // The `nonce` from the render phase will force an update
      // if any observed values have changed since then.
      if (!auto.commit(observer, nonce)) {
        if (isDev) {
          addDebugAction(auto, 'dirty')
        }
        forceUpdate()
      } else if (isDev) {
        addDebugAction(auto, 'observe')
      }
    },
  }
}
