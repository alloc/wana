import { act } from '@testing-library/react'
import { Auto } from '../src/auto'

const onDelay = Auto.prototype['_onDelay']
Auto.prototype['_onDelay'] = function(update) {
  onDelay.call(this, () => void act(update))
}
