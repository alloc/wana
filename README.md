# wana

[![npm](https://img.shields.io/npm/v/wana.svg)](https://www.npmjs.com/package/wana)
[![Build status](https://travis-ci.org/alloc/wana.svg?branch=master)](https://travis-ci.org/alloc/wana)
[![codecov](https://codecov.io/gh/alloc/wana/branch/master/graph/badge.svg)](https://codecov.io/gh/alloc/wana)
[![Bundle size](https://badgen.net/bundlephobia/min/wana)](https://bundlephobia.com/result?p=wana)
[![Code style: Prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg)](https://github.com/prettier/prettier)
[![Donate](https://img.shields.io/badge/Donate-PayPal-green.svg)](https://paypal.me/alecdotbiz)

Observable state with ease. ⚡️

Bring your React components to the next level. ⚛️

- **Transparent proxies** (no special classes)
- **Implicit observation** (use your objects like normal)
- **Observable objects, arrays, sets, and maps** (even custom classes)
- **Automatic reactions to observable changes** (see the `auto/useAuto/withAuto` functions)
- **Support for deep observation** (see the `watch` function)
- **Memoized derivations** (see the `o/useDerived` functions)
- **Prevent unnecessary renders**
- **80% less SLOC than MobX**

&nbsp;

**Why build this?** The goal of this library is to explore the MobX approach of
writing React components by designing a new API from the ground up with React in
mind from the get-go. Another goal is to keep a lean core by writing an observability
engine from scratch.

**Who built this?** [Alec Larson](https://twitter.com/alecdotbiz), the co-author of
`react-spring` and `immer`. You can support his work by [becoming a patron](https://www.patreon.com/aleclarson).

&nbsp;

## API Reference

- `o()` for making observable objects
- `auto()` for reactive effects
- `when()` for reactive promises
- `no()` for unobserved objects
- `noto()` for unobserved scopes
- `watch()` for listening to deep changes
- `withAuto()` for reactive components
- `useAuto()` for easy `auto` calls in components
- `useO()` for observable component state
- `useDerived()` for observable getters
- `useChanges()` for change listeners
- `useEffects()` for reactive mounting/unmounting of effects

&nbsp;

### o ⚡️

The `o` function wraps an object with an observable proxy (sorry, no IE11 support). These proxies are transparent, which means they look and act just like the object they wrap. The only difference is that now they're observable!

Even custom class instances can be wrapped with an observable proxy!

Passing the same object into `o` twice always returns the same proxy.

By wrapping a function with `o`, you get an observable getter, which memoizes its result until one of its observed values is changed. Calling an observable getter triggers an observation! To prevent leaks, call the `dispose` method before releasing an observable getter.

Passing an observable getter into `o` is a no-op.

Passing a primitive value into `o` is a no-op.

**Note:** Nested objects are **not** made observable. You'll need to wrap them with `o` calls too.

```ts
import { o } from 'wana'

const state: any[] = o([])
const state = o({ a: 1 })
const state = o(new Set())
const state = o(new Map())
```

&nbsp;

### auto ⚡️

The `auto` function runs the given effect immediately and tracks which observables are used. Upon changes to any of those observables, `auto` repeats the same process.

It does its best to react only to changes that affect its outcome.

```ts
import { o, auto } from 'wana'

const state = o({ count: 0 })

const observer = auto(() => {
  console.log(state.count % 2 ? 'odd' : 'even')
}) // logs "even"

state.count++ // logs "odd"
state.count++ // logs "even"

// Remember to call "dispose" to stop observing.
observer.dispose()
```

The `auto` function accepts a config object:

  - `sync?: boolean`
  - `onError?: (this: Auto, error: Error) => void`

By default, reactions are batched using the [microtask queue](https://javascript.info/microtask-queue). When `sync` is true, batching is skipped entirely.

By default, `auto` errors are rethrown. To customize error handling, provide an `onError` callback.

```ts
auto(effect, {
  onError(error) {
    // The `run` method lets you replace the effect.
    this.run(newEffect)
  }
})
```

&nbsp;

### when ️️⚡️

The `when` function creates a promise that resolves when the given condition returns true.

Any observable access within the condition is tracked. The condition is rerun whenever a change is detected.

```ts
import { o, when } from 'wana'

const obj = o({ count: 0 })
const promise = when(() => obj.count > 1)

obj.count++ // "promise" stays pending
obj.count++ // "promise" is resolved
```

The promise is rejected when the condition throws an error.

&nbsp;

### no ⚡️

The `no` function takes any observable object and returns the underlying object that isn't observable.

```ts
import { o, auto, no } from 'wana'

const obj = o({ a: 1, b: 2 })
auto(() => {
  // This will only be logged once.
  console.log(no(obj).a + no(obj).b)
})

// This change will not be observed.
obj.a = 2
```

Pass a function to wrap it with a new function that disables implicit observation for each call.
If the wrapped function is used as a method, it has its `this` value preserved.

```ts
const state = o({
  count: 1,
})

const increment = no((n: number) => {
  state.count = state.count + n
})

auto(() => {
  increment(1) // Nothing will be observed in here.
})

assert(state.count == 2)
```

Pass anything else and you get the same value back.

&nbsp;

### noto ⚡️

The `noto` function (pronounced "not oh") is the **exact opposite** of the `auto` function.
The function you pass to `noto` is called immediately (with implicit observation disabled)
and whatever you return is passed through. Your function is never called again after that.

```ts
import { o, auto, noto } from 'noto'

const state = o({ count: 0 })

// Create an auto observer.
auto(() => {
  // Do something you want observed.
  noto(() => {
    // Do something you don't want observed.
  })
})
```

It's also useful inside methods of an observable object:

```ts
const state = o({
  count: 0,
  // Calling "increment" in an observable scope does
  // *not* result in "count" being observed.
  increment() {
    noto(() => this.count++)
  }
})
```

&nbsp;

### watch ⚡️

The `watch` function lets you listen for deep changes within an observable object.

```ts
import { o, watch } from 'wana'

const obj = o({ arr: o([]) })
const observer = watch(obj, change => console.log('changed:', change))

// Every observable object in `obj` is watched.
obj.x = true
obj.arr.push(1)

// You can even add new observables!
const foo = o({})
obj.arr.push(foo)
foo.x = true

// Call "dispose" to stop observing.
observer.dispose()
```

**Note:** When an object is made observable *after* being added to a watched object, it won't be watched. Be sure you pass objects to `o()` before adding them to a watched object!

&nbsp;

### withAuto ⚛️

The `withAuto` function wraps a React component, giving it the ability to track which observables are used during render. Upon changes to any of those observables, `withAuto` re-renders the component.

For convenience, you can add a `ref` argument to your component, and `withAuto` will wrap it with `React.forwardRef` for you. ✨

**Note:** Class components are *not* supported.

```tsx
import { o, withAuto } from 'wana'

const MyView = withAuto(props => (
  <div>{props.user.name}</div>
))

const user = o({ name: 'Alec' })
const view = <MyView user={user} /> // renders "Alec"

user.name = 'Alice' // renders "Alice"
```

&nbsp;

### useAuto ⚛️

The `useAuto` hook calls `auto` within a `useEffect` callback, allowing you to run an effect in response to observable changes.

```tsx
import { useAuto } from 'wana'

const MyView = props => {
  useAuto(() => {
    console.log(props.user.name)
  })
  return null
}

const user = o({ name: 'John Lennon' })
const view = <MyView user={user} /> // logs "John Lennon"

user.name = 'Yoko Ono' // logs "Yoko Ono"
```

By passing two functions, the 1st function will be observed and the 2nd function will run whenever the 1st function's result is a new value. The 2nd function is **never** observed.

```tsx
// Usually, you will ignore the returned `Auto` instance, but it can be useful in some cases.
const auto = useAuto(
  // Derive a value from 1+ observables.
  () => props.user.name,
  // Run an effect when the derived value is changed.
  name => {
    console.log(name)
  },
  // Pass dependencies to avoid running on rerender.
  // The memoized value is reset when a dependency changes.
  [props.user]
)
```

&nbsp;

### useO ⚛️

The `useO` hook memoizes an observable object. When a non-observable object is passed, it gets wrapped with the `o` function.

```ts
import { useO } from 'wana'

const state = useO({ a: 1 })

assert(state.a == 1)
```

When a `deps` array is passed, its values are compared with the previous render. If any values have changed, the memoized state is replaced with whatever object you passed in. When no `deps` array is passed, the state is never replaced.

```ts
const state = useO(new Set(), deps)
```

When a function is passed, the function is called as if it were passed to `React.useMemo`, which means it will only be called again if any values in the `deps` array are changed.

```ts
const state = useO(() => [1, 2, 3], deps)

assert(state[0] == 1)
```

When a plain object is passed, its properties are scanned for "observable getters" (created with `useDerived` or `o`). In this case, these functions are converted into actual getters.

```ts
const state = useO({
  a: 1,
  b: useDerived(() => state.a + 1)
})

assert(state.b == 2)
```

&nbsp;

### useDerived ⚛️

The `useDerived` hook creates an observable getter. You can pass a deps array as the last argument if you want to mix non-observable props into the memoized value.

```tsx
import { o, useDerived, useAuto } from 'wana'

const state = o({ count: 0 })

const MyView = props => {
  const foo = useDerived(() => state.count + props.foo, [props.foo])
  useAuto(() => {
    console.log('foo:', foo())
  })
  return <div />
}
```

&nbsp;

### useChanges ⚛️

The `useChanges` hook lets you listen for `Change` events on an observable object. Only shallow changes are reported.

```tsx
import { o, useChanges } from 'wana'

const state = o({ count: 0 })

const MyView = () => {
  useChanges(state, console.log)
  return null
}
```

&nbsp;

### useEffects ⚛️

The `useEffects` hook works differently depending on the type of object you pass it.

For arrays and sets, an effect is mounted for each **unique value**. When a unique
value is added, an effect is mounted. When removed, its effect is unmounted, using
the cleanup function returned by its effect.

```tsx
import { o, useEffects } from 'wana'

const arr = o([ 1, 2 ])

const MyView = () => {
  useEffects(arr, value => {
    console.log('Added value:', value)
    return () => {
      console.log('Removed value:', value)
    }
  })
  return null
}
```

For maps and plain objects, an effect is mounted for each **unique key**. When a
unique key is added, an effect is mounted. When removed, its effect is unmounted,
using the cleanup function returned by its effect. Whenever a key's value is
replaced, the effect is remounted.

```tsx
import { o, useEffects } from 'wana'

const obj = o({ a: 1, b: 2 })

const MyView = () => {
  useEffects(obj, (value, key) => {
    console.log('Added key/value:', key, '=>', value)
    return () => {
      console.log('Removed key/value:', key, '=>', value)
    }
  })
  return null
}
```

&nbsp;

## Donate

If you love this library, please donate! I have no income currently, because I'm working full-time on a startup. Any amount is greatly appreciated. 🥰

- ETH: **0xa446626195bbe4d0697e729c1433a86fB6Cf66cF**
- BTC: **17vYtAUPKXzubMEnNcN8SiuFgicrd5Rp9A**
- KIN: **GBU7RDRD7VDVT254RR6PGMBJESXQVDHJ5CGGODZKRXM2P4MP3G5QSAMH**
