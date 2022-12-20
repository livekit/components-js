import { LiveKitRoom, useToken } from '@livekit/components-react';
import type { NextPage } from 'next';

const MinimalExample: NextPage = () => {
  const params = typeof window !== 'undefined' ? new URLSearchParams(location.search) : null;
  const roomName = params?.get('room') ?? 'test-room';
  const userIdentity = params?.get('user') ?? 'test-identity';

  const token = useToken({
    tokenEndpoint: process.env.NEXT_PUBLIC_LK_TOKEN_ENDPOINT,
    roomName: roomName,
    userInfo: {
      identity: userIdentity,
      name: userIdentity,
    },
  });

  return (
    <div style={{ padding: '2rem' }}>
      <LiveKitRoom token={token} serverUrl={process.env.NEXT_PUBLIC_LK_SERVER_URL} />
    </div>
  );
};

export default MinimalExample;
