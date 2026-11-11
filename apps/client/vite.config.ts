import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  if (mode === 'production') {
    const required = ['VITE_API_BASE_URL', 'VITE_AWS_REGION', 'VITE_COGNITO_USER_POOL_ID', 'VITE_COGNITO_CLIENT_ID', 'VITE_COGNITO_DOMAIN'];
    const missing = required.filter((key) => !env[key]?.trim());
    if (missing.length) throw new Error(`Production frontend build is missing: ${missing.join(', ')}`);
    let apiUrl: URL;
    try {
      apiUrl = new URL(env.VITE_API_BASE_URL);
    } catch {
      throw new Error('Production VITE_API_BASE_URL must be a valid HTTPS origin.');
    }
    if (apiUrl.protocol !== 'https:' || ['localhost', '127.0.0.1', '[::1]'].includes(apiUrl.hostname)) {
      throw new Error('Production VITE_API_BASE_URL must be a public HTTPS origin.');
    }
  }
  return ({
  plugins: [react()],
  server: {
    port: 5173,
    host: true,
    proxy: {
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true,
      },
    },
  },
  });
});
