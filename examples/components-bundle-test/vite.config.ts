import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      manualChunks: {
        react: ['react', 'react-dom'],
        livekit: ['livekit-client'],
        core: ['@livekit/components-core'],
        components: ['@livekit/components-react'],
      },
    },
  },
});
