import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // React and core dependencies
          if (id.includes('react') || id.includes('react-dom') || id.includes('react-router')) {
            return 'react-vendor';
          }
          
          // Animation libraries
          if (id.includes('framer-motion')) {
            return 'animation-vendor';
          }
          
          // Form and validation libraries
          if (id.includes('react-hook-form') || id.includes('@hookform/resolvers') || id.includes('zod')) {
            return 'form-vendor';
          }
          
          // UI and styling libraries
          if (id.includes('lucide-react') || id.includes('clsx')) {
            return 'ui-vendor';
          }
          
          // Node modules
          if (id.includes('node_modules')) {
            return 'vendor';
          }
          
          // Application pages
          if (id.includes('/pages/')) {
            return 'pages';
          }
          
          // Manager components
          if (id.includes('StudentManager') || id.includes('ClassManager') || 
              id.includes('PaymentManager') || id.includes('CalendarView') || 
              id.includes('AttendanceManager')) {
            return 'managers';
          }
          
          // Main components
          if (id.includes('Dashboard') || id.includes('LandingPage')) {
            return 'components';
          }
        }
      }
    },
    // Increase chunk size warning limit to 1MB for better performance
    chunkSizeWarningLimit: 1000
  }
})
