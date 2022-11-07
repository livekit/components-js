import { Options } from 'tsup';

const defaultOptions: Options = {
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  splitting: false,
  sourcemap: true,
  dts: true,
  clean: true,
  target: 'ES6',
};
export default defaultOptions;
