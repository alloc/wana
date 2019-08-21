import { ObservedState } from './observable'

export const global: {
  observe: ((obj: ObservedState, key: any) => void) | null
} = {
  observe: null,
}

/** Tell the current observer to track the given object/key pair  */
export const observe = (obj: ObservedState, key: any) =>
  !!global.observe && (global.observe(obj, key), true)

/** Run an effect and track any observable values it uses */
export function track<T>(
  effect: () => T,
  observe: (obj: ObservedState, key: any) => void
): T {
  if (global.observe) {
    throw Error('Recursive "track" calls are forbidden')
  }
  global.observe = observe
  try {
    return effect()
  } finally {
    global.observe = null
  }
}

/** Run an effect without any observable tracking */
export function untracked<T>(effect: () => T): T
export function untracked<T, This>(effect: (this: This) => T, self: This): T
export function untracked(effect: (this: any) => any, self?: any) {
  const oldValue = global.observe
  global.observe = null
  try {
    return effect.call(self)
  } finally {
    global.observe = oldValue
  }
}
