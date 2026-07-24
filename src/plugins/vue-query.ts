import { VueQueryPlugin, QueryClient } from '@tanstack/vue-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
})

export const vueQueryPluginOptions = {
  queryClient,
}

export { VueQueryPlugin }
