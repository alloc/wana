import { useEffect, useReducer } from 'react'
import { useMemoOne as useMemo } from 'use-memo-one'
import { emptyArray } from '../common'

/** This lets a component determine if its render has been reconciled. */
export const RenderAction = ({ useAction }: { useAction: () => void }) => (
  useAction(), null
)

export const useForceUpdate = () => useReducer(() => ({}), {})[1] as () => void

export const useConstant = <T>(create: () => T) => useMemo(create, emptyArray)

export const useDispose = (dispose: () => void) =>
  useEffect(() => dispose, emptyArray)
