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

  return (props: Props) => {
    if (props.observer) {
      observer = props.observer
      if (mounted) {
        auto.commit(observer)
      } else {
        nonce = observer.nonce
      }
    } else {
      mounted = props.mounted!
      if (!mounted) {
        if (observer) {
          nonce = observer.nonce
        }
        auto.dispose()
      }
      // Reuse the observer if no dependencies have changed.
      else if (observer && !auto.commit(observer, nonce)) {
        auto.clear()
      }
    }
  }
}
