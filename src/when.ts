import { Auto } from './auto'
import { noto } from './noto'

/**
 * Create a promise to resolve when the given condition returns true.
 * Any observable access in the condition is tracked.
 */
export const when = (condition: () => boolean): Promise<void> =>
  new Promise((resolve, reject) => {
    const auto = new Auto({
      onDirty() {
        if (noto(() => this.run(condition))) {
          this.dispose()
          resolve()
        }
      },
      onError(error) {
        this.dispose()
        reject(error)
      },
    })
    auto.onDirty()
  })
