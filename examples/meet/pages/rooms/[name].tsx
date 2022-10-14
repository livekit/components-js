import { LiveKitRoom, useParticipants, useToken } from '@livekit/components-react';

import type { NextPage } from 'next';
import { HTMLAttributes, useState } from 'react';

const Room: NextPage = () => {
  const params = typeof window !== 'undefined' ? new URLSearchParams(location.search) : null;
  const roomName = params?.get('room') || 'test-room';
  const userIdentity = params?.get('user') || 'test-user';
  const [connect, setConnect] = useState(false);
  const [isConnected, setIsConnected] = useState(false);

  const token = useToken(process.env.NEXT_PUBLIC_LK_TOKEN_ENDPOINT, roomName, {
    identity: userIdentity,
  });

  const handleDisconnect = () => {
    setConnect(false);
    setIsConnected(false);
  };

  return (
    <main>
      <LiveKitRoom
        token={token}
        serverUrl={process.env.NEXT_PUBLIC_LK_SERVER_URL}
        connect={true}
        onConnected={() => setIsConnected(true)}
        onDisconnected={handleDisconnect}
        video={true}
        audio={true}
      ></LiveKitRoom>
    </main>
  );
};

const ParticipantCount = (props: HTMLAttributes<HTMLDivElement>) => {
  const participants = useParticipants();
  return (
    <div {...props}>
      <svg width="100%" height="100%" viewBox="0 -10 10 10">
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          fill="white"
          stroke="none"
          d="M 1 0 Q 1 -3 5 -3 Q 9 -3 9 0 L 1 0 Z M 5 -4 A 1 1 0 0 0 5 -8 A 1 1 0 0 0 5 -4"
        ></path>
      </svg>
      <div>{participants.length}</div>
    </div>
  );
};

export default Room;
