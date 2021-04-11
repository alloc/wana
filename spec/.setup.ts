import { act } from '@testing-library/react'
import { setBatchedUpdates } from 'react-batched-updates'

setBatchedUpdates(effect => void act(effect))

// Inject batchedUpdates into useForceUpdate
jest.mock('../src/ui/common.ts')
