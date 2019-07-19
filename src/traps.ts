import { emptyArray, hasOwn, nope, todo } from './common'
import { observe } from './global'
import { ArrayIterators, MapIterators, SetIterators } from './iterators'
import { Change } from './observable'
import { $$, $O, $P, SIZE } from './symbols'

const emit = (target: object, change: Change) => (target[$O].emit(change), true)
const emitAdd = (target: object, key: any, value: any) =>
  emit(target, { op: 'add', target, key, value })
const emitRemove = (target: object, key: any, oldValue: any) =>
  emit(target, { op: 'remove', target, key, oldValue })
const emitReplace = (target: object, key: any, value: any, oldValue: any) =>
  emit(target, { op: 'replace', target, key, value, oldValue })
const emitSplice = (
  target: any[],
  key: number,
  value: readonly any[],
  oldValue: readonly any[]
) => emit(target, { op: 'splice', target, key, value, oldValue })
const emitClear = <T extends Set<any> | Map<any, any>>(
  target: T,
  oldValue: T
) => emit(target, { op: 'clear', target, oldValue })

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

const ObjectTraps: ProxyHandler<object> = {
  has: (self, key) => (
    // TODO: Avoid observing "replace" events here.
    observe(self, key), Reflect.has(self, key)
  ),
  get(self, key) {
    // Avoid observing inherited keys.
    if (hasOwn(self, key) || self[key] === void 0) {
      if (key === $$) return self
      if (key !== $P) observe(self, key)
    }
    return self[key]
  },
  set: setProperty,
  deleteProperty,
  preventExtensions: nope,
}

const ArrayTraps: ProxyHandler<any[]> = {
  has: ObjectTraps.has,
  get: (self, key) => (
    key === 'length' && observe(self, SIZE),
    ArrayOverrides[key] || (key === $$ ? self : self[key])
  ),
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

interface ArrayOverrides {
  copyWithin(this: any[], target: number, start: number, end?: number): this
  fill(this: any[], value: number, start?: number, end?: number): this
  pop(this: any[]): any
  push(this: any[], ...values: any[]): number
  reverse(this: any[]): this
  shift(this: any[]): any
  sort(this: any[], compare?: (a: any, b: any) => number): this
  splice(
    this: any[],
    start: number,
    removeCount: number | undefined,
    ...values: any[]
  ): any[]
  unshift(this: any[], ...items: any[]): number
}

const ArrayOverrides: ArrayOverrides = {
  ...ArrayIterators,
  copyWithin: todo,
  fill: todo,
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
  push(...values: any[]) {
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
  sort(compare) {
    const self: any[] = this[$$]
    const oldValue = [...self]
    self.sort(compare)
    emitSplice(self, 0, [...self], oldValue)
    return this
  },
  splice(start, removeCount = 0, ...values) {
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

const MapTraps: ProxyHandler<any> = {
  get: (self, key) => (
    key === 'size' && observe(self, SIZE),
    MapOverrides[key] || (key === $$ ? self : self[key])
  ),
}

interface MapOverrides {
  has(this: Map<any, any>, key: any): boolean
  get(this: Map<any, any>, key: any): any
  set(this: Map<any, any>, key: any, value: any): this
  delete(this: Map<any, any>, key: any): boolean
  clear(this: Map<any, any>): void
}

const MapOverrides: MapOverrides = {
  ...MapIterators,
  has(key) {
    const self: Map<any, any> = this[$$]
    // TODO: Avoid observing "replace" events here.
    observe(self, key)
    return self.has(key)
  },
  get(key) {
    const self: Map<any, any> = this[$$]
    observe(self, key)
    return self.get(key)
  },
  set(key, value) {
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
  delete(key) {
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

const SetTraps: ProxyHandler<any> = {
  get: (obj, key) => (
    key === 'size' && observe(obj, SIZE),
    SetOverrides[key] || (key === $$ ? obj : obj[key])
  ),
}

interface SetOverrides {
  has(this: Set<any>, value: any): boolean
  add(this: Set<any>, value: any): this
  delete(this: Set<any>, value: any): boolean
  clear(this: Set<any>): void
}

const SetOverrides: SetOverrides = {
  ...SetIterators,
  has(value) {
    const self: Set<any> = this[$$]
    observe(self, SIZE)
    return self.has(value)
  },
  add(value) {
    const self: Set<any> = this[$$]
    const oldSize = self.size
    self.add(value)
    if (oldSize !== self.size) {
      emitAdd(self, void 0, value)
      emitReplace(self, SIZE, oldSize + 1, oldSize)
    }
    return this
  },
  delete(value) {
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

export const traps = {
  Object: ObjectTraps,
  Array: ArrayTraps,
  Map: MapTraps,
  Set: SetTraps,
}
