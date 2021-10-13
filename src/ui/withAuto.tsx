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
  if (isDev) {
    const name = /^[A-Z]/.test(render.name) ? render.name : 'Unknown'
    component = toNamedComponent(name, component, render, inferSourceURL())
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

let renderVars: any = null

function toNamedComponent(
  name: string,
  component: React.FunctionComponent<any>,
  render: Function,
  sourceURL?: string
) {
  // The name may have been injected with a Babel plugin,
  // which may result in a naming conflict that is resolved
  // by appending a number. This can be safely removed.
  name = name.replace(/[0-9]+$/, '')

  // Convert `component` into a named function.
  let code = `return function ${name} ${component
    .toString()
    .replace('=>', '')
    .replace('component', name)}`

  const isESM = typeof exports == 'undefined'
  if (sourceURL) {
    // Exclude the querystring in SSR environments, so that
    // stack traces point to the real file path.
    if (isESM && typeof process == 'undefined') {
      sourceURL += (sourceURL.includes('?') ? '&' : '?') + `wana=${name}`
    }
    code += `\n//# sourceURL=${sourceURL}`
  }

  return new Function(
    `render`,
    `{${Object.keys(
      (renderVars ||= {
        useAutoRender,
        RenderAction,
        AutoContext,
        ...(isESM
          ? { useLayoutEffect, React }
          : {
              // CommonJS bindings
              reactLayoutEffect: { useLayoutEffect },
              React__namespace: React,
            }),
      })
    )}}`,
    code
  )(render, renderVars)
}

function inferSourceURL() {
  const frame = new Error()
    .stack!.split('\n')
    .slice(1)
    .find(frame => !frame.includes('/wana/'))
  const match = frame?.match(/at (\S+):\d+:\d+/)
  return match?.[1]
}
