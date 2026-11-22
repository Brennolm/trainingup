import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useCallback } from 'react'
import { authApi } from './authApi'
import type { User } from './types'

export const ME_QUERY_KEY = ['me'] as const

/** The signed-in user (null when signed out). Cached by TanStack Query. */
export function useMe() {
  return useQuery({ queryKey: ME_QUERY_KEY, queryFn: authApi.me, retry: false, staleTime: 5 * 60_000 })
}

/** Replace the cached user after login, verification or profile changes. */
export function useSetMe() {
  const queryClient = useQueryClient()
  return useCallback((user: User | null) => queryClient.setQueryData(ME_QUERY_KEY, user), [queryClient])
}
