import { useEffect } from 'react'
import { Auto } from '../auto'
import { useConstant, useDispose } from './common'

/** Run an effect when implicit dependencies are changed */
export function useAuto(effect: React.EffectCallback, deps?: readonly any[]) {
  const auto = useConstant(() => new Auto())
  useDispose(() => auto.dispose())
  useEffect(() => auto.run(effect), deps)
  return auto
}
