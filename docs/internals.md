## Quirks

- `Array`, `Set`, and `Map` objects are wholly observed when iterated with inherited methods like `forEach`

- `Array` indices are *not* individually observable

- Even though `Array`, `Set`, and `Map` instances are objects, their properties are *not* observable (except the special `length` and `size` properties)

- Some interactions with observable objects will **not** trigger observation. These interactions include:
  - spread syntax (eg: `[...array]` or `fn(...array)` or `{...object}`)
  - `{Array,Map,Set}.prototype.{keys,values,entries}` calls
  - `Object.{keys,values,entries}` calls
  - `Array.prototype.concat` calls
  - `Array.from` calls

## `Change` events

- The `target` property is always the original object, instead of its observable proxy

- `Array` mutations that affect a contiguous range at once only generate a "splice" event, instead of many "add" and/or "remove" events

- The `clear` method of `Set` and `Map` generates a single "clear" event, instead of many "remove" events
