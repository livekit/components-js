import {
  ParticipantView,
  ConnectionQualityIndicator,
  LiveKitRoom,
  ConnectionState,
  ScreenShareView,
  ParticipantName,
  TrackMutedIndicator,
  RoomName,
  RoomAudioRenderer,
  MediaTrack,
  useToken,
  ControlBar,
  GridLayout,
  ParticipantsLoop,
} from '@livekit/components-react';
import { Track } from 'livekit-client';
import type { NextPage } from 'next';
import { useState } from 'react';
import styles from '../styles/Simple.module.css';

const SimpleExample: NextPage = () => {
  const params = typeof window !== 'undefined' ? new URLSearchParams(location.search) : null;
  const roomName = params?.get('room') ?? 'test-room';
  const userIdentity = params?.get('user') ?? 'test-identity';
  const [connect, setConnect] = useState(false);
  const [isConnected, setIsConnected] = useState(false);

  const token = useToken({
    tokenEndpoint: process.env.NEXT_PUBLIC_LK_TOKEN_ENDPOINT,
    roomName,
    userInfo: {
      identity: userIdentity,
      name: 'my-name',
    },
  });

  const handleDisconnect = () => {
    setConnect(false);
    setIsConnected(false);
  };

  return (
    <div className={styles.container}>
      <main className={styles.main}>
        <h1 className={styles.title}>
          Welcome to <a href="https://livekit.io">LiveKit</a>
        </h1>
        {!isConnected && (
          <button onClick={() => setConnect(!connect)}>{connect ? 'Disconnect' : 'Connect'}</button>
        )}
        <LiveKitRoom
          token={token}
          serverUrl={process.env.NEXT_PUBLIC_LK_SERVER_URL}
          connect={connect}
          onConnected={() => setIsConnected(true)}
          onDisconnected={handleDisconnect}
          audio={true}
          video={true}
        >
          <RoomName />
          <ConnectionState />
          <RoomAudioRenderer />
          {isConnected && (
            <>
              <ScreenShareView />
              <GridLayout>
                <ParticipantsLoop>
                  <ParticipantView />
                </ParticipantsLoop>
              </GridLayout>
            </>
          )}
          <ControlBar />
        </LiveKitRoom>
      </main>
    </div>
  );
};

export default SimpleExample;
