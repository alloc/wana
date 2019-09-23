import { useEffect } from 'react'
import { Auto } from '../auto'
import { useConstant, useDispose, useForceUpdate } from './common'

export function createHook<T extends object>(state: Exclude<T, Function>) {
  return function() {
    const onDirty = useForceUpdate()
    const auto = useConstant(() => new Auto({ lazy: true, onDirty }))
    useDispose(() => auto.dispose())
    useEffect(() => {
      if (!auto.commit()) onDirty()
    })
    return auto.wrap(state, true)
  }
}
