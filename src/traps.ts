import is from '@alloc/is'
import { emptyArray, flop, getDescriptor, hasOwn, nope } from './common'
import { emitAdd, emitClear, emitRemove, emitReplace, emitSplice } from './emit'
import { global, observe } from './global'
import { ArrayIterators, MapIterators, SetIterators } from './iterators'
import { noto } from './noto'
import { $$, $O, SIZE } from './symbols'

const ObjectTraps: ProxyHandler<object> = {
  has: (self, key) => (
    // TODO: Avoid observing "replace" events here.
    observe(self, key), Reflect.has(self, key)
  ),
  get(self, key) {
    if (key === $$) return self
    if (key !== $O) {
      const desc = getDescriptor(self, key)
      const get = desc && desc.get
      if (get) {
        return get.call(self[$O].proxy)
      }
      // Observe unknown keys and own keys only.
      if (!desc || hasOwn(self, key)) {
        observe(self, key)
      }
    }
    return self[key]
  },
  set(self, key, value) {
    const desc = getDescriptor(self, key)
    return desc && desc.get
      ? desc.set
        ? (desc.set.call(self[$O].proxy, value), true)
        : false
      : setProperty(self, key, value)
  },
  deleteProperty,
  preventExtensions: nope,
}

const ArrayOverrides: any = {
  ...ArrayIterators,
  concat(...args: any[]) {
    const self: any[] = this[$$]
    observe(self, $O)
    args.forEach(arg => {
      arg = arg && arg[$$]
      if (is.array(arg)) {
        observe(arg, $O)
      }
    })
    return noto(() => self.concat(...args))
  },
  copyWithin: flop,
  fill: flop,
  pop() {
    const self: any[] = this[$$]
    const oldLength = self.length
    if (oldLength) {
      const index = oldLength - 1
      const exists = index in self
      const value = self.pop()
      if (exists) emitRemove(self, index, value)
      emitReplace(self, SIZE, index, oldLength)
      return value
    }
  },
  push(...values: any[]): number {
    const self: any[] = this[$$]
    const oldLength = self.length
    if (values.length) {
      const length = self.push(...values)
      emitSplice(self, oldLength, values, emptyArray)
      emitReplace(self, SIZE, length, oldLength)
      return length
    }
    return oldLength
  },
  reverse() {
    const self: any[] = this[$$]
    const oldValue = [...self]
    self.reverse()
    emitSplice(self, 0, [...self], oldValue)
    return this
  },
  shift() {
    const self: any[] = this[$$]
    const oldLength = self.length
    if (oldLength) {
      const exists = 0 in self
      const value = self.shift()
      if (exists) emitRemove(self, 0, value)
      emitReplace(self, SIZE, oldLength - 1, oldLength)
      return value
    }
  },
  sort(compare: (a: any, b: any) => number) {
    const self: any[] = this[$$]
    const oldValue = [...self]
    self.sort(compare)
    emitSplice(self, 0, [...self], oldValue)
    return this
  },
  splice(start: number, removeCount = 0, ...values: any[]): any[] {
    const self: any[] = this[$$]
    const oldLength = self.length
    if (start < 0) {
      start = Math.max(0, start + oldLength)
    } else if (start > oldLength) {
      start = oldLength
    }
    const removed = self.splice(start, removeCount, ...values)
    removeCount = removed.length
    const addCount = values.length
    if (addCount || removeCount) {
      const delta = addCount - removeCount
      emitSplice(self, start, values, [...removed])
      if (delta) emitReplace(self, SIZE, oldLength + delta, oldLength)
    }
    return removed
  },
  unshift(...values: any[]) {
    const self: any[] = this[$$]
    const oldLength = self.length
    if (values.length) {
      const length = self.unshift(...values)
      emitSplice(self, 0, values, emptyArray)
      emitReplace(self, SIZE, length, oldLength)
      return length
    }
    return oldLength
  },
}

const MapOverrides: any = {
  ...MapIterators,
  has(key: any) {
    const self: Map<any, any> = this[$$]
    // TODO: Avoid observing "replace" events here.
    observe(self, key)
    return self.has(key)
  },
  get(key: any) {
    const self: Map<any, any> = this[$$]
    observe(self, key)
    return self.get(key)
  },
  set(key: any, value: any) {
    const self: Map<any, any> = this[$$]
    const exists = self.has(key)
    const oldValue = exists ? self.get(key) : void 0
    if (!exists || value !== oldValue) {
      self.set(key, value)
      if (exists) {
        emitReplace(self, key, value, oldValue)
      } else {
        const oldSize = self.size
        emitAdd(self, key, value)
        emitReplace(self, SIZE, oldSize + 1, oldSize)
      }
    }
    return this
  },
  delete(key: any) {
    const self: Map<any, any> = this[$$]
    const oldSize = self.size
    const oldValue = self.get(key)
    return (
      self.delete(key) &&
      emitRemove(self, key, oldValue) &&
      emitReplace(self, SIZE, oldSize - 1, oldSize)
    )
  },
  clear() {
    const self: Map<any, any> = this[$$]
    const oldSize = self.size
    if (oldSize) {
      const oldValues = new Map(self)
      self.clear()
      emitClear(self, oldValues)
      emitReplace(self, SIZE, 0, oldSize)
    }
  },
}

const SetOverrides: any = {
  ...SetIterators,
  has(value: any) {
    const self: Set<any> = this[$$]
    observe(self, SIZE)
    return self.has(value)
  },
  add(value: any) {
    const self: Set<any> = this[$$]
    const oldSize = self.size
    self.add(value)
    if (oldSize !== self.size) {
      emitAdd(self, void 0, value)
      emitReplace(self, SIZE, oldSize + 1, oldSize)
    }
    return this
  },
  delete(value: any) {
    const self: Set<any> = this[$$]
    const oldSize = self.size
    return (
      self.delete(value) &&
      emitRemove(self, void 0, value) &&
      emitReplace(self, SIZE, oldSize - 1, oldSize)
    )
  },
  clear() {
    const self: Set<any> = this[$$]
    const oldSize = self.size
    if (oldSize) {
      const oldValues = new Set(self)
      self.clear()
      emitClear(self, oldValues)
      emitReplace(self, SIZE, 0, oldSize)
    }
  },
}

const ArrayTraps: ProxyHandler<any[]> = {
  has: ObjectTraps.has,
  get: withOverrides(ArrayOverrides, 'length'),
  set(self, key, value) {
    if (key === 'length') {
      const oldLength = self.length
      if (value !== oldLength) {
        const oldValues = self.slice(value)
        self.length = value
        emitReplace(self, SIZE, value, oldLength)
        if (value < oldLength) {
          emitSplice(self, value, emptyArray, oldValues)
        }
      }
    } else {
      const oldLength = self.length
      setProperty(self, key, value)
      if (oldLength !== self.length) {
        emitReplace(self, SIZE, self.length, oldLength)
      }
    }
    return true
  },
  deleteProperty,
  preventExtensions: nope,
}

const MapTraps: ProxyHandler<any> = {
  get: withOverrides(MapOverrides, 'size'),
}

const SetTraps: ProxyHandler<any> = {
  get: withOverrides(SetOverrides, 'size'),
}

export const traps = {
  Object: ObjectTraps,
  Array: ArrayTraps,
  Map: MapTraps,
  Set: SetTraps,
}

function setProperty(self: object, key: any, value: any) {
  const exists = hasOwn(self, key)
  const oldValue = self[key]
  self[key] = value
  return exists
    ? value === oldValue || emitReplace(self, key, value, oldValue)
    : emitAdd(self, key, value)
}

function deleteProperty(self: object, key: any) {
  if (!hasOwn(self, key)) return true
  const oldValue = self[key]
  delete self[key]
  return emitRemove(self, key, oldValue)
}

// All collection types have an observable size and a bunch of method overrides.
function withOverrides(overrides: any, sizeKey: string) {
  return (self: any, key: keyof any) =>
    key === $$
      ? self
      : (global.observe &&
          (key === sizeKey && observe(self, SIZE), overrides[key])) ||
        self[key]
}
