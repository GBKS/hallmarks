import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      // The live demos import the reference library straight from the built
      // hallmark.js at the repo root — so the site always demos the current
      // library build, no publish/version dance.
      '@hallmark': fileURLToPath(new URL('../hallmark.js', import.meta.url)),
    },
  },
  server: {
    // Allow importing hallmark.js, which lives one level up from this app.
    fs: { allow: ['..'] },
  },
  // vite-ssg options — prerender the page to static HTML for SEO / OG.
  ssgOptions: {
    script: 'async',
    formatting: 'minify',
  },
})
