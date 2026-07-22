// @ts-check
const path = require('path');
const { RoomAgentDispatch } = require('@livekit/protocol');
const TOKEN_ROUTE_PATH = '/api/agents-ui/token';

function readRequestBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];

    req.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
    req.on('error', reject);
    req.on('end', () => {
      try {
        const rawBody = Buffer.concat(chunks).toString('utf8');
        resolve(rawBody ? JSON.parse(rawBody) : {});
      } catch (error) {
        reject(error);
      }
    });
  });
}

function sendJson(res, statusCode, data) {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(data));
}

function sendText(res, statusCode, text) {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(text);
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
          sendText(res, 405, 'Method Not Allowed. Only POST requests are supported.');
          return;
        }

        if (env.NODE_ENV !== 'development') {
          sendText(
            res,
            500,
            'THIS API ROUTE IS INSECURE. DO NOT USE THIS ROUTE IN PRODUCTION WITHOUT AN AUTHENTICATION LAYER.',
          );
          return;
        }

        try {
          const { AccessToken } = await import('livekit-server-sdk');
          const { RoomConfiguration } = await import('@livekit/protocol');
          const AGENT_NAME = env.AGENT_NAME;
          const LIVEKIT_URL = env.LIVEKIT_URL;
          const API_KEY = env.LIVEKIT_API_KEY;
          const API_SECRET = env.LIVEKIT_API_SECRET;

          if (LIVEKIT_URL === undefined || LIVEKIT_URL === '') {
            throw new Error('LIVEKIT_URL is not defined');
          }
          if (API_KEY === undefined || API_KEY === '') {
            throw new Error('LIVEKIT_API_KEY is not defined');
          }
          if (API_SECRET === undefined || API_SECRET === '') {
            throw new Error('LIVEKIT_API_SECRET is not defined');
          }

          const participantName = 'user';
          const participantIdentity = `voice_assistant_user_${Math.floor(Math.random() * 10_000)}`;
          const roomName = `voice_assistant_room_${Math.floor(Math.random() * 10_000)}`;
          const token = new AccessToken(API_KEY, API_SECRET, {
            identity: participantIdentity,
            name: participantName,
            ttl: '15m',
          });

          token.addGrant({
            room: roomName,
            roomJoin: true,
            canPublish: true,
            canPublishData: true,
            canSubscribe: true,
          });

          token.roomConfig = new RoomConfiguration({
            agents: [
              new RoomAgentDispatch({
                agentName: AGENT_NAME
              })
            ]
          });

          sendJson(res, 200, {
            server_url: LIVEKIT_URL,
            room_name: roomName,
            participant_name: participantName,
            participant_token: await token.toJwt(),
          });
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          console.error(error);
          sendText(res, 500, message);
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
