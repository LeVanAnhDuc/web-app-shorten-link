import 'vuetify/styles'
import '@mdi/font/css/materialdesignicons.css'

import { createVuetify, type ThemeDefinition } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import { aliases, mdi } from 'vuetify/iconsets/mdi'

// Token values from docs/design-system/shorten-link/MASTER.md — change them there first.
const light: ThemeDefinition = {
  dark: false,
  colors: {
    background: '#F7F8FA',
    surface: '#FFFFFF',
    'on-surface': '#1A1F3D',
    'on-surface-variant': '#565D77',
    primary: '#23306B',
    'on-primary': '#FFFFFF',
    stub: '#F4C542',
    'on-stub': '#1A1F3D',
    outline: '#8A90A8',
    divider: '#D9DCE5',
    error: '#B42318',
    success: '#1E7A4C',
    warning: '#B54708',
    info: '#23306B',
  },
}

const dark: ThemeDefinition = {
  dark: true,
  colors: {
    background: '#12142A',
    surface: '#1B1E38',
    'on-surface': '#ECEEF6',
    'on-surface-variant': '#A3A8C3',
    primary: '#9DB0FF',
    'on-primary': '#12142A',
    stub: '#E9B935',
    'on-stub': '#1A1F3D',
    outline: '#6B7194',
    divider: '#2E3254',
    error: '#F97066',
    success: '#5BC88A',
    warning: '#FDB022',
    info: '#9DB0FF',
  },
}

export const vuetify = createVuetify({
  components,
  directives,
  icons: { defaultSet: 'mdi', aliases, sets: { mdi } },
  theme: { defaultTheme: 'light', themes: { light, dark } },
  defaults: {
    VBtn: { variant: 'flat', rounded: 'md', class: 'text-none' },
    VCard: { variant: 'flat', rounded: 'lg' },
    VTextField: { variant: 'outlined', density: 'comfortable', rounded: 'md' },
    VSnackbar: { location: 'bottom', rounded: 'lg' },
  },
})
