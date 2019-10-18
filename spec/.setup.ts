import { act } from '@testing-library/react'
import { batch } from '../src/batch'

const { render } = batch
batch.render = (depth, effect) => {
  render(depth, () => act(effect))
}
