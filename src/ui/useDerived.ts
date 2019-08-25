import { useEffect } from 'react'
import { useMemoOne as useMemo } from 'use-memo-one'
import { emptyArray } from '../common'
import { derive } from '../derive'
import { $$ } from '../symbols'
import { useDispose } from './common'

export function useDerived<T extends any[], U>(
  fn: (...args: T) => U,
  deps?: any[]
) {
  const derived = useMemo(() => derive(fn, true), deps || emptyArray)
  useDispose(derived.dispose)
  useEffect(() => {
    derived[$$].commit()
  })
  return derived
}
