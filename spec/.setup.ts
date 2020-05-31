import { act } from '@testing-library/react'
import { unstable_batchedUpdates } from 'react-dom'
import { Auto } from '../src/auto'
import { batch } from '../src/batch'
import { globals } from '../src/globals'

globals.batchedUpdates = unstable_batchedUpdates

const { render } = batch
batch.render = (depth, effect) => {
  render(depth, () => act(effect))
}

const { run } = Auto.prototype
Auto.prototype.run = function(compute) {
  return run.call(this, () => {
    let result: any
    act(() => {
      result = compute()
    })
    return result
  })
}
