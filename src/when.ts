import { Auto } from './auto'

/**
 * Create a promise to resolve when the given condition returns true.
 * Any observable access in the condition is tracked.
 */
export const when = (condition: () => boolean): Promise<void> =>
  new Promise((resolve, reject) => {
    const check = () => auto.run(condition) && resolve()
    const auto = new Auto({ onDirty: check, onError: reject })
    check()
  })
