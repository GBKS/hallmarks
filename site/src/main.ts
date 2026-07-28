import { ViteSSG } from 'vite-ssg/single-page'
import App from './App.vue'
import './assets/styles.css'

// Single-page app, prerendered to static HTML at build time by vite-ssg.
export const createApp = ViteSSG(App)
