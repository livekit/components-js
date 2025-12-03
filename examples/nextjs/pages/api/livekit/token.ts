import { NextApiRequest, NextApiResponse } from 'next';
import { AccessToken } from 'livekit-server-sdk';
import type { AccessTokenOptions, VideoGrant } from 'livekit-server-sdk';
import type { TokenSourceRequestPayload, TokenSourceResponsePayload } from 'livekit-client';

type TokenSourceResponse = TokenSourceResponsePayload & {
  participant_name?: string;
  room_name?: string;
};

const apiKey = process.env.LK_API_KEY;
const apiSecret = process.env.LK_API_SECRET;
const serverUrl = process.env.NEXT_PUBLIC_LK_SERVER_URL || 'ws://localhost:7880';

const createToken = async (userInfo: AccessTokenOptions, grant: VideoGrant) => {
  const at = new AccessToken(apiKey, apiSecret, userInfo);
  at.addGrant(grant);
  return await at.toJwt();
};

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

    const grant: VideoGrant = {
      room: roomName,
      roomJoin: true,
      canPublish: true,
      canPublishData: true,
      canSubscribe: true,
      canUpdateOwnMetadata: true,
    };
    const token = await createToken({ identity, name, metadata }, grant);

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
