import { global } from './global'

/** Run an effect without any observable tracking */
export function noto<T>(effect: () => T): T {
  const { auto, observe } = global
  global.auto = null
  global.observe = null
  try {
    return effect()
  } finally {
    global.auto = auto
    global.observe = observe
  }
}
