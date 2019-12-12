import { useEffect, useRef, useState } from 'react'
import { useMemoOne as useMemo } from 'use-memo-one'
import { emptyArray } from '../common'

/** This lets a component determine if its render has been reconciled. */
export const RenderAction = ({ useAction }: { useAction: () => void }) => (
  useAction(), null
)

/** Return a function that re-renders this component, if still mounted */
export const useForceUpdate = () => {
  const update = useState<any>(0)[1]
  const unmounted = useRef(false)
  useDispose(() => (unmounted.current = true))
  return () => {
    if (!unmounted.current) {
      update({})
    }
  }
}

export const useConstant = <T>(create: () => T) => useMemo(create, emptyArray)

export const useDispose = (dispose: () => void) =>
  useEffect(() => dispose, emptyArray)
