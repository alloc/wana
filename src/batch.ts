import queueMicrotask from 'queue-microtask'
import { globals } from './globals'

type Effect = () => void

/** The FIFO queue of async `Auto` updates */
let runQueue: Effect[] = []

/** The queue of `withAuto` updates. Sorted by deepest child last */
const renderQueue: RenderConfig[] = []
type RenderConfig = { depth: number; effect: Effect }

export interface Batch {
  /**
   * Run the given effect in the next microtask, immediately before
   * rendering any components with stale observations.
   *
   * To avoid infinite loops, the "run" step only runs the first 100,000
   * effects in any given microtask. Any remaining effects are scheduled
   * for the next microtask.
   */
  run(effect: Effect): void
  /**
   * The "render" step is sorted by `withAuto` depth.
   * After the "run" step, all `Auto` objects are updated, and `withAuto`
   * components can render now.
   */
  render(depth: number, effect: Effect): void
}

export const batch: Batch = {
  run(effect) {
    runQueue.push(effect)
    flushAsync()
  },
  render(depth, effect) {
    let i = renderQueue.findIndex(other => other.depth > depth)
    if (i < 0) i = renderQueue.length
    console.log('wana:batch:render', { depth })
    renderQueue.splice(i, 0, { depth, effect })
    flushAsync()
  },
}

let isQueued = false
function flushAsync() {
  if (!isQueued) {
    isQueued = true
    queueMicrotask(() => {
      isQueued = false
      if (flushSync()) {
        flushAsync()
      }
    })
  }
}

/**
 * Flush the queue of delayed reactions.
 *
 * Returns `true` if the queue wasn't flushed entirely.
 *
 * Useful when testing `wana`-integrated components/hooks.
 */
export function flushSync() {
  console.log('wana:flush:start', {
    pendingRuns: runQueue.length,
    pendingRenders: renderQueue.length,
  })
  globals.batchedUpdates(() => {
    // Run any pending reactions.
    let runs = 0
    for (const effect of runQueue) {
      if (++runs > 1e5) break
      effect()
    }

    // Postpone remaining runs until next flush.
    runQueue = runQueue.slice(runs)

    // Stale components always rerender after reactions.
    renderQueue.forEach(({ effect }) => effect())
    renderQueue.length = 0
  })
  console.log('wana:flush:end', {
    pendingRuns: runQueue.length,
    pendingRenders: renderQueue.length,
  })

  return !!(runQueue.length || renderQueue.length)
}
