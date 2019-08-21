# wana

[![npm](https://img.shields.io/npm/v/wana.svg)](https://www.npmjs.com/package/wana)
[![Build status](https://travis-ci.org/alloc/wana.svg?branch=master)](https://travis-ci.org/alloc/wana)
[![codecov](https://codecov.io/gh/alloc/wana/branch/master/graph/badge.svg)](https://codecov.io/gh/alloc/wana)
[![Bundle size](https://badgen.net/bundlephobia/min/wana)](https://bundlephobia.com/result?p=wana)
[![Code style: Prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg)](https://github.com/prettier/prettier)
[![Donate](https://img.shields.io/badge/Donate-PayPal-green.svg)](https://paypal.me/alecdotbiz)

Observable state with ease. ⚡️

Bring your React components to the next level. ⚛️

- **Transparent proxies** (no special classes!)
- **Implicit observation** (use your objects like normal!)
- **Observable arrays, sets, and maps**
- **Automatic effects**
- **Small footprint**

## API Reference

The entirety of `wana` is 8 functions:
- `o` for making observables
- `auto` for reactive effects
- `when` for reactive promises
- `noto` for unobserved access
- `watch` for listening to deep changes
- `withAuto` for reactive components
- `useAuto` for easy `auto` calls in components
- `useO` for observable component state

&nbsp;

### o ⚡️

The `o` function wraps an object with an observable proxy (sorry, no IE11 support). These proxies are transparent, which means they look and act just like the object they wrap. The only difference is that now they're observable!

You can pass anything to the `o` function, but functions and primitive values are merely pass-through, and thus won't be observable.

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
  console.log(state.count % 2 ? 'even' : 'odd')
}) // logs "even"

state.count++ // logs "odd"
state.count++ // logs "even"

// Remember to call "dispose" to stop observing.
observer.dispose()
```

The `auto` function accepts a config object:

  - `onError?: (this: Auto, error: Error) => void`
  - `delay?: number | boolean`

When `delay === true`, reactions are batched using the [microtask queue](https://javascript.info/microtask-queue). This is the default behavior.

When `delay > 0`, reactions are batched using `setTimeout`.

By default, `auto` errors are rethrown. When `delay <= 0`, reactions are synchronous, so the stack trace will show you which observable was changed before the error.

You should always provide an `onError` callback when `delay` is true. Otherwise, an unhandled promise rejection is imminent.

```ts
auto(effect, {
  delay: true,
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

### noto ⚡️

The `noto` function (pronounced "not oh") takes any observable object and returns the underlying object that isn't observable.

```ts
import { o, auto, noto } from 'wana'

const obj = o({ a: 1, b: 2 })
auto(() => {
  // This will only be logged once.
  console.log(noto(obj).a + noto(obj).b)
})

// This change will not be observed.
obj.a = 2
```

Pass a function to wrap it with a new function that disables implicit observation for each call.

```ts
const state = o({
  count: 1,
  increment: noto(function(n: number) {
    this.count = this.count + n
  })
})

auto(() => {
  // Nothing will be observed in here.
  state.increment(1)
})

state.count == 2 // => true
```

Pass anything else and you get the same value back.

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

&nbsp;

### useO ⚛️

The `useO` hook is very similar to `React.useMemo`, except the returned object is observable, the deps array is optional, and you can pass an object or a function (instead of only a function).

```ts
import { useO } from 'wana'

const MyView = props => {
  const state = useO({ a: 1 })
  const state = useO(new Set(), deps)
  const state = useO(() => [1, 2, 3])
  const state = useO(() => new Map(), deps)
}
```

&nbsp;

## Donate

If you love this library, please donate! I have no income currently, because I'm working full-time on a startup. Any amount is greatly appreciated. 🥰

- ETH: **0xa446626195bbe4d0697e729c1433a86fB6Cf66cF**
- BTC: **17vYtAUPKXzubMEnNcN8SiuFgicrd5Rp9A**
- KIN: **GBU7RDRD7VDVT254RR6PGMBJESXQVDHJ5CGGODZKRXM2P4MP3G5QSAMH**
