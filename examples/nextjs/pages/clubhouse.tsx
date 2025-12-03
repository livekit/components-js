'use client';

import {
  ControlBar,
  SessionProvider,
  useSession,
  RoomAudioRenderer,
  RoomName,
  TrackLoop,
  TrackMutedIndicator,
  useIsMuted,
  useIsSpeaking,
  useTrackRefContext,
  useTracks,
} from '@livekit/components-react';
import styles from '../styles/Clubhouse.module.scss';
import { Track, TokenSource } from 'livekit-client';
import { useMemo, useState, useEffect } from 'react';
import { generateRandomUserId } from '../lib/helper';
import Image from 'next/image';

const Clubhouse = () => {
  const params = typeof window !== 'undefined' ? new URLSearchParams(location.search) : null;
  const roomName = params?.get('room') ?? 'test-room';
  const userIdentity = params?.get('user') ?? generateRandomUserId();

  const tokenSource = useMemo(() => {
    return TokenSource.endpoint(process.env.NEXT_PUBLIC_LK_TOKEN_ENDPOINT!);
  }, []);

  const session = useSession(tokenSource, {
    roomName,
    participantIdentity: userIdentity,
    participantName: userIdentity,
  });

  const [tryToConnect, setTryToConnect] = useState(false);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (tryToConnect) {
      session.start({
        tracks: {
          microphone: { enabled: true },
        },
      }).catch((err) => {
        console.error('Failed to start session:', err);
      });
    } else {
      session.end().catch((err) => {
        console.error('Failed to end session:', err);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tryToConnect, session.start, session.end]);

  useEffect(() => {
    if (session.connectionState === 'connected') {
      setConnected(true);
    } else {
      setConnected(false);
      if (session.connectionState === 'disconnected') {
        setTryToConnect(false);
      }
    }
  }, [session.connectionState]);

  return (
    <div data-lk-theme="default" className={styles.container}>
      <SessionProvider session={session}>
        <div style={{ display: 'grid', placeContent: 'center', height: '100%' }}>
          <button
            className="lk-button"
            onClick={() => {
              setTryToConnect(true);
            }}
          >
            Enter Room
          </button>
        </div>

        <div className={styles.slider} style={{ bottom: connected ? '0px' : '-100%' }}>
          <h1>
            <RoomName />
          </h1>
          <Stage />
          <ControlBar
            variation="minimal"
            controls={{ microphone: true, camera: false, screenShare: false }}
          />
          <RoomAudioRenderer />
        </div>
      </SessionProvider>
    </div>
  );
};

const Stage = () => {
  const tracksReferences = useTracks([Track.Source.Microphone]);
  return (
    <div className="">
      <div className={styles.stageGrid}>
        <TrackLoop tracks={tracksReferences}>
          <CustomParticipantTile></CustomParticipantTile>
        </TrackLoop>
      </div>
    </div>
  );
};

const CustomParticipantTile = () => {
  const trackRef = useTrackRefContext();
  const isSpeaking = useIsSpeaking(trackRef.participant);
  const isMuted = useIsMuted(trackRef);

  const id = useMemo(() => trackRef.participant.identity, [trackRef.participant.identity]);

  return (
    <section className={styles['participant-tile']} title={trackRef.participant.name}>
      <div
        // className={`rounded-full border-2 p-0.5 transition-colors duration-1000 ${
        className={styles['avatar-container']}
        style={{ borderColor: isSpeaking ? 'greenyellow' : 'transparent' }}
      >
        <div
          className={styles.avatar}
        // className="z-10 grid aspect-square items-center overflow-hidden rounded-full bg-beige transition-all will-change-transform"
        >
          <Image
            src={`https://avatars.dicebear.com/api/avataaars/${id}.svg?mouth=default,smile,tongue&eyes=default,happy,hearts&eyebrows=default,defaultNatural,flatNatural`}
            className="fade-in"
            width={150}
            height={150}
            alt={`Avatar of user: ${trackRef.participant.identity}`}
            unoptimized
          />
        </div>
      </div>

      <div style={{ opacity: isMuted ? 1 : 0 }} className={styles['mic-container']}>
        <div>
          <TrackMutedIndicator className={styles.mic} trackRef={trackRef}></TrackMutedIndicator>
        </div>
      </div>
    </section>
  );
};
export default Clubhouse;
