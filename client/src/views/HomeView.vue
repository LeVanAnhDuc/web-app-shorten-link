<script setup lang="ts">
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
</script>

<template>
  <div>
    <h1 class="mb-2 text-[31.25px] font-bold leading-tight">{{ t('home.title') }}</h1>
    <!-- DR-12: no QR mention until F3 ships it -->
    <p class="mb-6 max-w-[70ch] text-base text-[rgb(var(--v-theme-on-surface-variant))]">
      {{ t('home.subtitleNoQr') }}
    </p>

    <section aria-labelledby="features-heading" class="mt-12">
      <h2 id="features-heading" class="sr-only">{{ t('features.heading') }}</h2>
      <!-- DR-12: F3 adds features.qr, F5 adds features.alias -->
      <ul class="m-0 grid list-none gap-3 p-0 text-sm text-[rgb(var(--v-theme-on-surface-variant))]">
        <li class="flex items-center gap-2.5">
          <v-icon icon="mdi-incognito" color="primary" size="20" aria-hidden="true" />
          {{ t('features.anonymous') }}
        </li>
      </ul>
    </section>
  </div>
</template>
