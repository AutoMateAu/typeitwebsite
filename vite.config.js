import { defineConfig } from 'vite'
import { resolve } from 'path'
import fs from 'fs'
import react from '@vitejs/plugin-react'

function cleanUrlsPlugin() {
  return {
    name: 'clean-urls',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = req.url.split('?')[0]
        if (!url.includes('.') && url !== '/') {
          const htmlPath = resolve(__dirname, url.slice(1) + '.html')
          if (fs.existsSync(htmlPath)) {
            req.url = url + '.html'
          }
        }
        next()
      })
    },
  }
}

export default defineConfig({
  plugins: [react(), cleanUrlsPlugin()],
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        onboarding: resolve(__dirname, 'onboarding.html'),
        building: resolve(__dirname, 'building.html'),
        pricing: resolve(__dirname, 'pricing.html'),
        enterprise: resolve(__dirname, 'enterprise.html'),
        demo: resolve(__dirname, 'demo.html'),
        details: resolve(__dirname, 'details.html'),
        blog: resolve(__dirname, 'blog/index.html'),
        blogArticle1: resolve(__dirname, 'blog/ai-receptionist-medical-practice-australia.html'),
        blogArticle2: resolve(__dirname, 'blog/ai-receptionist-physiotherapy-australia.html'),
        blogArticle3: resolve(__dirname, 'blog/ai-receptionist-real-estate-australia.html'),
      },
    },
  },
})
