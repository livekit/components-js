// @ts-check
const path = require('path');
module.exports = {
  stories: ['../stories/**/*.stories.mdx', '../stories/**/*.stories.@(js|jsx|ts|tsx)'],
  addons: [
    '@storybook/addon-links',
    '@storybook/addon-essentials',
    '@storybook/addon-interactions',
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
};
