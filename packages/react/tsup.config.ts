import { defineConfig } from 'tsup';

import defaults from '../../tsup.config';

const importPathPlugin = {
  name: 'import-path',
  setup(build) {
    build.onResolve({ filter: /^\.\/src\/context\/room-context$/ }, (args) => {
      return { path: args.path, external: true };
    });
  },
};

export default defineConfig({
  clean: true,
  bundle: false,
  splitting: false,
  outDir: 'dist',
  format: ['cjs', 'esm'],
  sourcemap: true,
  // for the type maps to work, we use tsc's declaration-only command
  dts: false,
  entry: ['src/**/*.ts'],
  external: ['livekit-client', 'react', 'react-dom', '@livekit/krisp-noise-filter'],
  esbuildOptions: (options) => {
    options.outbase = 'src';
    options.plugins = [
      {
        name: 'add-mjs',
        setup(build) {
          build.onResolve({ filter: /.*/ }, (args) => {
            if (args.importer) return { path: args.path + '.mjs', external: true };
          });
        },
      },
    ];
  },
});
