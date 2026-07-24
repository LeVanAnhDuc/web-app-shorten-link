import './assets/main.css'
import './assets/tailwind.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'

import { vuetify } from './plugins/vuetify'
import { VueQueryPlugin, vueQueryPluginOptions } from './plugins/vue-query'
import { i18n } from './plugins/i18n'

const app = createApp(App)

app.use(createPinia())
app.use(router)
app.use(vuetify)
app.use(VueQueryPlugin, vueQueryPluginOptions)
app.use(i18n)

app.mount('#app')
