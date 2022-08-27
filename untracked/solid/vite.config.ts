import { resolve } from 'path';
import { defineConfig } from 'vite';
import solidPlugin from 'vite-plugin-solid';

export default defineConfig({
  plugins: [
    solidPlugin({
      ssr: false,
    }),
  ],
  server: {
    port: 3030,
  },
  build: {
    lib: {
      entry: resolve(__dirname, 'src/components/index.ts'),
      name: '@livekit/components',
      // the proper extensions will be added
      fileName: 'livekit-components',
    },
    target: 'esnext',
  },
});
