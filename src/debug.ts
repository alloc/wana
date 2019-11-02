import { global } from './global'

let nextDebugId = 1

const $D = Symbol.for('wana:debug')

interface DebugState {
  name: string
  actions: any[]
  renders: number
}

/** Get the `Auto` object for the current `withAuto` component being rendered. */
export function getCurrentAuto() {
  return global.auto
}

/** Unsafely get the `DebugState` object for the given target. */
export function getDebug(target: any): DebugState {
  return target[$D]
}

export function setDebug<T>(target: T, debug: DebugState) {
  debug.name += '#' + nextDebugId++
  target[$D] = debug
  return target
}
