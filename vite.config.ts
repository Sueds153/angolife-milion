import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import javascriptObfuscator from 'vite-plugin-javascript-obfuscator';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    const isProd = mode === 'production';

    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [
        react(),
        isProd ? javascriptObfuscator({
          include: [/\.(js|ts|tsx)$/],
          exclude: [/node_modules/],
          options: {
            compact: true,
            controlFlowFlattening: true,
            controlFlowFlatteningThreshold: 0.75,
            numbersToExpressions: true,
            simplify: true,
            stringArray: true,
            stringArrayThreshold: 0.75,
            splitStrings: true,
            splitStringsChunkLength: 10,
            unicodeEscapeSequence: false
          }
        }) : null
      ].filter(Boolean),
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
