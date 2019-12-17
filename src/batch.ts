import queueMicrotask from 'queue-microtask'
import { Auto, AutoObserver } from './auto'
import { global } from './global'

type Effect = () => void

/** The FIFO queue of async `Auto` updates */
let runQueue: RunConfig[] = []
type RunConfig = { auto: Auto; observer: AutoObserver }

/** The queue of `withAuto` updates. Sorted by deepest child last */
const renderQueue: RenderConfig[] = []
type RenderConfig = { depth: number; effect: Effect }

export interface Batch {
  /**
   * The "run" step only works with async `Auto` objects.
   * The `rerun` method is called on the next microtask.
   *
   * While running, derived `Auto` objects may be added to the batch.
   * The "run" step lasts until all derived `Auto` objects are updated,
   * or the run count exceeds 100k.
   */
  run(auto: Auto): void
  /**
   * The "render" step is sorted by `withAuto` depth.
   * After the "run" step, all `Auto` objects are updated, and `withAuto`
   * components can render now.
   */
  render(depth: number, effect: Effect): void
}

export const batch: Batch = {
  run(auto) {
    // Cache the "observer" so we can abort extraneous runs.
    runQueue.push({ auto, observer: auto.observer! })
    flushAsync()
  },
  render(depth, effect) {
    let i = renderQueue.findIndex(other => other.depth > depth)
    if (i < 0) i = renderQueue.length
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
  global.batchedUpdates(() => {
    // Run any pending reactions.
    let runs = 0
    for (const { auto, observer } of runQueue) {
      if (++runs > 1e5) {
        break // Limit to 100k runs per flush.
      }
      if (auto.observer == observer) {
        auto.rerun()
      }
    }

    // Postpone remaining runs until next flush.
    runQueue = runQueue.slice(runs)

    // Stale components always rerender after reactions.
    renderQueue.forEach(({ effect }) => effect())
    renderQueue.length = 0
  })

  return !!(runQueue.length || renderQueue.length)
}
