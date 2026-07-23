import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'node:path';

export default defineConfig({
  plugins: [react()],
  define: {
    // IIFE/libモードではNODE_ENV置換が既定で効かず、React本体が
    // `process is not defined` で実行時エラーになるため明示的に固定する。
    'process.env.NODE_ENV': JSON.stringify('production'),
  },
  build: {
    outDir: resolve(__dirname, '../public/calendar-widget'),
    emptyOutDir: true,
    lib: {
      entry: resolve(__dirname, 'src/main.jsx'),
      name: 'StargazerCalendar',
      formats: ['iife'],
      fileName: () => 'calendar.iife.js',
    },
    rollupOptions: {
      output: {
        assetFileNames: (assetInfo) => {
          const name = assetInfo.name || assetInfo.names?.[0] || '';
          if (name.endsWith('.css')) return 'calendar.css';
          return 'assets/[name][extname]';
        },
      },
    },
  },
});
