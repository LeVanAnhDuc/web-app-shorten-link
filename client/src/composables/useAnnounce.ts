import { nextTick, readonly, ref } from 'vue'

const message = ref('')

/**
 * One app-wide live region (rendered in App.vue) for screen-reader
 * announcements — standard-accessibility §3. Pass already-translated text.
 */
export function useAnnounce() {
  async function announce(text: string): Promise<void> {
    // Clear first so repeating the same text is announced again.
    message.value = ''
    await nextTick()
    message.value = text
  }

  return { announcement: readonly(message), announce }
}
