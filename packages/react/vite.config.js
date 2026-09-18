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
            // Rollup's `manualChunks` object form pulled each listed module *and its
            // dependency tree* into the chunk. Rolldown groups only capture modules
            // that themselves match `test`, so recursion must be opted into.
            includeDependenciesRecursively: true,

            groups: [
              {
                name: 'room',
                test: /\/src\/(hooks\/useLiveKitRoom\.ts|components\/LiveKitRoom\.tsx)$/,
                priority: 6,
              },
              { name: 'contexts', test: /\/src\/context\/index\.ts$/, priority: 5 },
              { name: 'hooks', test: /\/src\/hooks\/index\.ts$/, priority: 3 },
              { name: 'components', test: /\/src\/components\/index\.ts$/, priority: 2 },
              { name: 'prefabs', test: /\/src\/prefabs\/index\.ts$/, priority: 1 },
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
