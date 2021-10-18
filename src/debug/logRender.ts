import { Auto } from '../auto'
import { getDebug } from '../debug'

export function logRender(
  auto: Auto,
  depth: number,
  component: React.ComponentType<any> & { __render?: any }
) {
  if (!component.displayName) {
    console.warn(
      'Component without "displayName" is harder to debug',
      component.__render || component
    )
  }
  const indent = ' '.repeat(depth)
  const debug = getDebug(auto)
  console.debug(indent + '<' + debug.name + ' />', '⚛️' + debug.renders, [
    ...debug.actions!,
  ])
}
