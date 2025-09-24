import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  server: {
    proxy: {
      '/api':'http://localhost:3000/', //'https://civic-issue-reporter-application.onrender.com',
    },
  },
  plugins: [
    tailwindcss(),
  ],
})