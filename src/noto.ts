import { global } from './global'

/** Run an effect without any observable tracking */
export function noto<T>(effect: () => T): T {
  const oldValue = global.observe
  global.observe = null
  try {
    return effect()
  } finally {
    global.observe = oldValue
  }
}
