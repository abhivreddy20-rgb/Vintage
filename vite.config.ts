import { tamaguiPlugin } from '@tamagui/vite-plugin'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  server: {
    proxy: {
      '/api': 'http://127.0.0.1:4175',
    },
  },
  plugins: [
    react(),
    tamaguiPlugin({
      config: 'src/tamagui.config.ts',
      components: ['tamagui'],
      disableExtraction: true,
    }),
  ],
})
