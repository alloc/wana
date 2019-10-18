declare module 'queue-microtask' {
  const queueMicrotask: (cb: () => void) => void
  export = queueMicrotask
}
