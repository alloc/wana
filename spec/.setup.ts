import { act } from '@testing-library/react'
import { setBatchedUpdates } from 'react-batched-updates'

setBatchedUpdates(effect => void act(effect))
