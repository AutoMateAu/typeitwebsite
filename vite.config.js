import { defineConfig } from 'vite'
import { resolve } from 'path'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        onboarding: resolve(__dirname, 'onboarding.html'),
        building: resolve(__dirname, 'building.html'),
        pricing: resolve(__dirname, 'pricing.html'),
        features: resolve(__dirname, 'features.html'),
        enterprise: resolve(__dirname, 'enterprise.html'),
        demo: resolve(__dirname, 'demo.html'),
        review: resolve(__dirname, 'review.html'),
      },
    },
  },
})
