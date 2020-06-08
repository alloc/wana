import { is } from '@alloc/is'
import { useEffect } from 'react'
import { Auto } from '../auto'
import { globals } from '../globals'
import { no } from '../no'
import { useConstant, useDispose } from './common'
import { useDerived } from './useDerived'

type Deps = readonly any[]
type EffectReturn = void | (() => void | undefined)

/** Wrap a `useEffect` call with magic observable tracking */
export function useAuto(effect: () => EffectReturn, deps?: Deps): Auto

/**
 * Combine a `useEffect` call with an `Auto` instance that invokes an
 * unobserved side `effect` when the `compute` function returns a new value.
 */
export function useAuto<T>(
  compute: () => T,
  effect: (value: T) => EffectReturn,
  deps?: Deps
): Auto

/** @internal */
export function useAuto(
  computeOrEffect: () => unknown,
  effectOrDeps?: Function | Deps,
  deps?: Deps
) {
  const auto = useConstant(() => new Auto())
  useDispose(() => auto.dispose())

  let effect: () => EffectReturn
  if (is.function(effectOrDeps)) {
    const compute = useDerived(computeOrEffect, deps)
    effect = () => no(effectOrDeps as any)(compute())
  } else {
    effect = computeOrEffect as any
    deps = effectOrDeps as any
  }

  useEffect(
    () =>
      globals.batchedUpdates(() => {
        auto.run(effect)
      }),
    deps
  )
  return auto
}
