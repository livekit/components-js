import { NextApiRequest, NextApiResponse } from 'next';
import { AccessToken } from 'livekit-server-sdk';
import type { AccessTokenOptions, VideoGrant } from 'livekit-server-sdk';

const apiKey = process.env.LIVEKIT_API_KEY;
const apiSecret = process.env.LIVEKIT_API_SECRET;
const url = process.env.LIVEKIT_URL;

const createToken = async (userInfo: AccessTokenOptions, grant: VideoGrant) => {
  const at = new AccessToken(apiKey, apiSecret, userInfo);
  at.addGrant(grant);
  return await at.toJwt();
};

export default async function handleToken(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { roomName, identity, name, metadata } = req.query;

    if (typeof identity !== 'string') {
      throw Error('provide one (and only one) identity');
    }
    if (typeof roomName !== 'string') {
      throw Error('provide one (and only one) roomName');
    }

    if (Array.isArray(name)) {
      throw Error('provide max one name');
    }
    if (Array.isArray(metadata)) {
      throw Error('provide max one metadata string');
    }

    // if (!userSession.isAuthenticated) {
    //   res.status(403).end();
    //   return;
    // }
    const grant: VideoGrant = {
      room: roomName,
      roomJoin: true,
      canPublish: true,
      canPublishData: true,
      canSubscribe: true,
      canUpdateOwnMetadata: true,
    };
    const token = await createToken({ identity, name, metadata }, grant);

    res.status(200).json({ identity, accessToken: token, url });
  } catch (e) {
    res.statusMessage = (e as Error).message;
    res.status(500).end();
  }
}
