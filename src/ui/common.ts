import { useEffect, useReducer } from 'react'
import { useMemoOne as useMemo } from 'use-memo-one'
import { emptyArray } from '../common'

export const useForceUpdate = () =>
  useReducer(() => ({}), {})[1] as (() => void)

export const useConstant = <T>(create: () => T) => useMemo(create, emptyArray)

export const useDispose = (dispose: () => void) =>
  useEffect(() => dispose, emptyArray)
