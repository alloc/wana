import { Auto } from './auto'

/**
 * Create a promise to resolve when the given condition returns true.
 * Any observable access in the condition is tracked.
 */
export const when = (condition: () => boolean): Promise<void> =>
  new Promise((resolve, reject) => {
    const auto = new Auto({
      onDirty() {
        if (this.run(condition)) {
          this.dispose()
          resolve()
        } else {
          this.commit(true)
        }
      },
      onError(error) {
        this.dispose()
        reject(error)
      },
    })
    auto.onDirty()
  })
