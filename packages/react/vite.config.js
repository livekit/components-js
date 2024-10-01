import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import dts from 'vite-plugin-dts';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    dts({
      insertTypesEntry: true, // Create a `types` entry in package.json
      rollupTypes: false, // Bundle .d.ts files into a single declaration file
      sourcemap: true, // Enable source maps for .d.ts files
      // outputDir: ['dist/esm', 'dist/cjs'], // Output .d.ts files for both formats
    }),
  ],
  build: {
    minify: 'esbuild',
    emptyOutDir: true,
    sourcemap: true,
    target: 'es6',
    modulePreload: { polyfill: false },
    lib: {
      entry: {
        index: resolve(__dirname, 'src/index.ts'),
        hooks: resolve(__dirname, 'src/hooks/index.ts'),
        prefabs: resolve(__dirname, 'src/prefabs/index.ts'),
        krisp: resolve(__dirname, 'src/hooks/cloud/krisp/useKrispNoiseFilter.ts'),
      },
    },
    rollupOptions: {
      external: [
        'livekit-client',
        '@livekit/krisp-noise-filter',
        'react',
        'react-dom',
        'react/jsx-runtime',
      ],
      output: [
        {
          format: 'es',
          entryFileNames: '[name].mjs', // Use .mjs for ESM
          chunkFileNames: 'shared-[hash].mjs',
          dir: 'dist',
        },
        {
          format: 'cjs',
          entryFileNames: '[name].js', // Use .js for CJS
          chunkFileNames: 'shared-[hash].js',
          dir: 'dist',
        },
      ],
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
  },
});
