/**
 * Linting is defined for all packages of the monorepo in the eslint-config-custom package.
 * Config is extended from /tooling/eslint-config-custom/index.js
 */
const lkCustom = require('eslint-config-lk-custom');
const storybook = require('eslint-plugin-storybook');

module.exports = [
  { ignores: ['storybook-static/**', 'node_modules/**', '!.storybook'] },
  ...lkCustom,
  ...storybook.configs['flat/recommended'],
  {
    rules: {
      'import/no-anonymous-default-export': [
        'warn',
        {
          allowObject: true, // Storybook uses export default in every story.
        },
      ],
    },
  },
];
