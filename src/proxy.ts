import { is } from '@alloc/is'
import {
  emptyArray,
  flop,
  getDescriptor,
  getOwnDescriptor,
  hasOwn,
  nope,
  setHidden,
} from './common'
import {
  emitAdd,
  emitClear,
  emitDefine,
  emitRemove,
  emitReplace,
  emitSplice,
} from './emit'
import { globals, observe } from './globals'
import { ArrayIterators, MapIterators, SetIterators } from './iterators'
import { noto } from './noto'
import { $$, $O, SIZE } from './symbols'

const ArrayOverrides: any = {
  concat(...args: any[]) {
    const self: any[] = this[$$]
    observe(self)
    args.forEach(arg => {
      arg = arg && arg[$$]
      if (is.array(arg)) {
        observe(arg)
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

export const ObjectTraps: ProxyHandler<object> = {
  has: (self, key) => (
    // TODO: Avoid observing "replace" events here.
    observe(self, key), Reflect.has(self, key)
  ),
  get(self, key, proxy) {
    if (key === $$) return self
    if (key !== $O) {
      const desc = getDescriptor(self, key)
      const get = desc && desc.get
      if (get) {
        return get.call(proxy)
      }
      // Observe unknown keys and own keys only.
      if (!desc || hasOwn(self, key)) {
        observe(self, key)
      }
    }
    return self[key]
  },
  set(self, key, value, proxy) {
    const desc = getDescriptor(self, key)
    return desc && desc.get
      ? Reflect.set(self, key, value, proxy)
      : setProperty(self, key, value)
  },
  defineProperty(self, key, desc) {
    const prevDesc = getOwnDescriptor(self, key)
    return Reflect.defineProperty(self, key, desc) &&
      (desc.get || (prevDesc && prevDesc.get))
      ? emitDefine(self, key, desc, prevDesc)
      : prevDesc
      ? desc.value === prevDesc.value ||
        emitReplace(self, key, desc.value, prevDesc.value)
      : emitAdd(self, key, desc.value)
  },
  deleteProperty,
  preventExtensions: nope,
}

export const ArrayTraps: ProxyHandler<any[]> = {
  has: ObjectTraps.has,
  get(self: any, key: keyof any) {
    if (key === $$) return self
    if (key === 'length') {
      observe(self, SIZE)
      return self[key]
    }
    return (
      ArrayOverrides[key] ||
      (globals.observe && ArrayIterators[key]) ||
      self[key]
    )
  },
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

export class ObservableMap<K, V> extends Map<K, V> {
  [$$]!: Map<K, V>

  constructor(source: Map<K, V>) {
    super()
    setHidden(this, $$, source)
  }

  get [$O]() {
    return this[$$][$O]
  }

  get size() {
    observe(this[$$], SIZE)
    return this[$$].size
  }

  has(key: K) {
    // TODO: Avoid observing "replace" events here.
    observe(this[$$], key)
    return this[$$].has(key)
  }

  get(key: K) {
    observe(this[$$], key)
    return this[$$].get(key)
  }

  set(key: K, value: V) {
    const exists = this[$$].has(key)
    const oldValue = exists ? this[$$].get(key) : void 0
    if (!exists || value !== oldValue) {
      this[$$].set(key, value)
      if (exists) {
        emitReplace(this[$$], key, value, oldValue)
      } else {
        const oldSize = this[$$].size
        emitAdd(this[$$], key, value)
        emitReplace(this[$$], SIZE, oldSize + 1, oldSize)
      }
    }
    return this
  }

  delete(key: K) {
    const oldSize = this[$$].size
    const oldValue = this[$$].get(key)
    return (
      this[$$].delete(key) &&
      emitRemove(this[$$], key, oldValue) &&
      emitReplace(this[$$], SIZE, oldSize - 1, oldSize)
    )
  }

  clear() {
    const oldSize = this[$$].size
    if (oldSize) {
      const oldValues = new Map(this[$$])
      this[$$].clear()
      emitClear(this[$$], oldValues)
      emitReplace(this[$$], SIZE, 0, oldSize)
    }
  }
}

export class ObservableSet<T> extends Set<T> {
  [$$]!: Set<T>

  constructor(source: Set<T>) {
    super()
    setHidden(this, $$, source)
  }

  get [$O]() {
    return this[$$][$O]
  }

  get size() {
    observe(this, SIZE)
    return this[$$].size
  }

  has(value: T) {
    observe(this[$$], SIZE)
    return this[$$].has(value)
  }

  add(value: T) {
    const oldSize = this[$$].size
    this[$$].add(value)
    if (oldSize !== this[$$].size) {
      emitAdd(this[$$], void 0, value)
      emitReplace(this[$$], SIZE, oldSize + 1, oldSize)
    }
    return this
  }

  delete(value: T) {
    const oldSize = this[$$].size
    return (
      this[$$].delete(value) &&
      emitRemove(this[$$], void 0, value) &&
      emitReplace(this[$$], SIZE, oldSize - 1, oldSize)
    )
  }

  clear() {
    const oldSize = this[$$].size
    if (oldSize) {
      const oldValues = new Set(this[$$])
      this[$$].clear()
      emitClear(this[$$], oldValues)
      emitReplace(this[$$], SIZE, 0, oldSize)
    }
  }
}

defineMethods(ObservableMap, MapIterators)
defineMethods(ObservableSet, SetIterators)

function defineMethods(Class: any, overrides: { [key: string]: any }) {
  Object.defineProperties(
    Class.prototype,
    Object.getOwnPropertyDescriptors(overrides)
  )
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
