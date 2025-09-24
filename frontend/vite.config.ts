import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  server: {
    proxy: {
      '/api':'https://civiceyeb-lrqe.onrender.com', //'https://civic-issue-reporter-application.onrender.com',
    },
  },
  plugins: [
    tailwindcss(),
  ],
})