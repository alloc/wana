export interface Disposable {
  /** Release any memory that would otherwise leak */
  dispose: () => void
}

export const emptyArray: readonly any[] = Object.freeze([])

export const setHidden = (obj: any, key: any, value: any) =>
  Object.defineProperty(obj, key, { value, configurable: true })

export const isArray = Array.isArray

export const isMap = (value: unknown): value is Map<unknown, unknown> =>
  value instanceof Map

export const isObject = (value: unknown): value is object =>
  value && typeof value == 'object'

export const isFunction = (value: unknown): value is (...args: any[]) => any =>
  typeof value == 'function'

export const isUndefined = (value: unknown): value is undefined =>
  value === void 0

export function rethrowError(error: Error) {
  throw error
}

export const noop = () => {}

export const nope = () => false

export const flop: any = () => {
  throw Error('Not yet implemented')
}

export const hasOwn = Function.call.bind({}.hasOwnProperty) as (
  obj: object,
  key: keyof any
) => boolean

export const getOwnDescriptor = Object.getOwnPropertyDescriptor

export function getDescriptor(self: object, key: any) {
  let desc: PropertyDescriptor | undefined
  let proto = self
  do {
    if ((desc = getOwnDescriptor(proto, key))) {
      return desc
    }
  } while ((proto = Object.getPrototypeOf(proto)))
}
