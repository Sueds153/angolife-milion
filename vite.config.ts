import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    const isProd = mode === 'production';

    return {
      server: {
        port: 3000,
        // 🔐 SEGURANÇA: restrito a localhost. Usar '0.0.0.0' apenas para debug em dispositivo móvel.
        host: 'localhost',
      },
      plugins: [
        tailwindcss(),
        react(),
      ].filter(Boolean),
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      },
      build: {
        minify: 'terser',
        terserOptions: {
          compress: {
            drop_console: isProd,
            drop_debugger: isProd
          }
        }
      },
      test: {
        globals: true,
        environment: 'jsdom',
        setupFiles: './vitest-setup.ts',
      }
    };
});
