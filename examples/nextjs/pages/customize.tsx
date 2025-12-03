'use client';

import {
  SessionProvider,
  useSession,
  ParticipantName,
  TrackMutedIndicator,
  RoomAudioRenderer,
  isTrackReference,
  useConnectionQualityIndicator,
  VideoTrack,
  ControlBar,
  GridLayout,
  useTracks,
  TrackRefContext,
} from '@livekit/components-react';
import { ConnectionQuality, Room, Track, TokenSource } from 'livekit-client';
import styles from '../styles/Simple.module.css';
import myStyles from '../styles/Customize.module.css';
import type { NextPage } from 'next';
import { HTMLAttributes, useState, useMemo, useEffect } from 'react';
import { generateRandomUserId } from '../lib/helper';

const CustomizeExample: NextPage = () => {
  const params = typeof window !== 'undefined' ? new URLSearchParams(location.search) : null;
  const roomName = params?.get('room') ?? 'test-room';
  const userIdentity = params?.get('user') ?? generateRandomUserId();

  const [room] = useState(new Room());

  const tokenSource = useMemo(() => {
    return TokenSource.endpoint(process.env.NEXT_PUBLIC_LK_TOKEN_ENDPOINT!);
  }, []);

  const session = useSession(tokenSource, {
    roomName,
    participantIdentity: userIdentity,
    participantName: userIdentity,
    room,
  });

  const [connect, setConnect] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const handleDisconnect = () => {
    setConnect(false);
    setIsConnected(false);
  };

  useEffect(() => {
    if (connect) {
      session.start({
        tracks: {
          microphone: { enabled: true },
        },
      });
    } else {
      session.end();
    }
  }, [connect, session]);

  useEffect(() => {
    if (session.connectionState === 'connected') {
      setIsConnected(true);
    } else {
      setIsConnected(false);
    }
  }, [session.connectionState]);

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
        <SessionProvider session={session}>
          <RoomAudioRenderer />
          {/* Render a custom Stage component once connected */}
          {isConnected && <Stage />}
          <ControlBar />
        </SessionProvider>
      </main>
    </div>
  );
};

export function Stage() {
  const tracks = useTracks([
    { source: Track.Source.Camera, withPlaceholder: true },
    { source: Track.Source.ScreenShare, withPlaceholder: false },
  ]);
  return (
    <>
      <div className={styles.participantGrid}>
        <GridLayout tracks={tracks}>
          <TrackRefContext.Consumer>
            {(trackRef) =>
              trackRef && (
                <div className="my-tile">
                  {isTrackReference(trackRef) ? (
                    <VideoTrack trackRef={trackRef} />
                  ) : (
                    <p>Camera placeholder</p>
                  )}
                  <div className={myStyles['participant-indicators']}>
                    <div style={{ display: 'flex' }}>
                      <TrackMutedIndicator
                        trackRef={{
                          participant: trackRef.participant,
                          source: Track.Source.Microphone,
                        }}
                      />
                      <TrackMutedIndicator trackRef={trackRef} />
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
                </div>
              )
            }
          </TrackRefContext.Consumer>
        </GridLayout>
      </div>
    </>
  );
}

export function UserDefinedConnectionQualityIndicator(props: HTMLAttributes<HTMLSpanElement>) {
  /**
   *  We use the same React hook that is used internally to build our own component.
   *  By using this hook, we inherit all the state management and logic and can focus on our implementation.
   */
  const { quality } = useConnectionQualityIndicator();

  function qualityToText(quality: ConnectionQuality): string {
    switch (quality) {
      case ConnectionQuality.Poor:
        return 'Poor';
      case ConnectionQuality.Good:
        return 'Good';
      case ConnectionQuality.Excellent:
        return 'Excellent';
      case ConnectionQuality.Lost:
        return 'Reconnecting';
      default:
        return 'No idea';
    }
  }

  return <span {...props}> {qualityToText(quality)} </span>;
}

export default CustomizeExample;
