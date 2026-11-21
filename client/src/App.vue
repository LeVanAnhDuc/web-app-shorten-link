<script setup lang="ts">
import { computed } from 'vue'
import { RouterView } from 'vue-router'
import { useI18n } from 'vue-i18n'
import AppHeader from '@/components/AppHeader.vue'
import { useAnnounce } from '@/composables/useAnnounce'
import { usePreferences } from '@/composables/usePreferences'

const { t } = useI18n()
const { theme, toggleTheme, toggleLocale } = usePreferences()
const { announcement } = useAnnounce()

const isDark = computed(() => theme.global.current.value.dark)
</script>

<template>
  <v-app>
    <a
      href="#main"
      class="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-[rgb(var(--v-theme-surface))] focus:px-4 focus:py-2"
    >
      {{ t('app.skipToMain') }}
    </a>
    <AppHeader :is-dark="isDark" @toggle-theme="toggleTheme" @toggle-locale="toggleLocale" />
    <main id="main" tabindex="-1" class="mx-auto w-full max-w-[720px] px-4 pb-16 pt-6">
      <RouterView />
    </main>
    <div id="announcer" class="sr-only" aria-live="polite" aria-atomic="true">{{ announcement }}</div>
  </v-app>
</template>
