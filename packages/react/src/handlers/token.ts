import { createToken, Grant } from '@livekit/components-core/dist/token';
import type { NextApiRequest, NextApiResponse } from 'next';

export interface HandleTokenOptions {
  grant?: Omit<Grant, 'room'>;
  userAllowList?: Array<string>; // TODO maybe this needs to be a map with Map<roomName, identity[]>?
  userBlockList?: Array<string>; // TODO maybe this needs to be a map with Map<roomName, identity[]>?
}

export default function handleToken(
  options: HandleTokenOptions = {
    grant: {
      roomJoin: true,
      canPublish: true,
      canSubscribe: true,
      canPublishData: true,
      roomCreate: true,
    },
  },
) {
  return async (req: NextApiRequest, res: NextApiResponse): Promise<void> => {
    try {
      const { roomName, identity } = req.query;

      if (typeof identity !== 'string') {
        throw Error('provide one (and only one) identity');
      }
      if (typeof roomName !== 'string') {
        throw Error('provide one (and only one) roomName');
      }

      const { grant, userAllowList, userBlockList } = options;
      if (userBlockList && userBlockList.includes(identity)) {
        res.status(403).end();
        return;
      }
      if (userAllowList && !userAllowList.includes(identity)) {
        res.status(403).end();
        return;
      }

      const token = createToken(identity, { ...grant, room: roomName });

      res.status(200).json({ identity, accessToken: token });
    } catch (e) {
      res.statusMessage = (e as Error).message;
      res.status(500).end();
    }
  };
}
