import { is } from '@alloc/is'
import { useEffect } from 'react'
import { batchedUpdates } from 'react-batched-updates'
import { Auto } from '../auto'
import { Falsy } from '../common'
import { no } from '../no'
import { useConstant, useDispose } from './common'
import { useDerived } from './useDerived'

type Deps = readonly any[]
type EffectReturn = void | (() => void | undefined)

/** Wrap a `useEffect` call with magic observable tracking */
export function useAuto(effect: () => EffectReturn, deps?: Deps): Auto

/** Wrap a `useEffect` call with magic observable tracking */
export function useAuto(
  effect: (() => EffectReturn) | Falsy,
  deps?: Deps
): Auto | null

/**
 * Combine a `useEffect` call with an `Auto` instance that invokes an
 * unobserved side `effect` when the `compute` function returns a new value.
 */
export function useAuto<T>(
  compute: () => T,
  effect: (value: T) => EffectReturn,
  deps?: Deps
): Auto

/**
 * Combine a `useEffect` call with an `Auto` instance that invokes an
 * unobserved side `effect` when the `compute` function returns a new value.
 */
export function useAuto<T>(
  compute: (() => T) | Falsy,
  effect: (value: T) => EffectReturn,
  deps?: Deps
): Auto | null

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
      batchedUpdates(() => {
        auto.run(effect)
      }),
    deps
  )
  return auto
}
