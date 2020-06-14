import { Auto, AutoObserver } from './auto'

interface Props {
  observer?: AutoObserver
  mounted?: boolean
}

/**
 * Call the returned function to set the "mounting state" for the
 * given `Auto` object. Observation is postponed until mounted.
 */
export function mountAuto(auto: Auto) {
  let mounted = false
  let observer: AutoObserver
  let nonce = 0

  // XXX: Never call this with both `observer` and `mounted` props.
  return (props: Props) => {
    if (props.observer) {
      observer = props.observer
      if (!mounted) {
        nonce = observer.nonce
      }
      // The observer might already be committed.
      else if (observer != auto.observer) {
        auto.commit(observer)
      }
    } else {
      mounted = props.mounted!
      if (observer) {
        if (!mounted) {
          nonce = observer.nonce
          auto.dispose()
        }
        // Reuse the observer if no dependencies have changed.
        else if (!auto.commit(observer, nonce)) {
          auto.clear()
        }
      }
    }
  }
}
