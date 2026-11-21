<script setup lang="ts">
import { nextTick, ref } from 'vue'
import type { VTextField } from 'vuetify/components'
import { useI18n } from 'vue-i18n'
import { useForm } from 'vee-validate'
import { isAxiosError } from 'axios'
import { useAnnounce } from '@/composables/useAnnounce'
import { useCreateLink } from '@/composables/useCreateLink'
import { shortenFormSchema } from '@/schemas/link'
import { toFormSchema } from '@/schemas/to-form-schema'
import type { LinkDto } from '@/types'

const emit = defineEmits<{ created: [link: LinkDto] }>()

const { t } = useI18n()
const { announce } = useAnnounce()
const { mutateAsync, isPending } = useCreateLink()

const { defineField, errors, handleSubmit, setFieldError } = useForm({
  validationSchema: toFormSchema(shortenFormSchema),
  initialValues: { url: '' },
})
// Validate on submit only; typing clears a shown error instead of re-validating.
const [url, urlAttrs] = defineField('url', { validateOnModelUpdate: false })

const networkError = ref(false)
const urlField = ref<InstanceType<typeof VTextField> | null>(null)
/** Set synchronously so a second click cannot slip in during async validation. */
let inFlight = false

function clearUrlError(): void {
  if (errors.value.url) setFieldError('url', undefined)
}

/** Send keyboard and screen-reader users to the field that holds the error. */
function focusUrlField(): void {
  urlField.value?.focus()
}

/** Re-open the snackbar even if it is still showing from a previous failure. */
async function showNetworkError(): Promise<void> {
  networkError.value = false
  await nextTick()
  networkError.value = true
}

const submitValid = handleSubmit(
  async (values) => {
    try {
      const link = await mutateAsync(values.url)
      networkError.value = false
      emit('created', link)
    } catch (error) {
      // Any 400 means the server refused the URL (e.g. it points at the shortener, DR-5).
      if (isAxiosError(error) && error.response?.status === 400) {
        setFieldError('url', 'error.url.invalid')
        focusUrlField()
        void announce(t('error.url.invalid'))
      } else {
        await showNetworkError()
        void announce(t('error.network'))
      }
    }
  },
  () => focusUrlField(),
)

async function onSubmit(event: Event): Promise<void> {
  if (inFlight) return
  inFlight = true
  try {
    await submitValid(event)
  } finally {
    inFlight = false
  }
}
</script>

<template>
  <form class="flex flex-wrap items-start gap-2" novalidate @submit.prevent="onSubmit">
    <v-text-field
      ref="urlField"
      v-model="url"
      v-bind="urlAttrs"
      class="min-w-0 flex-[1_1_320px]"
      :label="t('form.url.label')"
      :hint="t('form.url.hint')"
      persistent-hint
      :error-messages="errors.url ? t(errors.url) : []"
      :aria-invalid="errors.url ? 'true' : undefined"
      type="url"
      inputmode="url"
      autocomplete="url"
      spellcheck="false"
      autocapitalize="off"
      @update:model-value="clearUrlError"
    />
    <v-btn
      type="submit"
      color="primary"
      size="large"
      height="48"
      class="w-full sm:w-auto"
      prepend-icon="mdi-link-variant"
      :loading="isPending"
    >
      {{ t('form.submit') }}
    </v-btn>
  </form>

  <v-snackbar v-model="networkError" color="error" :timeout="6000">
    <span class="flex items-center gap-2">
      <v-icon icon="mdi-alert-circle-outline" aria-hidden="true" />
      {{ t('error.network') }}
    </span>
  </v-snackbar>
</template>
