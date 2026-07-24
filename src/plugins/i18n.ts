import { createI18n } from 'vue-i18n'

const messages = {
  en: {
    app: {
      title: 'Shorten Link',
    },
    common: {
      submit: 'Submit',
      cancel: 'Cancel',
    },
  },
  vi: {
    app: {
      title: 'Rút gọn liên kết',
    },
    common: {
      submit: 'Gửi',
      cancel: 'Hủy',
    },
  },
}

export const i18n = createI18n({
  legacy: false,
  locale: 'en',
  fallbackLocale: 'en',
  messages,
})
