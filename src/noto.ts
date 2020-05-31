import { globals } from './globals'

/** Run an effect without any observable tracking */
export function noto<T>(effect: () => T): T {
  const { auto, observe } = globals
  globals.auto = null
  globals.observe = null
  try {
    return effect()
  } finally {
    globals.auto = auto
    globals.observe = observe
  }
}
