import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { Lazyload } from 'vant'
import App from './App.vue'
import router from './router'

// Global design tokens & overrides
import './style.css'

// Vant styles (but nav-bar and tabbar hidden via CSS overrides)
import 'vant/lib/index.css'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)
app.use(Lazyload)

app.mount('#app')
