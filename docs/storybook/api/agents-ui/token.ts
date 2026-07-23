import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createAgentToken } from './tokenCore';

function sendResponse(res: VercelResponse, status: number, body: unknown, isJson: boolean) {
  res.setHeader('Cache-Control', 'no-store');
  res.status(status);
  if (isJson) {
    res.json(body);
  } else {
    res.send(body);
  }
}

/**
 * Vercel Preview counterpart to the local dev-only route in `.storybook/main.js` — both share
 * the token-minting logic in `tokenCore.ts`, so `AgentSessionView-01` can connect to a real
 * LiveKit room on the deployed Vercel preview, not just `pnpm dev:storybook`.
 *
 * THIS ROUTE IS INSECURE: it has no authentication layer. It's intentionally allowed to run on
 * Vercel Preview deployments, but refuses to run on Vercel Production.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    sendResponse(res, 405, 'Method Not Allowed. Only POST requests are supported.', false);
    return;
  }

  if (process.env.VERCEL_ENV === 'production') {
    sendResponse(
      res,
      500,
      'THIS API ROUTE IS INSECURE. DO NOT USE THIS ROUTE IN PRODUCTION WITHOUT AN AUTHENTICATION LAYER.',
      false,
    );
    return;
  }

  try {
    const body = await createAgentToken({
      LIVEKIT_URL: process.env.LIVEKIT_URL,
      LIVEKIT_API_KEY: process.env.LIVEKIT_API_KEY,
      LIVEKIT_API_SECRET: process.env.LIVEKIT_API_SECRET,
      AGENT_NAME: process.env.AGENT_NAME,
    });
    sendResponse(res, 200, body, true);
  } catch (error) {
    console.error(error);
    const message = error instanceof Error ? error.message : String(error);
    sendResponse(res, 500, message, false);
  }
}
