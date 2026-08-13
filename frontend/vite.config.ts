import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// Both ports derive from the project creation date, never from Vite's stock
// 5173, so two checkouts never fight over the same port.
const backendPort = Number(process.env.PORT ?? 31228);
const devServerPort = Number(process.env.VITE_PORT ?? backendPort + 1);

export default defineConfig({
  plugins: [react()],
  build: {
    target: 'esnext',
  },
  server: {
    port: devServerPort,
    // Fail loudly rather than drifting to the next free port, which would
    // leave the proxy target, the dev script and the README disagreeing.
    strictPort: true,
    proxy: {
      '/v1': `http://localhost:${backendPort}`,
      '/docs': `http://localhost:${backendPort}`,
    },
  },
});
