<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const props = defineProps<{ isDark: boolean }>()
const emit = defineEmits<{ toggleTheme: []; toggleLocale: [] }>()

const { t } = useI18n()

const themeLabel = computed(() => (props.isDark ? t('theme.toLight') : t('theme.toDark')))
const themeIcon = computed(() => (props.isDark ? 'mdi-white-balance-sunny' : 'mdi-weather-night'))
</script>

<template>
  <header class="mx-auto flex w-full max-w-[720px] items-center justify-between px-4 py-4">
    <div class="flex items-center gap-2 text-base font-bold">
      <v-icon icon="mdi-ticket-outline" color="primary" aria-hidden="true" />
      <span>{{ t('app.name') }}</span>
    </div>
    <div class="flex items-center gap-1">
      <v-btn variant="text" prepend-icon="mdi-translate" min-height="44" @click="emit('toggleLocale')">
        {{ t('lang.switch') }}
      </v-btn>
      <v-btn
        variant="text"
        :icon="themeIcon"
        :aria-label="themeLabel"
        min-width="44"
        min-height="44"
        @click="emit('toggleTheme')"
      />
    </div>
  </header>
</template>
