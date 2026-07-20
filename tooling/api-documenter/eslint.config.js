/**
 * Previously extended @rushstack/eslint-config, but that package does not yet
 * support ESLint v10 (its flat-config profiles are unavailable). This package is
 * not part of `turbo run lint`; it reuses the shared monorepo config so editors
 * still get consistent linting.
 * Config is extended from /tooling/eslint-config-custom/index.js
 */
const lkCustom = require('eslint-config-lk-custom');

module.exports = [
  { ignores: ['lib/**', 'temp/**', 'node_modules/**'] },
  ...lkCustom,
  {
    // Vendored fork of @microsoft/api-documenter: @virtual hook methods and CLI
    // action constructors keep named parameters for documentation and override
    // clarity even when the base implementation does not consume them. Unused
    // variables/imports are still reported.
    rules: {
      '@typescript-eslint/no-unused-vars': ['error', { args: 'none', ignoreRestSiblings: true }],
    },
  },
];
