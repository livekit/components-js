import {
  GridLayout,
  LiveKitRoom,
  ParticipantContext,
  ParticipantsLoop,
  ParticipantView,
  useToken,
} from '@livekit/components-react';
import React from 'react';
import styles from '../styles/Clubhouse.module.scss';

const Clubhouse = () => {
  const params = typeof window !== 'undefined' ? new URLSearchParams(location.search) : null;
  const roomName = params?.get('room') ?? 'test-room';
  const userIdentity = params?.get('user') ?? 'test-identity';

  const token = useToken({
    tokenEndpoint: process.env.NEXT_PUBLIC_LK_TOKEN_ENDPOINT,
    roomName: roomName,
    userInfo: {
      identity: userIdentity,
      name: 'my-name',
    },
  });

  return (
    <div className={styles.container}>
      <LiveKitRoom
        token={token}
        serverUrl={process.env.NEXT_PUBLIC_LK_SERVER_URL}
        video={false}
        simulateParticipants={5}
      >
        <GridLayout>
          <ParticipantsLoop>
            <ParticipantView></ParticipantView>
          </ParticipantsLoop>
        </GridLayout>
      </LiveKitRoom>
    </div>
  );
};

const CustomParticipantView = () => {
  return <div></div>;
};
export default Clubhouse;
