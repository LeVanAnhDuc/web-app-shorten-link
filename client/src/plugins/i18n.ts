import { createI18n } from 'vue-i18n'
import en from '@/locales/en.json'
import vi from '@/locales/vi.json'

export type MessageSchema = typeof en
export type AppLocale = 'en' | 'vi'

export const SUPPORTED_LOCALES: readonly AppLocale[] = ['en', 'vi']
export const DEFAULT_LOCALE: AppLocale = 'en'

export const i18n = createI18n<[MessageSchema], AppLocale>({
  legacy: false,
  locale: DEFAULT_LOCALE,
  fallbackLocale: DEFAULT_LOCALE,
  messages: { en, vi },
})
