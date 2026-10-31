import { setupServer } from 'msw/node'
import { builderHandlers } from './handlers'

export const server = setupServer(...builderHandlers)
