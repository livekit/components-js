// @ts-check

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  webpack: (config, { buildId, dev, isServer, defaultLoaders, nextRuntime, webpack }) => {
    // Important: return the modified config
    config.module.rules = [
      ...config.module.rules,
      {
        test: /\.mjs$/,
        enforce: 'pre',
        use: ['source-map-loader'],
      },
    ];
    return config;
  },
};

module.exports = nextConfig;
