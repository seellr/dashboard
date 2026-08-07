import { useQuery } from '@tanstack/react-query'
import { adminFetchClient } from '@/lib/admin/api-client'

export interface AdminUser {
  ulid: string
  first_name: string
  last_name: string
  email: string
  is_super_admin: boolean
  roles: string[]
}

export function useAdminMe() {
  return useQuery({
    queryKey: ['admin', 'me'],
    queryFn: async () => {
      const result = await adminFetchClient<AdminUser>('/auth/me')
      if (!result.ok) throw new Error(result.message)
      return result.data
    },
    staleTime: 5 * 60_000,
  })
}
