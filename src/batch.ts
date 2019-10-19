import queueMicrotask from 'queue-microtask'
import { Auto, AutoObserver } from './auto'

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
    runQueue.push({ auto, observer: auto.lastObserver! })
    flush()
  },
  render(depth, effect) {
    let i = renderQueue.findIndex(other => other.depth > depth)
    if (i < 0) i = renderQueue.length
    renderQueue.splice(i, 0, { depth, effect })
    flush()
  },
}

/** Equals true when `queueMicrotask` has been called */
let flushing = false

function flush() {
  if (!flushing) {
    flushing = true
    queueMicrotask(() => {
      let runs = 0
      for (const { auto, observer } of runQueue) {
        if (++runs > 1e5) break // Break infinite loops.
        if (auto.lastObserver == observer) {
          auto.rerun()
        }
      }
      runQueue = runQueue.slice(runs)
      renderQueue.forEach(({ effect }) => effect())
      renderQueue.length = 0
      flushing = false
      if (runQueue.length) {
        flush()
      }
    })
  }
}
