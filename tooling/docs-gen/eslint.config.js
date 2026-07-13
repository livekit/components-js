/**
 * Linting is defined for all packages of the monorepo in the eslint-config-custom package.
 * Config is extended from /tooling/eslint-config-custom/index.js
 */
const lkCustom = require('eslint-config-lk-custom');

module.exports = [
  { ignores: ['dist/**', 'lib/**', 'node_modules/**'] },
  ...lkCustom,
];
