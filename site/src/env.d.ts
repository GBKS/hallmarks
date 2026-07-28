/// <reference types="vite/client" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, any>
  export default component
}

// The demo engine imports the library through this Vite alias.
declare module '@hallmark' {
  export const hallmark: any
  export const hallmarkSpec: any
  export const hallmarkSVG: any
  export const hallmarkPixels: any
  export const hallmarkWords: any
}

interface Window {
  setDemoMode: (mode: 'light' | 'dark') => void
}
