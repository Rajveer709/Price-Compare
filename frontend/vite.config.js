import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [react()],
    server: {
      port: 3001,
      open: true,
      strictPort: true, // Exit if port 3001 is in use
    },
    // Production build settings
    build: {
      outDir: 'dist',
      assetsDir: 'assets',
      sourcemap: mode === 'development',
      minify: 'terser',
      terserOptions: {
        compress: {
          drop_console: true,
          drop_debugger: true,
        },
      },
      rollupOptions: {
        output: {
          manualChunks: {
            react: ['react', 'react-dom', 'react-router-dom'],
            chakra: ['@chakra-ui/react', '@emotion/react', '@emotion/styled', 'framer-motion'],
          },
        },
      },
    },
    // Base public path when served in production
    base: env.VITE_PUBLIC_PATH || '/',
    // Resolve aliases
    resolve: {
      alias: {
        '@': resolve(__dirname, 'src'),
      },
    },
    // Environment variables
    define: {
      'process.env': {},
      __APP_ENV__: env.APP_ENV,
    },
  };
});
