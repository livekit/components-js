// @ts-check
const path = require('path');
module.exports = {
  stories: ['../stories/**/*.mdx', '../stories/**/*.stories.@(js|jsx|ts|tsx)'],
  addons: [
    '@storybook/addon-links',
    '@storybook/addon-docs',
    '@storybook/addon-styling-webpack',
    '@storybook/addon-themes'
  ],
  framework: {
    name: '@storybook/react-vite',
    options: {},
  },
  features: {
    modernInlineRender: false,
  },
  docs: {
    docsPage: 'automatic', // see below for alternatives
  },
  typescript: {
    reactDocgen: 'react-docgen-typescript',
  },
  async viteFinal(config) {
    const { default: tailwindcss } = await import('@tailwindcss/vite');

    return {
      ...config,
      plugins: [...config.plugins, tailwindcss()],
      esbuild: {
        ...config.esbuild,
        jsx: 'automatic',
      },
      resolve: {
        ...config.resolve,
        alias: {
          ...config.resolve?.alias,
          '@': path.resolve(__dirname, '../../../packages/shadcn'),
        },
      },
    };
  },
};
