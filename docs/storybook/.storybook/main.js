// @ts-check
const path = require('path');
const TOKEN_ROUTE_PATH = '/api/agents-ui/token';

function sendResponse(res, status, body, isJson) {
  res.statusCode = status;
  res.setHeader('Content-Type', isJson ? 'application/json' : 'text/plain; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(isJson ? JSON.stringify(body) : String(body));
}

function createStorybookTokenRoutePlugin(env) {
  return {
    name: 'agents-ui-token-route',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const requestUrl = new URL(req.url || '/', 'http://storybook.local');

        if (requestUrl.pathname !== TOKEN_ROUTE_PATH) {
          next();
          return;
        }

        if (req.method !== 'POST') {
          res.setHeader('Allow', 'POST');
          sendResponse(res, 405, 'Method Not Allowed. Only POST requests are supported.', false);
          return;
        }

        if (env.NODE_ENV !== 'development') {
          sendResponse(
            res,
            500,
            'THIS API ROUTE IS INSECURE. DO NOT USE THIS ROUTE IN PRODUCTION WITHOUT AN AUTHENTICATION LAYER.',
            false,
          );
          return;
        }

        try {
          // Loaded via Vite's SSR pipeline (rather than `require`/`import`) since this file is
          // plain CommonJS and `tokenCore.ts` is TypeScript, shared with the Vercel Preview
          // route in `../api/agents-ui/token.ts`.
          const { createAgentToken } = await server.ssrLoadModule(
            path.resolve(__dirname, '../api/agents-ui/tokenCore.ts'),
          );

          const body = await createAgentToken({
            LIVEKIT_URL: env.LIVEKIT_URL,
            LIVEKIT_API_KEY: env.LIVEKIT_API_KEY,
            LIVEKIT_API_SECRET: env.LIVEKIT_API_SECRET,
            AGENT_NAME: env.AGENT_NAME,
          });

          sendResponse(res, 200, body, true);
        } catch (error) {
          console.error(error);
          const message = error instanceof Error ? error.message : String(error);
          sendResponse(res, 500, message, false);
        }
      });
    },
  };
}

module.exports = {
  stories: ['../stories/**/*.mdx', '../stories/**/*.stories.@(js|jsx|ts|tsx)'],
  addons: [
    '@storybook/addon-links',
    '@storybook/addon-docs',
    '@storybook/addon-styling-webpack',
    '@storybook/addon-themes',
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
    const { loadEnv } = await import('vite');
    const mode = config.mode ?? process.env.NODE_ENV ?? 'development';
    const env = {
      ...loadEnv(mode, process.cwd(), ''),
      NODE_ENV: mode,
      ...process.env,
    };

    return {
      ...config,
      plugins: [
        ...(config.plugins ?? []),
        createStorybookTokenRoutePlugin(env),
        tailwindcss(),
      ],
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
