import { globals } from './globals'

let nextDebugId = 1

const $D = Symbol.for('wana:debug')

interface DebugState {
  name: string
  actions?: any[]
  renders?: number
}

/** Get the `Auto` object for the current `withAuto` component being rendered. */
export function getCurrentAuto() {
  return globals.auto
}

/**
 * Get the `DebugState` object of the `target` object.
 *
 * Returns `undefined` if target was never passed to `setDebug`.
 */
export function getDebug(target: object): DebugState {
  return target[$D]
}

/**
 * Set the `DebugState` object of the `target` object.
 */
export function setDebug<T>(target: T, debug: DebugState) {
  debug.name += '#' + nextDebugId++
  target[$D] = debug
  return target
}

/** Safely add an action to a `DebugState` object */
export function addDebugAction(target: any, action: any) {
  const debug = getDebug(target)
  if (debug && debug.actions) {
    debug.actions.push(action)
  }
}
