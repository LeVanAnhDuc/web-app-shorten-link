<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAnnounce } from '@/composables/useAnnounce'
import type { LinkDto } from '@/types'

const props = defineProps<{ link: LinkDto }>()

const COPIED_FEEDBACK_MS = 2000

const { t } = useI18n()
const { announce } = useAnnounce()

/** Shown without the scheme; Copy still copies the full URL (DR-8). */
const displayShortUrl = computed(() => props.link.shortUrl.replace(/^https?:\/\//, ''))

const copied = ref(false)
const snackbar = ref<{ open: boolean; text: string; color: 'success' | 'error' }>({
  open: false,
  text: '',
  color: 'success',
})
let resetTimer: ReturnType<typeof setTimeout> | undefined

async function copy(): Promise<void> {
  try {
    await navigator.clipboard.writeText(props.link.shortUrl)
    copied.value = true
    clearTimeout(resetTimer)
    resetTimer = setTimeout(() => (copied.value = false), COPIED_FEEDBACK_MS)
    snackbar.value = { open: true, text: t('action.copied'), color: 'success' }
    void announce(t('action.copied'))
  } catch {
    snackbar.value = { open: true, text: t('error.copy'), color: 'error' }
    void announce(t('error.copy'))
  }
}

onBeforeUnmount(() => clearTimeout(resetTimer))
</script>

<template>
  <div class="ticket">
    <div class="ticket__original">
      <p class="m-0 flex items-center gap-1.5 text-[12.8px] text-[rgb(var(--v-theme-on-surface-variant))]">
        <v-icon icon="mdi-link" size="16" aria-hidden="true" />
        {{ t('result.original') }}
      </p>
      <p data-testid="ticket-original" class="ticket__long-url font-code" :title="link.originalUrl">
        {{ link.originalUrl }}
      </p>
    </div>

    <div class="ticket__perforation" aria-hidden="true" />

    <div class="ticket__stub">
      <div class="min-w-0">
        <p data-testid="ticket-code" class="ticket__code font-code m-0">{{ link.code }}</p>
        <p data-testid="ticket-short-url" class="font-code m-0 mt-1.5 break-all text-sm">
          {{ displayShortUrl }}
        </p>
      </div>
      <v-btn
        color="on-stub"
        class="self-start"
        min-height="44"
        :prepend-icon="copied ? 'mdi-check' : 'mdi-content-copy'"
        :aria-label="t('a11y.copyCode', { code: link.code })"
        @click="copy"
      >
        {{ copied ? t('action.copied') : t('action.copy') }}
      </v-btn>
    </div>
  </div>

  <v-snackbar v-model="snackbar.open" :color="snackbar.color" :timeout="COPIED_FEEDBACK_MS">
    {{ snackbar.text }}
  </v-snackbar>
</template>

<style scoped>
/* The tear-off stub — MASTER.md "Signature element". Custom chrome, not a restyled v-* component. */
.ticket {
  display: grid;
  grid-template-columns: 1fr 24px 1.1fr;
}

.ticket__original {
  min-width: 0;
  padding: 24px;
  background: rgb(var(--v-theme-surface));
  border: 1px solid rgb(var(--v-theme-divider));
  border-right: 0;
  border-radius: 10px 0 0 10px;
}

.ticket__long-url {
  margin: 8px 0 0;
  font-size: 13px;
  line-height: 1.6;
  color: rgb(var(--v-theme-on-surface-variant));
  word-break: break-all;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.ticket__perforation {
  position: relative;
  background: rgb(var(--v-theme-stub));
  mask:
    radial-gradient(circle 9px at 50% 0, #0000 98%, #000) top / 100% 51% no-repeat,
    radial-gradient(circle 9px at 50% 100%, #0000 98%, #000) bottom / 100% 51% no-repeat;
}

.ticket__perforation::after {
  content: '';
  position: absolute;
  left: 50%;
  top: 14px;
  bottom: 14px;
  border-left: 2px dashed rgb(var(--v-theme-on-stub) / 0.4);
  transform: translateX(-1px);
}

.ticket__stub {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 24px 24px 24px 12px;
  background: rgb(var(--v-theme-stub));
  color: rgb(var(--v-theme-on-stub));
  border-radius: 0 10px 10px 0;
}

.ticket__code {
  font-size: 32px;
  font-weight: 600;
  line-height: 1.1;
  letter-spacing: 0.02em;
}

/* The one motion moment: the stub slides out when a link is created. */
.ticket__stub,
.ticket__perforation {
  animation: ticket-printout 240ms cubic-bezier(0.2, 0, 0, 1) both;
}

@keyframes ticket-printout {
  from {
    transform: translateX(-16px);
    opacity: 0;
  }
  to {
    transform: none;
    opacity: 1;
  }
}

@media (prefers-reduced-motion: reduce) {
  .ticket__stub,
  .ticket__perforation {
    animation: none;
  }
}

@media (max-width: 599px) {
  .ticket {
    grid-template-columns: 1fr;
  }

  .ticket__original {
    border-right: 1px solid rgb(var(--v-theme-divider));
    border-bottom: 0;
    border-radius: 10px 10px 0 0;
  }

  .ticket__perforation {
    height: 24px;
    mask:
      radial-gradient(circle 9px at 0 50%, #0000 98%, #000) left / 51% 100% no-repeat,
      radial-gradient(circle 9px at 100% 50%, #0000 98%, #000) right / 51% 100% no-repeat;
  }

  .ticket__perforation::after {
    left: 14px;
    right: 14px;
    top: 50%;
    bottom: auto;
    border-left: 0;
    border-top: 2px dashed rgb(var(--v-theme-on-stub) / 0.4);
    transform: translateY(-1px);
  }

  .ticket__stub {
    padding: 16px 24px 24px;
    border-radius: 0 0 10px 10px;
  }
}
</style>
