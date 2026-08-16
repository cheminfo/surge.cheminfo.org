import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// The project's own port, derived from its creation date, never Vite's stock
// 5173: two checkouts must not fight over the same one. There is nothing to
// proxy to any more — the page answers itself.
const port = Number(process.env.PORT ?? 31228);

export default defineConfig({
  plugins: [react()],
  build: {
    target: 'esnext',
  },
  // Surge is reached from a worker, so the startup scan never walks to it and
  // it is discovered on the first enumeration instead — which reloads the page
  // under whoever asked for it.
  optimizeDeps: {
    include: ['surge-wasm'],
  },
  server: {
    port,
    // Fail loudly rather than drifting to the next free port, which would
    // leave the dev script and the README disagreeing.
    strictPort: true,
  },
});
