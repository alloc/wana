import { isDev } from '@alloc/is-dev'
import { getCurrentAuto } from '../debug'
import { globals } from '../globals'
import { useAutoDepth } from '../ui/context'
import { logRender } from './logRender'

// Track which component began rendering most recently.
let lastComponent: React.ComponentType | undefined

if (isDev) {
  const { onRender } = globals
  globals.onRender = (auto, depth, component) => {
    lastComponent = component
    if (onRender) {
      onRender(auto, depth, component)
    }
  }
}

export function useRenderLog() {
  const depth = useAutoDepth()
  if (isDev) {
    const auto = getCurrentAuto()
    if (!auto || !lastComponent) {
      throw Error('Cannot call "useRenderLog" outside a "withAuto" component')
    }
    logRender(auto, depth, lastComponent)
  }
}
