import { useEffect, useMemo, useReducer } from 'react'
import { emptyArray } from '../common'

export const useForceUpdate = () =>
  useReducer(() => ({}), {})[1] as (() => void)

export const useConstant = <T>(create: () => T) => useMemo(create, emptyArray)

export const useDispose = (dispose: () => void) =>
  useEffect(() => dispose, emptyArray)
