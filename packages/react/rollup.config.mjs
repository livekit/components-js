// @ts-check
import typescript from 'rollup-plugin-typescript2';
import commonjs from '@rollup/plugin-commonjs';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import filesize from 'rollup-plugin-filesize';
import del from 'rollup-plugin-delete';

export default {
  input: 'src/index.ts',
  output: [
    {
      file: `dist/index.mjs`,
      format: 'esm',
      strict: true,
      sourcemap: true,
    },
    {
      file: `dist/index.js`,
      format: 'umd',
      strict: true,
      sourcemap: true,
      name: '@livekit/components-react',
    },
  ],
  plugins: [
    del({ targets: 'dist/*' }),
    nodeResolve({ browser: true, preferBuiltins: false }),
    typescript({ tsconfig: './tsconfig.json' }),
    commonjs(),
    filesize(),
  ],
  // indicate which modules should be treated as external
  external: ['react', 'react-dom', 'livekit-client'],
};
