import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // Load env file based on `mode` (development, production, etc.)
  const env = loadEnv(mode, process.cwd(), '');

  // Build allowedHosts array dynamically
  const allowedHosts: string[] = [];

  // Add ngrok host if provided via environment variable
  if (env.VITE_NGROK_HOST) {
    allowedHosts.push(env.VITE_NGROK_HOST);
  }

  // Get configuration from environment or use defaults
  const port = parseInt(env.VITE_PORT || '3000', 10);
  const apiTarget = env.VITE_API_TARGET || 'http://localhost:3001';

  return {
    plugins: [react()],
    server: {
      port,
      // Only set allowedHosts if we have entries
      allowedHosts: allowedHosts.length > 0 ? allowedHosts : undefined,
      proxy: {
        '/api': {
          target: apiTarget,
          changeOrigin: true,
        },
      },
    },
  };
});
