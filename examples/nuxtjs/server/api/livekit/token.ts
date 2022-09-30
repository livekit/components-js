import { createToken, VideoGrant } from '@livekit/components-core/dist/token';

export default defineEventHandler(async (event) => {
  let { identity, name, metadata, roomName } = useQuery(event);
  if (Array.isArray(identity)) {
    identity = identity[0];
  }
  if (Array.isArray(roomName)) {
    roomName = roomName[0];
  }

  try {
    if (typeof identity !== 'string') {
      throw Error('provide one (and only one) identity!');
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

    console.log({ identity, roomName });

    const grant: VideoGrant = {
      roomJoin: true,
      canPublish: true,
      canPublishData: true,
      canSubscribe: true,
      room: roomName,
    };

    const token = createToken({ identity, name, metadata }, grant);

    return { status: 200, identity, accessToken: token };
  } catch (e) {
    return { status: 500, error: e };
  }
});
