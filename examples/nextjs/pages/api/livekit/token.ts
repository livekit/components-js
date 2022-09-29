import { createToken, VideoGrant } from '@livekit/components-react';
import { NextApiRequest, NextApiResponse } from 'next';

export default async function handleToken(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { roomName, identity } = req.query;

    if (typeof identity !== 'string') {
      throw Error('provide one (and only one) identity');
    }
    if (typeof roomName !== 'string') {
      throw Error('provide one (and only one) roomName');
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
    };
    const token = createToken(identity, grant);

    res.status(200).json({ identity, accessToken: token });
  } catch (e) {
    res.statusMessage = (e as Error).message;
    res.status(500).end();
  }
}
