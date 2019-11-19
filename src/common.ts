export interface Disposable {
  /** Release any memory that would otherwise leak */
  dispose: () => void
}

export const emptyArray: readonly any[] = Object.freeze([])

export const setHidden = (obj: any, key: any, value: any) =>
  Object.defineProperty(obj, key, { value, configurable: true })

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
