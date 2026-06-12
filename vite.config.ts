import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from 'node:path';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // VITE_API_TARGET points the dev-server proxy at a backend.
  // Defaults to a local backend; set it (e.g. via `.env.staging` +
  // `npm run dev:staging`) to develop against the shared staging backend.
  // NOTE: this only affects `vite dev`. Production is served by nginx
  // (see nginx.conf), which is unaffected by this setting.
  const env = loadEnv(mode, process.cwd(), '');
  const apiTarget = env.VITE_API_TARGET || 'http://localhost:8085';
  // For a remote target the Host header must be rewritten; for local it stays as-is.
  const proxy = {
    target: apiTarget,
    changeOrigin: !apiTarget.includes('localhost'),
    secure: false,
  };

  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      port: 5173,
      proxy: {
        '/api': proxy,
        '/oauth': proxy,
      },
    },
    build: {
      outDir: 'dist',
      sourcemap: false,
    },
  };
});
