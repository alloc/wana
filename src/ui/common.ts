import { useEffect, useMemo, useState } from 'react'
import { useMemoOne } from 'use-memo-one'
import { emptyArray } from '../common'

/** This lets a component determine if its render has been reconciled. */
export const RenderAction = ({ useAction }: { useAction: () => void }) => (
  useAction(), null
)

/** Return a function that re-renders this component, if still mounted */
export function useForceUpdate() {
  const update = useState<any>()[1]
  const mounted = useMemo(makeMountedRef, [])
  useEffect(mounted.unmount, emptyArray)
  return () => {
    if (mounted.current) {
      update({})
    }
  }
}

function makeMountedRef() {
  const mounted = {
    current: true,
    unmount: () => () => {
      mounted.current = false
    },
  }
  return mounted
}

export const useConstant = <T>(create: () => T) =>
  useMemoOne(create, emptyArray)

export const useDispose = (dispose: () => void) =>
  useEffect(() => dispose, emptyArray)
