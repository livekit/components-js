import { createToken, Grant } from '@livekit/components-core/dist/token';

async function handleToken(roomName: string, identity: string, grant?: Omit<Grant, 'room'>) {
  try {
    if (typeof identity !== 'string') {
      throw Error('provide one (and only one) identity!');
    }
    if (typeof roomName !== 'string') {
      throw Error('provide one (and only one) roomName');
    }

    console.log({ identity, roomName });

    const token = createToken(identity, { ...grant, room: roomName });

    return { status: 200, identity, accessToken: token };
  } catch (e) {
    return { status: 500, error: e };
  }
}
export default defineEventHandler(async (event) => {
  let { identity, roomName } = useQuery(event);
  if (Array.isArray(identity)) {
    identity = identity[0];
  }
  if (Array.isArray(roomName)) {
    roomName = roomName[0];
  }
  const tokenResponse = await handleToken(roomName, identity, {
    roomJoin: true,
    canPublish: true,
    canPublishData: true,
    canSubscribe: true,
  });
  console.log(tokenResponse);
  return {
    ...tokenResponse,
  };
});
