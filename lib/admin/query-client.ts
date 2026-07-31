import { QueryClient } from '@tanstack/react-query'
import { cache } from 'react'

// One QueryClient per request on the server (React `cache()` dedupes within
// a single render pass); the QueryClientProvider below creates its own
// browser-side instance on mount.
export const getQueryClient = cache(() => new QueryClient({
  defaultOptions: {
    queries: { staleTime: 0, retry: 1 },
  },
}))
