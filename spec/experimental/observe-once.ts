import { Auto } from 'wana'

/**
 * Observe only on the first run, then rerun the same effect
 * when an observed value is changed.
 */
export function observeOnce(effect: (firstRun: boolean) => void) {
  const auto = new Auto()
  const observer = auto.start(effect)
  try {
    effect(true)
  } finally {
    auto.stop()
  }
  observer.onChange = () => effect(false)
  observer.observed.forEach(observable => {
    observable.add(observer)
  })
  return {
    dispose() {
      observer.observed.forEach(observable => {
        observable.delete(observer)
      })
    },
  }
}
