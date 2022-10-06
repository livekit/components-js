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
  useParticipants,
  useParticipantContext,
  DeviceSelector,
  ScreenShareView,
} from '@livekit/components-react';
import { Participant, Room, Track, TrackPublication } from 'livekit-client';

import type { NextPage } from 'next';
import Head from 'next/head';
import React, { HTMLAttributes, useEffect, useMemo, useState } from 'react';
import styles from '../styles/Huddle.module.scss';

const Huddle: NextPage = () => {
  const params = typeof window !== 'undefined' ? new URLSearchParams(location.search) : null;

  const roomName = params?.get('room') || 'test-room';
  const userIdentity = params?.get('user') || 'test-user';
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

  const token = useToken(process.env.NEXT_PUBLIC_LK_TOKEN_ENDPOINT, roomName, {
    identity: userIdentity,
  });

  const handleDisconnect = () => {
    setConnect(false);
    setIsConnected(false);
  };

  return (
    <main className={styles.main}>
      <LiveKitRoom
        token={token}
        serverUrl={process.env.NEXT_PUBLIC_LK_SERVER_URL}
        connect={true}
        onConnected={() => setIsConnected(true)}
        onDisconnected={handleDisconnect}
        video={true}
        audio={true}
      >
        <div className={styles.roomLayout}>
          <div className={styles.headerBar}>
            <ParticipantCount className={styles.participantCount} />
          </div>
          <ScreenShareView className={styles.screenshareContainer} />

          <div className={styles.participantContainerInner}>
            <Participants>
              <ParticipantView className={styles.participantView}>
                <MediaTrack source={Track.Source.Camera} className={styles.video}></MediaTrack>
                <div className={styles.nameContainer}>
                  <img
                    className={styles.nameMutedIcon}
                    src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 20 20' fill='none'%3E%3Cpath d='M5.35086 10.3436C5.12445 9.77312 5 9.15109 5 8.5V8.25C5 7.83579 4.66421 7.5 4.25 7.5C3.83579 7.5 3.5 7.83579 3.5 8.25V8.5C3.5 9.60794 3.7772 10.6511 4.26603 11.564L5.35086 10.3436ZM7.62904 14.554C8.36362 14.8419 9.16335 15 10 15C13.5899 15 16.5 12.0899 16.5 8.5V8.25C16.5 7.83579 16.1642 7.5 15.75 7.5C15.3358 7.5 15 7.83579 15 8.25V8.5C15 11.2614 12.7614 13.5 10 13.5C9.55549 13.5 9.12453 13.442 8.71427 13.3331L7.62904 14.554Z' fill='currentColor'%3E%3C/path%3E%3Cpath d='M10 14.25V17' stroke='currentColor' stroke-width='1.5' stroke-linecap='round'%3E%3C/path%3E%3Cpath d='M12.25 17.25L7.75 17.25' stroke='currentColor' stroke-width='1.5' stroke-linecap='round'%3E%3C/path%3E%3Cpath d='M12.1271 2.72031C11.5376 2.2685 10.8001 2 10 2C8.067 2 6.5 3.567 6.5 5.5V8.5C6.5 8.67302 6.51255 8.84311 6.5368 9.0094L8 7.3633V5.5C8 4.39543 8.89543 3.5 10 3.5C10.4175 3.5 10.8051 3.62793 11.1258 3.84674L12.1271 2.72031ZM9.90052 11.9986C9.93357 11.9995 9.96673 12 10 12C11.933 12 13.5 10.433 13.5 8.5V7.9492L9.90052 11.9986Z' fill='currentColor'%3E%3C/path%3E%3Cpath class='p-huddle_mic_icon__microphone--slash p-huddle_mic_icon__microphone--slash_animated' d='M4 15.25L15.5 2.25' stroke='currentColor' stroke-width='1.5' stroke-linecap='round'%3E%3C/path%3E%3C/svg%3E"
                  />
                  <ParticipantName className={styles.name}></ParticipantName>
                </div>
                <svg width="100%" height="100%" viewBox="0 -10 10 10">
                  <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    fill="white"
                    stroke="none"
                    d="M 1 0 Q 1 -3 5 -3 Q 9 -3 9 0 L 1 0 Z M 5 -4 A 1 1 0 0 0 5 -8 A 1 1 0 0 0 5 -4"
                  ></path>
                </svg>
              </ParticipantView>
            </Participants>
          </div>
          <div className={styles.mediaControls}>
            <div>
              <MediaControlButton className={styles.audioBtn} source={Track.Source.Microphone} />
              <MediaControlButton className={styles.videoBtn} source={Track.Source.Camera} />
              <MediaControlButton className={styles.screenBtn} source={Track.Source.ScreenShare} />
              <DeviceSelectButton />
              <DisconnectButton className={styles.disconnectBtn}>Leave</DisconnectButton>
            </div>

            <RoomAudioRenderer />
          </div>
        </div>
      </LiveKitRoom>
      {/* <div className={styles.devInfo}>
        <p>Dev Info:</p>
        <ul>
          <li>Connected: {isConnected ? 'true' : 'false'}</li>
        </ul>
      </div> */}
    </main>
  );
};

const DeviceSelectButton = (props: HTMLAttributes<HTMLDivElement>) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div style={{ position: 'relative', flexShrink: 0 }}>
      <button className={styles.mediaBtn} onClick={() => setIsOpen(!isOpen)} />
      {isOpen && (
        <div
          style={{
            position: 'absolute',
            margin: '1rem',
            bottom: '100%',
            left: '-50%',
            width: '20rem',
            backgroundColor: 'white',
            borderRadius: '0.5rem',
            padding: '.2rem .3rem',
            boxShadow: 'rgba(100, 100, 111, 0.2) 0px 7px 29px 0px',
          }}
        >
          <DeviceSelector kind="audioinput" heading="Audio Inputs:"></DeviceSelector>
          <DeviceSelector kind="videoinput" heading="Video Inputs:"></DeviceSelector>
        </div>
      )}
    </div>
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

export default Huddle;
