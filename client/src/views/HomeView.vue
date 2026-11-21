<script setup lang="ts">
import { nextTick, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import LinkTicket from '@/components/LinkTicket.vue'
import ShortenForm from '@/components/ShortenForm.vue'
import { useAnnounce } from '@/composables/useAnnounce'
import type { LinkDto } from '@/types'

const { t } = useI18n()
const { announce } = useAnnounce()

const link = ref<LinkDto | null>(null)
const resultSection = ref<HTMLElement | null>(null)

async function onCreated(created: LinkDto): Promise<void> {
  link.value = created
  await nextTick()
  // Focus the result so screen readers land on it (standard-accessibility §4).
  resultSection.value?.focus()
  void announce(t('a11y.created', { shortUrl: created.shortUrl }))
}
</script>

<template>
  <div>
    <h1 class="mb-2 text-[31.25px] font-bold leading-tight">{{ t('home.title') }}</h1>
    <!-- DR-12: no QR mention until F3 ships it -->
    <p class="mb-6 max-w-[70ch] text-base text-[rgb(var(--v-theme-on-surface-variant))]">
      {{ t('home.subtitleNoQr') }}
    </p>

    <ShortenForm @created="onCreated" />

    <section
      v-if="link"
      ref="resultSection"
      class="result mt-8"
      tabindex="-1"
      aria-labelledby="result-heading"
    >
      <h2 id="result-heading" class="mb-3 text-xl font-bold">{{ t('result.heading') }}</h2>
      <LinkTicket :key="link.code" :link="link" />
    </section>

    <section v-else aria-labelledby="features-heading" class="mt-12">
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

<style scoped>
/* Focus is moved here programmatically for screen readers; it is not a control. */
.result:focus {
  outline: none;
}
</style>
