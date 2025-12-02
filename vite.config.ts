
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Manual chunk names double as documentation for the build pipeline; update README when adjusting.
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: process.env.VITE_DEV_API_PROXY || 'http://localhost:4001',
        changeOrigin: true,
      },
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          const normalizedId = id.replace(/\\/g, '/');

          if (normalizedId.includes('/node_modules/fflate')) {
            // Shared compression helper pulled in by jspdf; separate chunk keeps the PDF core leaner.
            return 'pdf-fflate';
          }

          if (normalizedId.includes('/node_modules/jspdf/dist/')) {
            // The jspdf ESM bundle is sizeable; isolate it from ancillary helpers.
            return 'pdf-jspdf-core';
          }

          if (normalizedId.includes('/node_modules/jspdf')) {
            return 'pdf-jspdf';
          }

          if (normalizedId.includes('/node_modules/css-line-break')) {
            // html2canvas pulls Unicode segmentation helpers that can live in their own chunk.
            return 'pdf-html2canvas-css';
          }

          if (normalizedId.includes('/node_modules/text-segmentation')) {
            return 'pdf-html2canvas-text';
          }

          if (normalizedId.includes('/node_modules/html2canvas/dist/')) {
            return 'pdf-html2canvas-core';
          }

          if (normalizedId.includes('/node_modules/html2canvas')) {
            return 'pdf-html2canvas';
          }

          if (normalizedId.includes('/node_modules/recharts-scale')) {
            // Recharts scale helpers are reused across chart types; splitting helps multiple lazy views.
            return 'charts-scale';
          }

          if (
            normalizedId.includes('/node_modules/d3-') ||
            normalizedId.includes('/node_modules/internmap') ||
            normalizedId.includes('/node_modules/robust-predicates') ||
            normalizedId.includes('/node_modules/topojson-client')
          ) {
            return 'charts-d3';
          }

          if (normalizedId.includes('/node_modules/lucide-react')) {
            return 'icons';
          }

          if (normalizedId.includes('/node_modules/recharts')) {
            if (normalizedId.includes('/node_modules/recharts/es6/cartesian/')) {
              return 'charts-cartesian';
            }

            if (normalizedId.includes('/node_modules/recharts/es6/chart/')) {
              return 'charts-wrappers';
            }

            if (normalizedId.includes('/node_modules/recharts/es6/polar/')) {
              return 'charts-polar';
            }

            if (normalizedId.includes('/node_modules/recharts/es6/shape/')) {
              return 'charts-shapes';
            }

            if (normalizedId.includes('/node_modules/recharts/es6/component/')) {
              return 'charts-components';
            }

            if (normalizedId.includes('/node_modules/recharts/es6/util/')) {
              return 'charts-utils';
            }

            return 'charts-core';
          }

          if (normalizedId.includes('/node_modules/@google/generative-ai')) {
            return 'ai-gemini';
          }

          if (normalizedId.includes('/src/lib/ai')) {
            return 'ai-client';
          }

          if (normalizedId.includes('/src/data/')) {
            return 'case-data';
          }

          if (normalizedId.includes('/src/pdf/')) {
            return 'pdf-executive';
          }

          if (normalizedId.includes('/src/components/Shared/') && normalizedId.includes('KpiCard')) {
            return 'shared-kpi';
          }
        },
      },
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setup.ts',
    include: [
      'src/**/*.{test,spec}.{ts,tsx}',
      'server/**/*.{test,spec}.{ts,tsx}',
      'test/**/*.{test,spec}.{ts,tsx}',
      'scripts/**/*.{test,spec}.{ts,tsx}',
    ],
    exclude: ['**/node_modules/**', '**/e2e/**', '**/playwright-report/**', '**/test-results/**'],
  },
});
