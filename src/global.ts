export const global: {
  observe: ((target: object, key: any) => void) | null
} = {
  observe: null,
}

/** Tell the current observer to track the given object/key pair  */
export const observe = (obj: object, key: any) =>
  !!global.observe && (global.observe(obj, key), true)

/** Run an effect and track any observable values it uses */
export function track<T>(
  effect: () => T,
  observe: (target: object, key: any) => void
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
export function untracked<T>(effect: () => T): T {
  const oldValue = global.observe
  global.observe = null
  try {
    return effect()
  } finally {
    global.observe = oldValue
  }
}
