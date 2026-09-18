/**
 * Linting is defined for all packages of the monorepo in the eslint-config-custom package.
 * Config is extended from /tooling/eslint-config-custom/index.js
 */
import lkCustom from 'eslint-config-lk-custom';

export default [
  { ignores: ['dist/**', 'node_modules/**', 'next-env.d.ts'] },
  ...lkCustom,
  {
    settings: {
      react: {
        version: '19',
      },
    },
  },
];
