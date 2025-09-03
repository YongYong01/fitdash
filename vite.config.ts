import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: '/fitdash/',   // IMPORTANT for subpath hosting
  plugins: [react()],
})
