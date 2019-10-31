import { ObservedState } from './observable'

export const global: {
  observe: ((obj: ObservedState, key: any) => void) | null
} = {
  observe: null,
}

/** Tell the current observer to track the given object/key pair  */
export const observe = (obj: ObservedState, key: any) =>
  !!global.observe && (global.observe(obj, key), true)
