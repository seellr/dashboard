import { setupWorker } from 'msw/browser'
import { builderHandlers } from './handlers'

export const worker = setupWorker(...builderHandlers)
