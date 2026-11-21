import { z } from 'zod'

/** Longest URL accepted, measured after trimming — same as the server (DR-4). */
export const MAX_URL_LENGTH = 2048

const EXPLICIT_HTTP_SCHEME = /^https?:\/\//i
/** Last DNS label: letters, or an IDN A-label (`xn--…`). */
const TOP_LEVEL_LABEL = /^(?:[a-z]{2,63}|xn--[a-z0-9-]{1,59})$/
const IPV4 = /^\d{1,3}(?:\.\d{1,3}){3}$/

/**
 * DR-4, client side: absolute http(s) URL on a public domain — not localhost,
 * not an intranet name, not an IP literal. The server also refuses its own
 * host (DR-5); the client cannot know it, so that check is server-only.
 */
export function isPublicHttpUrl(value: string): boolean {
  if (!EXPLICIT_HTTP_SCHEME.test(value)) return false
  let url: URL
  try {
    url = new URL(value)
  } catch {
    return false
  }
  const hostname = url.hostname
  if (hostname.startsWith('[') || IPV4.test(hostname)) return false
  const labels = hostname.split('.')
  const last = labels.at(-1)
  return labels.length >= 2 && last !== undefined && TOP_LEVEL_LABEL.test(last)
}

/** Messages are i18n keys, translated where they are rendered. */
export const shortenFormSchema = z.object({
  url: z
    .string()
    .trim()
    .min(1, { error: 'error.url.required' })
    .max(MAX_URL_LENGTH, { error: 'error.url.invalid' })
    .refine(isPublicHttpUrl, { error: 'error.url.invalid' }),
})

export type ShortenFormValues = z.output<typeof shortenFormSchema>
