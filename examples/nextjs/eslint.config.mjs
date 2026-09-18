import nextCoreWebVitals from 'eslint-config-next/core-web-vitals';

export default [
  { ignores: ['.next/**', 'node_modules/**', 'next-env.d.ts'] },
  ...nextCoreWebVitals,
  {
    // eslint-config-next defaults `react.version` to 'detect'; pin it to avoid
    // eslint-plugin-react's auto-detection, which is incompatible with ESLint 10.
    settings: {
      react: {
        version: '18',
      },
    },
    rules: {
      // Newly enabled by eslint-plugin-react-hooks v7 (via eslint-config-next 16).
      // Not enforced by the previous config; keep as a warning to avoid failing
      // the example build on the config upgrade alone.
      'react-hooks/set-state-in-effect': 'warn',
    },
  },
];
