import {
  ConnectionState,
  ControlBar,
  GridLayout,
  LiveKitRoom,
  ParticipantTile,
  RoomName,
  TrackRefContext,
  useLocalParticipantAttributes,
  useToken,
  useTracks,
} from '@livekit/components-react';
import { Track } from 'livekit-client';
import type { NextPage } from 'next';
import { useEffect, useState } from 'react';
import styles from '../styles/Simple.module.css';
import { generateRandomUserId } from '../lib/helper';

const SimpleExample: NextPage = () => {
  const params = typeof window !== 'undefined' ? new URLSearchParams(location.search) : null;
  const roomName = params?.get('room') ?? 'test-room';
  const userIdentity = params?.get('user') ?? generateRandomUserId();
  const [connect, setConnect] = useState(false);
  const [isConnected, setIsConnected] = useState(false);

  const [userInfo] = useState({
    userInfo: {
      identity: userIdentity,
      name: userIdentity,
    },
  });

  const token = useToken(process.env.NEXT_PUBLIC_LK_TOKEN_ENDPOINT, roomName, userInfo);

  const handleDisconnect = () => {
    setConnect(false);
    setIsConnected(false);
  };

  return (
    <div className={styles.container} data-lk-theme="default">
      <main className={styles.main}>
        <h1 className={styles.title}>
          Welcome to <a href="https://livekit.io">LiveKit</a>
        </h1>
        {!isConnected && (
          <button className="lk-button" onClick={() => setConnect(!connect)}>
            {connect ? 'Disconnect' : 'Connect'}
          </button>
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
          {/* <RoomAudioRenderer /> */}
          {isConnected && <Stage />}
          <ControlBar />
        </LiveKitRoom>
      </main>
    </div>
  );
};

function Stage() {
  const cameraTracks = useTracks([Track.Source.Camera]);
  const screenShareTrackRef = useTracks([Track.Source.ScreenShare])[0];

  const [attributes, setAttributes] = useLocalParticipantAttributes();

  useEffect(() => {
    console.log('attributes updated', attributes);
  });

  return (
    <>
      {screenShareTrackRef && <ParticipantTile trackRef={screenShareTrackRef} />}
      <button onClick={() => setAttributes({ test: 'new attribute value' })}>
        update attributes
      </button>
      <GridLayout tracks={cameraTracks}>
        <TrackRefContext.Consumer>
          {(trackRef) => <ParticipantTile trackRef={trackRef} />}
        </TrackRefContext.Consumer>
      </GridLayout>
    </>
  );
}

export default SimpleExample;
