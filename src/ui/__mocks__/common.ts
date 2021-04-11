import { batchedUpdates } from 'react-batched-updates'

const {
  RenderAction,
  useForceUpdate: _useForceUpdate,
  useConstant,
  useDispose,
} = jest.requireActual('../common.ts')

export { RenderAction, useConstant, useDispose }

export function useForceUpdate() {
  const forceUpdate = _useForceUpdate()
  return () => batchedUpdates(forceUpdate)
}
