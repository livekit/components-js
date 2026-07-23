import type { VercelRequest, VercelResponse } from '@vercel/node';
import { AccessToken, RoomAgentDispatch, RoomConfiguration } from 'livekit-server-sdk';

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
 * Mirrors the local dev-only route in `.storybook/main.js`, so `AgentSessionView-01` can connect
 * to a real LiveKit room on the deployed Vercel preview, not just `pnpm dev:storybook`.
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
    const LIVEKIT_URL = process.env.LIVEKIT_URL;
    const API_KEY = process.env.LIVEKIT_API_KEY;
    const API_SECRET = process.env.LIVEKIT_API_SECRET;
    const AGENT_NAME = process.env.AGENT_NAME;

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
      agents: [new RoomAgentDispatch({ agentName: AGENT_NAME })],
    });

    sendResponse(
      res,
      200,
      {
        server_url: LIVEKIT_URL,
        room_name: roomName,
        participant_name: participantName,
        participant_token: await token.toJwt(),
      },
      true,
    );
  } catch (error) {
    console.error(error);
    const message = error instanceof Error ? error.message : String(error);
    sendResponse(res, 500, message, false);
  }
}
