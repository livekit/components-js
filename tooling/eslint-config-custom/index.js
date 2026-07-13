/**
 * Shared flat ESLint config for the monorepo (ESLint v9+ / v10).
 *
 * Consumed by packages via:
 *   const lkCustom = require('eslint-config-lk-custom');
 *   module.exports = [...lkCustom];
 */
const tseslint = require('typescript-eslint');
const nextConfig = require('eslint-config-next');
const turboFlat = require('eslint-config-turbo/flat');
// The CJS build exposes the flat config array under `.default`.
const turboConfig = turboFlat.default ?? turboFlat;
const eslintConfigPrettier = require('eslint-config-prettier');
const prettierRecommended = require('eslint-plugin-prettier/recommended');
const tsdoc = require('eslint-plugin-tsdoc');
const globals = require('globals');

module.exports = [
  ...tseslint.configs.recommended,
  // Brings in the react, react-hooks, jsx-a11y, import and @next/next plugins/rules.
  ...nextConfig,
  ...turboConfig,
  // Disable stylistic rules that conflict with Prettier, then run Prettier as a rule.
  eslintConfigPrettier,
  prettierRecommended,
  {
    plugins: {
      tsdoc,
    },
    languageOptions: {
      ecmaVersion: 2020,
      globals: {
        ...globals.node,
      },
      parserOptions: {
        ecmaFeatures: {
          legacyDecorators: true,
          jsx: true,
        },
      },
    },
    settings: {
      react: {
        version: '18',
      },
    },
    rules: {
      'tsdoc/syntax': 'warn',
      'space-before-function-parens': 0,
      'react/prop-types': 0,
      'react/jsx-handler-names': 0,
      'react/jsx-fragments': 0,
      'react/no-unused-prop-types': 0,
      '@typescript-eslint/no-unused-vars': 'error',
      'import/export': 0,
      '@typescript-eslint/ban-ts-comment': 'warn',
      // Renamed from `no-empty-interface` in typescript-eslint v8.
      '@typescript-eslint/no-empty-object-type': 'warn',
      '@typescript-eslint/consistent-type-imports': 'warn',
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      '@typescript-eslint/no-explicit-any': 'warn',
      // eslint-plugin-react-hooks v7 (via eslint-config-next 16) enables a large
      // set of new "React Compiler" rules by default. These were not enforced
      // before the ESLint 10 upgrade, so keep them off to preserve prior behaviour.
      'react-hooks/config': 'off',
      'react-hooks/error-boundaries': 'off',
      'react-hooks/gating': 'off',
      'react-hooks/globals': 'off',
      'react-hooks/immutability': 'off',
      'react-hooks/incompatible-library': 'off',
      'react-hooks/preserve-manual-memoization': 'off',
      'react-hooks/purity': 'off',
      'react-hooks/refs': 'off',
      'react-hooks/set-state-in-effect': 'off',
      'react-hooks/set-state-in-render': 'off',
      'react-hooks/static-components': 'off',
      'react-hooks/unsupported-syntax': 'off',
      'react-hooks/use-memo': 'off',
    },
  },
];
