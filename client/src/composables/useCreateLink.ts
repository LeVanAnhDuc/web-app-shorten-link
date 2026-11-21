import { useMutation } from '@tanstack/vue-query'
import type { AxiosError } from 'axios'
import { apiClient } from '@/lib/axios'
import type { LinkDto } from '@/types'

async function createLink(url: string): Promise<LinkDto> {
  const { data } = await apiClient.post<LinkDto>('/api/links', { url })
  return data
}

/** POST /api/links. Never retried — a retry could create a second link (standard-vue). */
export function useCreateLink() {
  return useMutation<LinkDto, AxiosError, string>({
    mutationFn: createLink,
    retry: false,
  })
}
