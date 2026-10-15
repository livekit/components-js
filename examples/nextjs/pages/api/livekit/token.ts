import { NextApiRequest, NextApiResponse } from 'next';
import crypto from 'crypto';
import type { TokenSourceRequestPayload, TokenSourceResponsePayload } from 'livekit-client';

type TokenSourceResponse = TokenSourceResponsePayload & {
  participant_name?: string;
  room_name?: string;
};

const apiKey = process.env.LK_API_KEY;
const apiSecret = process.env.LK_API_SECRET;
const serverUrl = process.env.NEXT_PUBLIC_LK_SERVER_URL || 'ws://localhost:7880';

function base64url(input: string | Buffer): string {
  return Buffer.from(input).toString('base64url');
}

/**
 * Mint a LiveKit JWT by hand.
 *
 * We can't use `AccessToken` from `livekit-server-sdk` here because it can only add the `video`
 * (and `sip`) grants, and the agents-2.0 A2A endpoint authorizes callers with a top-level
 * `agentEndpoint` claim (see livekit-agents/livekit/agents/a2a/auth.py → `Credentials.project_token`).
 *
 * The token carries BOTH:
 *   - a `video` grant, so it still works for the mock (signature only) and for RTC mode, and
 *   - `agentEndpoint: { call: true }`, so a real agents-2.0 endpoint accepts it (the project
 *     principal, allowed to call any agent in the project).
 */
function mintToken(
  key: string,
  secret: string,
  opts: { identity: string; name?: string; metadata?: string; roomName: string; ttlSeconds?: number },
): string {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: 'HS256', typ: 'JWT' };
  const payload: Record<string, unknown> = {
    iss: key,
    sub: opts.identity,
    iat: now,
    nbf: now - 5,
    exp: now + (opts.ttlSeconds ?? 3600),
    name: opts.name,
    metadata: opts.metadata,
    video: {
      room: opts.roomName,
      roomJoin: true,
      canPublish: true,
      canPublishData: true,
      canSubscribe: true,
      canUpdateOwnMetadata: true,
    },
    // agents-2.0 A2A auth: the project principal, allowed to call any agent in the project.
    agentEndpoint: { call: true },
  };

  const signingInput = `${base64url(JSON.stringify(header))}.${base64url(JSON.stringify(payload))}`;
  const signature = crypto.createHmac('sha256', secret).update(signingInput).digest('base64url');
  return `${signingInput}.${signature}`;
}

export default async function handleToken(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (!apiKey || !apiSecret) {
      throw Error('LK_API_KEY and LK_API_SECRET must be set');
    }

    if (req.method !== 'POST') {
      res.setHeader('Allow', 'POST');
      res.status(405).json({ error: 'Method Not Allowed. Only POST requests are supported.' });
      return;
    }

    if (!req.body) {
      throw Error('Request body is required');
    }

    const body = req.body as TokenSourceRequestPayload;
    if (!body.room_name) {
      throw Error('room_name is required');
    }
    if (!body.participant_identity) {
      throw Error('participant_identity is required');
    }

    const roomName = body.room_name;
    const identity = body.participant_identity;
    const name = body.participant_name;
    const metadata = body.participant_metadata;

    const token = mintToken(apiKey, apiSecret, { identity, name, metadata, roomName });

    // Return response in TokenSourceResponse format (snake_case)
    const response: TokenSourceResponse = {
      server_url: serverUrl,
      participant_token: token,
      participant_name: name,
      room_name: roomName,
    };
    res.status(200).json(response);
  } catch (e) {
    const errorMessage = (e as Error).message;
    console.error('Token generation error:', errorMessage);
    res.statusMessage = errorMessage;
    res.status(500).json({ error: errorMessage });
  }
}
