import {
  ParticipantTile,
  LiveKitRoom,
  ScreenShareView,
  ParticipantName,
  TrackMutedIndicator,
  RoomAudioRenderer,
  useConnectionQualityIndicator,
  VideoTrack,
  useToken,
  ControlBar,
  GridLayout,
  ParticipantLoop,
} from '@livekit/components-react';
import { ConnectionQuality, Track } from 'livekit-client';
import styles from '../styles/Simple.module.css';
import myStyles from '../styles/Customize.module.css';
import type { NextPage } from 'next';
import { HTMLAttributes, useState } from 'react';

const CustomizeExample: NextPage = () => {
  const params = typeof window !== 'undefined' ? new URLSearchParams(location.search) : null;
  const roomName = params?.get('room') ?? 'test-room';
  const userIdentity = params?.get('user') ?? 'test-identity';
  const token = useToken(process.env.NEXT_PUBLIC_LK_TOKEN_ENDPOINT, roomName, {
    userInfo: {
      identity: userIdentity,
      name: 'my-name',
    },
  });

  const [connect, setConnect] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
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
          <RoomAudioRenderer />
          {isConnected && (
            <>
              <ScreenShareView />
              <div className={styles.participantGrid}>
                <GridLayout>
                  <ParticipantLoop>
                    <ParticipantTile>
                      <VideoTrack source={Track.Source.Camera}></VideoTrack>

                      <div className={myStyles['participant-indicators']}>
                        <div style={{ display: 'flex' }}>
                          <TrackMutedIndicator
                            source={Track.Source.Microphone}
                          ></TrackMutedIndicator>
                          <TrackMutedIndicator source={Track.Source.Camera}></TrackMutedIndicator>
                        </div>
                        {/* Overwrite styles: By passing class names, we can easily overwrite/extend the existing styles. */}
                        {/* In addition, we can still specify a style attribute and further customize the styles. */}
                        <ParticipantName
                          className={myStyles['my-participant-name']}
                          // style={{ color: 'blue' }}
                        />
                        {/* Custom components: Here we replace the provided <ConnectionQualityIndicator />  with our own implementation. */}
                        <UserDefinedConnectionQualityIndicator />
                      </div>
                    </ParticipantTile>
                  </ParticipantLoop>
                </GridLayout>
              </div>
            </>
          )}
          <ControlBar />
        </LiveKitRoom>
      </main>
    </div>
  );
};

export function UserDefinedConnectionQualityIndicator(props: HTMLAttributes<HTMLSpanElement>) {
  /**
   *  We use the same React hook that is used internally to build our own component.
   *  By using this hook, we inherit all the state management and logic and can focus on our implementation.
   */
  const { quality } = useConnectionQualityIndicator();

  function qualityToText(quality: ConnectionQuality): string {
    switch (quality) {
      case ConnectionQuality.Unknown:
        return 'No idea';
      case ConnectionQuality.Poor:
        return 'Poor';
      case ConnectionQuality.Good:
        return 'Good';
      case ConnectionQuality.Excellent:
        return 'Excellent';
    }
  }

  return <span {...props}> {qualityToText(quality)} </span>;
}

export default CustomizeExample;
