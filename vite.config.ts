import { readFileSync } from 'node:fs';
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

type AcademyId = 'hamarr' | 'manzur';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

const academyId = (process.env.VITE_ORGANIZATION_ID || 'hamarr') as AcademyId;
if (academyId !== 'hamarr' && academyId !== 'manzur') {
  throw new Error('Unsupported academy web build identity');
}
const academyCatalog: unknown = JSON.parse(readFileSync(new URL('./src/branding/site.json', import.meta.url), 'utf8'));
if (!isRecord(academyCatalog) || !isRecord(academyCatalog[academyId])) {
  throw new Error('Academy metadata is missing or malformed');
}
const selectedBrand = { ...academyCatalog[academyId], id: academyId };

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  define: { __ACADEMY_BRAND__: JSON.stringify(selectedBrand) },
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
