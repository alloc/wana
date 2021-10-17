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

## Exports

- `o()` for making observable objects
- `auto()` for reactive effects
- `when()` for reactive promises
- `no()` for unobserved objects
- `noto()` for unobserved scopes
- `watch()` for listening to deep changes
- `shallowChanges()` for listening to shallow changes
- `withAuto()` for reactive components
- `useAuto()` for easy `auto` calls in components
- `useO()` for observable component state
- `useDerived()` for observable getters
- `useChanges()` for change listeners
- `useEffects()` for reactive mounting/unmounting of effects
- `useBinding()` for situations where `withAuto` is too invasive

The API reference can be found here:  
https://github.com/alloc/wana/wiki/API-Reference

Many of `wana`'s exports are tree-shakeable. 🌲

&nbsp;


&nbsp;

## Donate

If you love this library, please donate! I have no income currently, because I'm working full-time on a startup. Any amount is greatly appreciated. 🥰

- ETH: **0xa446626195bbe4d0697e729c1433a86fB6Cf66cF**
- BTC: **17vYtAUPKXzubMEnNcN8SiuFgicrd5Rp9A**
- KIN: **GBU7RDRD7VDVT254RR6PGMBJESXQVDHJ5CGGODZKRXM2P4MP3G5QSAMH**
