import {
  ParticipantView,
  ConnectionQualityIndicator,
  LiveKitRoom,
  MediaControlButton,
  TrackSource,
  Participants,
  ConnectionState,
  DisconnectButton,
  useToken,
  ParticipantName,
  MediaMutedIndicator,
  RoomName,
  RoomAudioRenderer,
  MediaTrack,
  isLocal,
  isRemote,
  DeviceMenu,
  useScreenShare,
} from '@livekit/components-react';
import { Participant, Room, Track, TrackPublication } from 'livekit-client';

import type { NextPage } from 'next';
import Head from 'next/head';
import React, { useEffect, useMemo, useState } from 'react';
import styles from '../styles/Huddle.module.scss';

const Huddle: NextPage = () => {
  const params = typeof window !== 'undefined' ? new URLSearchParams(location.search) : null;

  const roomName = params?.get('room') ?? 'test-room';
  const userIdentity = params?.get('user') ?? 'test-user';
  const [connect, setConnect] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [focusedParticipant, setFocusedParticipant] = useState<Participant | undefined>(undefined);
  const [focusPublication, setFocusPublication] = useState<TrackPublication | undefined>(undefined);

  const room = useMemo(() => new Room(), []);

  const { screenShareTrack, screenShareParticipant } = useScreenShare({ room });

  useEffect(() => {
    if (
      (!screenShareTrack &&
        focusPublication &&
        focusPublication.source !== Track.Source.ScreenShare) ||
      (screenShareTrack && focusPublication === screenShareTrack)
    ) {
      return;
    }
    setFocusPublication(screenShareTrack);
    setFocusedParticipant(screenShareParticipant);
  }, [screenShareTrack, screenShareParticipant, focusPublication]);

  const token = useToken(roomName, userIdentity, 'myname');

  const handleDisconnect = () => {
    setConnect(false);
    setIsConnected(false);
  };

  return (
    <main className={styles.main}>
      <div className={styles.participantContainer}>
        <LiveKitRoom
          token={token}
          serverUrl={process.env.NEXT_PUBLIC_LK_SERVER_URL}
          connect={true}
          onConnected={() => setIsConnected(true)}
          onDisconnected={handleDisconnect}
          video={true}
          audio={true}
        >
          <RoomAudioRenderer />
          <div className={styles.participantContainerInner}>
            <Participants>
              <ParticipantView className={styles.participantView}>
                <MediaTrack source={Track.Source.Camera} className={styles.video}></MediaTrack>
                <ParticipantName className={styles.name}></ParticipantName>
              </ParticipantView>
            </Participants>
          </div>
          <div className={styles.mediaControls}>
            <div>
              <MediaControlButton className={styles.audioBtn} source={Track.Source.Microphone}>
                {' '}
              </MediaControlButton>
              <MediaControlButton className={styles.videoBtn} source={Track.Source.Camera}>
                {' '}
              </MediaControlButton>
              <MediaControlButton className={styles.screenBtn} source={Track.Source.ScreenShare}>
                {' '}
              </MediaControlButton>
              <DisconnectButton className={styles.disconnectBtn}>Leave</DisconnectButton>
            </div>
          </div>
        </LiveKitRoom>
      </div>
      <div className={styles.devInfo}>
        <p>Dev Info:</p>
        <ul>
          <li>Connected: {isConnected ? 'true' : 'false'}</li>
        </ul>
      </div>
    </main>
  );
};

export default Huddle;
