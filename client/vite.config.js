import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Proxy API and socket traffic to the Express server during development
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true, // expose on the LAN so phones on the same Wi-Fi can connect
    proxy: {
      '/api': 'http://localhost:5000',
      '/socket.io': { target: 'http://localhost:5000', ws: true },
    },
  },
});
