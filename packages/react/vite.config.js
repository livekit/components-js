import { defineConfig } from 'vite';
import { resolve } from 'path';
import dts from 'vite-plugin-dts';

// https://vitejs.dev/config/
export default defineConfig({
  appType: 'custom',
  plugins: [
    // react(),
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
    target: 'es2020',
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
          chunkFileNames: '[name]-[hash].mjs',
          dir: 'dist',
          codeSplitting: {
            // Group by source directory: each `test` matches every module in the
            // directory directly, so no recursion or priorities are needed (the
            // directories are disjoint, so a module matches exactly one group).
            // Modules shared across entries but outside these dirs are hoisted into
            // their own chunk by Rolldown automatically.
            groups: [
              { name: 'contexts', test: /\/src\/context\// },
              { name: 'hooks', test: /\/src\/hooks\// },
              { name: 'components', test: /\/src\/components\// },
              { name: 'prefabs', test: /\/src\/prefabs\// },
            ],
          },
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
