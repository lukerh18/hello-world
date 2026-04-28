import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

export default defineConfig({
  base: '/',
  optimizeDeps: {
    include: ['@supabase/supabase-js'],
  },
  plugins: [
    {
      name: 'handle-econnreset',
      configureServer(server) {
        server.httpServer?.on('error', (err: NodeJS.ErrnoException) => {
          if (err.code !== 'ECONNRESET') throw err
        })
      },
    },
    react(),
  ],
})
