import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Plugin to filter files during public directory copy
const filterPublicFiles = () => {
  return {
    name: 'filter-public-files',
    apply: 'build' as const,
    configResolved(config: any) {
      const originalPublicDir = config.publicDir
      if (originalPublicDir && typeof originalPublicDir === 'string') {
        config.publicDir = false

        config.plugins.push({
          name: 'copy-public-filtered',
          writeBundle() {
            const publicFiles = fs.readdirSync(originalPublicDir, { withFileTypes: true })
            const outDir = config.build.outDir

            for (const file of publicFiles) {
              // Skip files with "copy" in name or temporary files
              if (file.name.includes('copy') || file.name.includes('image copy')) {
                continue
              }

              const src = path.join(originalPublicDir, file.name)
              const dest = path.join(outDir, file.name)

              try {
                if (file.isDirectory()) {
                  fs.cpSync(src, dest, { recursive: true })
                } else {
                  fs.copyFileSync(src, dest)
                }
              } catch (err) {
                // Skip files that can't be copied
                console.warn(`Skipping file: ${file.name}`)
              }
            }
          }
        })
      }
    }
  }
}

export default defineConfig({
  plugins: [react(), filterPublicFiles()],
  root: '.',
  publicDir: 'public',
  resolve: {
    extensions: ['.mjs', '.js', '.ts', '.jsx', '.tsx', '.json'],
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
    dedupe: ['react', 'react-dom', 'i18next', 'react-i18next'],
    conditions: ['import', 'module', 'browser', 'default'],
  },
  test: {
    globals: true,
    environment: 'jsdom',
  },
  optimizeDeps: {
    include: [
      'i18next',
      'react-i18next',
      'i18next-browser-languagedetector',
      'react',
      'react-dom',
      '@supabase/supabase-js',
      'lucide-react'
    ]
  },
  build: {
    target: 'es2015',
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: ['log', 'info'],
        pure_funcs: ['console.log', 'console.info', 'console.debug']
      }
    },
    sourcemap: false,
    outDir: 'dist',
    emptyOutDir: true,
    commonjsOptions: {
      include: [/node_modules/],
      transformMixedEsModules: true,
    },
    rollupOptions: {
      external: [],
      output: {
        manualChunks: {
          'vendor': ['react', 'react-dom'],
          'supabase': ['@supabase/supabase-js'],
          'charts': ['recharts'],
          'flow': ['reactflow'],
          'xlsx': ['xlsx'],
          'jspdf': ['jspdf'],
          'i18n': ['i18next', 'react-i18next', 'i18next-browser-languagedetector'],
        }
      }
    },
    chunkSizeWarningLimit: 1000,
  },
  server: {
    port: 5175,
    host: true,
  },
})
