import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

export default defineConfig({
  base: '/',
  server: {
    watch: {
      ignored: ['**/.env.local', '**/vite.config.ts', '**/tailwind.config.cjs'],
    },
  },
  optimizeDeps: {
    include: [
      '@supabase/supabase-js',
      '@supabase/auth-js',
      '@supabase/realtime-js',
      '@supabase/postgrest-js',
      '@supabase/storage-js',
      '@supabase/functions-js',
    ],
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
