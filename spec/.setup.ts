import { act } from '@testing-library/react'
import { unstable_batchedUpdates } from 'react-dom'
import { batch } from '../src/batch'
import { global } from '../src/global'

global.batchedUpdates = unstable_batchedUpdates

const { render } = batch
batch.render = (depth, effect) => {
  render(depth, () => act(effect))
}
