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

// The deployment a dispatched agent's worker registers under. The A2A base url already pins
// `/default/`, and real staging workers run under `LIVEKIT_AGENT_DEPLOYMENT=default`, so default to
// that. An empty deployment won't match a deployed worker and the dispatch silently never fires.
const defaultAgentDeployment = process.env.LK_AGENT_DEPLOYMENT || 'default';

function base64url(input: string | Buffer): string {
  return Buffer.from(input).toString('base64url');
}

function snakeToCamel(key: string): string {
  return key.replace(/_([a-z])/g, (_match, c: string) => c.toUpperCase());
}

function deepCamelize(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(deepCamelize);
  }
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      out[snakeToCamel(k)] = deepCamelize(v);
    }
    return out;
  }
  return value;
}

/**
 * Turn the `room_config` the browser's TokenSource posts into the JWT's `roomConfig` claim.
 *
 * The TokenSource serializes its `RoomConfiguration` to snake_case for the request body
 * (`ValueToSnakeCase<...>`), so an agent dispatch arrives as `{ agent_name, metadata }`. But the JWT
 * `roomConfig` claim must be canonical proto3 JSON (camelCase) — the shape
 * `RoomConfiguration.fromJson(...).toJson()` produces — or the LiveKit dispatcher reads an empty
 * `agentName`, dispatches nothing, and the agent never joins. Convert the keys here, and fill each
 * agent's `deployment` so it matches a deployed worker.
 */
function roomConfigClaim(roomConfigPayload: unknown): Record<string, unknown> | undefined {
  if (!roomConfigPayload || typeof roomConfigPayload !== 'object') {
    return undefined;
  }
  const claim = deepCamelize(roomConfigPayload) as Record<string, unknown>;
  if (Array.isArray(claim.agents)) {
    claim.agents = claim.agents.map((agent: Record<string, unknown>) => ({
      ...agent,
      deployment: agent.deployment || defaultAgentDeployment,
    }));
  }
  return claim;
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
  opts: { identity: string; name?: string; metadata?: string; roomName: string; ttlSeconds?: number; roomConfig?: any },
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
    // Already normalized to the canonical camelCase proto3 JSON shape by `roomConfigClaim`.
    roomConfig: opts.roomConfig,
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
    const roomConfig = roomConfigClaim(body.room_config);

    const token = mintToken(apiKey, apiSecret, { identity, name, metadata, roomName, roomConfig });

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
