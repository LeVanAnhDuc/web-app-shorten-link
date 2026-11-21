import { watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useTheme } from 'vuetify'
import { DEFAULT_LOCALE, SUPPORTED_LOCALES, type AppLocale } from '@/plugins/i18n'

type ThemeName = 'light' | 'dark'

const THEME_KEY = 'shorten-link:theme'
const LOCALE_KEY = 'shorten-link:locale'

/** localStorage can throw (private mode, blocked cookies) — preferences then live for the session only. */
function readStored(key: string): string | null {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

function writeStored(key: string, value: string): void {
  try {
    localStorage.setItem(key, value)
  } catch {
    // Storage unavailable: keep the choice in memory only.
  }
}

function systemTheme(): ThemeName {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function isLocale(value: string | null): value is AppLocale {
  return value !== null && (SUPPORTED_LOCALES as readonly string[]).includes(value)
}

/**
 * Theme and language for the whole app (DR-7): theme defaults to the OS
 * preference, language to English; an explicit choice is remembered.
 * Call once, in App.vue.
 */
export function usePreferences() {
  const theme = useTheme()
  const { locale } = useI18n()

  const storedTheme = readStored(THEME_KEY)
  theme.global.name.value =
    storedTheme === 'light' || storedTheme === 'dark' ? storedTheme : systemTheme()

  const storedLocale = readStored(LOCALE_KEY)
  locale.value = isLocale(storedLocale) ? storedLocale : DEFAULT_LOCALE

  watch(
    locale,
    (value) => {
      document.documentElement.lang = value
    },
    { immediate: true },
  )

  function toggleTheme(): void {
    const next: ThemeName = theme.global.current.value.dark ? 'light' : 'dark'
    theme.global.name.value = next
    writeStored(THEME_KEY, next)
  }

  function toggleLocale(): void {
    const next: AppLocale = locale.value === 'en' ? 'vi' : 'en'
    locale.value = next
    writeStored(LOCALE_KEY, next)
  }

  return { theme, locale, toggleTheme, toggleLocale }
}
