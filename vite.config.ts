import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(),    
    tailwindcss(),],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor': ['react', 'react-dom', 'react-router-dom'],
          'ui-components': [
            './src/components/ui/button.tsx',
            './src/components/ui/card.tsx',
            './src/components/ui/dropdown-menu.tsx',
            './src/components/ui/form.tsx',
            './src/components/ui/input.tsx',
            './src/components/ui/label.tsx',
            './src/components/ui/select.tsx',
            './src/components/ui/table.tsx',
            './src/components/ui/textarea.tsx',
            './src/components/ui/sortable-table.tsx',
          ],
          'pages': [
            './src/pages/Dashboard.tsx',
            './src/pages/Calendar.tsx',
            './src/pages/Financials.tsx',
          ],
        },
      },
    },
  },
})
