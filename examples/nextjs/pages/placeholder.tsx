import {
  ControlBar,
  LiveKitRoom,
  NewTileLoop,
  useToken,
  VideoConference,
} from '@livekit/components-react';
import { Track } from 'livekit-client';
import type { NextPage } from 'next';

const Placeholder: NextPage = () => {
  const params = typeof window !== 'undefined' ? new URLSearchParams(location.search) : null;
  const roomName = params?.get('room') ?? 'test-room';
  const userIdentity = params?.get('user') ?? 'test-identity';

  const token = useToken(process.env.NEXT_PUBLIC_LK_TOKEN_ENDPOINT, roomName, {
    userInfo: {
      identity: userIdentity,
      name: userIdentity,
    },
  });

  return (
    <div style={{ padding: '2rem' }}>
      <LiveKitRoom
        video={true}
        audio={true}
        token={token}
        serverUrl={process.env.NEXT_PUBLIC_LK_SERVER_URL}
      >
        <NewTileLoop
          sources={[
            { source: Track.Source.Camera, withPlaceholder: true },
            { source: Track.Source.ScreenShare, withPlaceholder: true },
          ]}
        ></NewTileLoop>
        <ControlBar />
      </LiveKitRoom>
    </div>
  );
};

export default Placeholder;
