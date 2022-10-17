import {
  DeviceSelector,
  DisconnectButton,
  LiveKitRoom,
  LocalUserChoices,
  MediaControlButton,
  MediaTrack,
  ParticipantName,
  Participants,
  ParticipantView,
  PinContext,
  PinContextProvider,
  PinState,
  PreJoin,
  RoomAudioRenderer,
  StartAudio,
  useParticipantContext,
  useParticipants,
  useScreenShare,
  useToken,
} from '@livekit/components-react';
import {
  AudioCaptureOptions,
  Participant,
  Room,
  Track,
  TrackPublication,
  VideoCaptureOptions,
} from 'livekit-client';

import type { NextPage } from 'next';
import { HTMLAttributes, useContext, useMemo, useRef, useState } from 'react';
import styles from '../styles/Huddle.module.scss';

const Huddle: NextPage = () => {
  const params = typeof window !== 'undefined' ? new URLSearchParams(location.search) : null;

  const [roomName] = useState(params?.get('room') || 'test-room');

  const [preJoinChoices, setPreJoinChoices] = useState<LocalUserChoices | undefined>(undefined);

  return (
    <main className={styles.main}>
      {preJoinChoices ? (
        <HuddleRoomView userChoices={preJoinChoices} roomName={roomName} />
      ) : (
        <PreJoin className={styles.prejoin} onSubmit={setPreJoinChoices} />
      )}
    </main>
  );
};

function isParticipantTrackPinned(
  participant: Participant,
  pinState: PinState | undefined,
  source: Track.Source,
): boolean {
  if (pinState === undefined) {
    console.warn(`pinState not set: `, pinState);
    return false;
  }

  if (pinState.pinnedParticipant === undefined || pinState.pinnedTrackSource === undefined) {
    console.warn(`pinState not set: `, pinState);
    return false;
  }

  if (pinState.pinnedTrackSource !== source) {
    return false;
  }

  if (pinState.pinnedParticipant.identity === participant.identity) {
    console.log(`Participant has same identity as pinned.`, pinState);
    switch (pinState.pinnedTrackSource) {
      case Track.Source.Camera:
        return participant.isCameraEnabled;
        break;
      case Track.Source.ScreenShare:
        return participant.isScreenShareEnabled;
        break;

      default:
        return false;
        break;
    }
  } else {
    return false;
  }
}

const CustomGridView = ({ room }: { room?: Room }) => {
  const { screenShareTrack, allScreenShares } = useScreenShare({ room });
  const participants = useParticipants();
  const gridContainerRef = useRef(null);

  const props = useMemo(() => {
    const cssProperties = {};
    console.log(`Adjust layout for ${participants.length}`);
    const length = participants.length;

    if (length <= 20) {
      // @ts-ignore
      cssProperties['--participant-size'] = '15rem';
    }
    if (length <= 10) {
      // @ts-ignore
      cssProperties['--participant-size'] = '16rem';
    }
    if (length <= 2) {
      // @ts-ignore
      cssProperties['--participant-size'] = '24rem';
    }

    return cssProperties;
  }, [participants.length]);

  return (
    <div ref={gridContainerRef} className={styles.gridLayout} style={props}>
      <Participants>
        <CustomParticipantView />
      </Participants>
      <Participants
        filter={(ps) => ps.filter((p) => p.isScreenShareEnabled)}
        filterDependencies={[screenShareTrack, allScreenShares]}
      >
        <CustomScreenShareView />
      </Participants>
    </div>
  );
};

const CustomFocusView = ({
  screenShareTrack,
}: {
  screenShareTrack: TrackPublication | undefined;
}) => {
  const { state: pinState } = useContext(PinContext);
  return (
    <div className={styles.focusLayout}>
      <div className={styles.screenShareContainer}>
        <CustomFocus></CustomFocus>
      </div>
      <aside>
        <section>
          <Participants
            filter={(ps) =>
              ps.filter((p) => {
                return !isParticipantTrackPinned(p, pinState, Track.Source.Camera);
              })
            }
            filterDependencies={[screenShareTrack, pinState]}
          >
            <CustomParticipantView />
          </Participants>
          <Participants
            filter={(ps) =>
              ps.filter((p) => {
                return (
                  p.isScreenShareEnabled &&
                  !isParticipantTrackPinned(p, pinState, Track.Source.ScreenShare)
                );
              })
            }
            filterDependencies={[screenShareTrack, pinState]}
          >
            <CustomScreenShareView />
          </Participants>
        </section>
      </aside>
    </div>
  );
};

const BackToGridLayoutButton = () => {
  const { dispatch } = useContext(PinContext);
  return (
    <button
      onClick={() => {
        if (dispatch) dispatch({ msg: 'clear_pin' });
      }}
      className={styles.backToGridViewBtn}
    >
      🔙 to grid view
    </button>
  );
};

const CustomFocus = () => {
  const { state } = useContext(PinContext);

  return (
    <>
      {state?.pinnedParticipant && state.pinnedTrackSource && (
        <MediaTrack
          className={styles.focusView}
          participant={state?.pinnedParticipant}
          source={state.pinnedTrackSource}
        />
      )}
    </>
  );
};

const CustomScreenShareView = () => {
  const participant = useParticipantContext();

  return (
    <ParticipantView
      participant={participant}
      className={styles.participantView}
      trackSource={Track.Source.ScreenShare}
    >
      <MediaTrack source={Track.Source.ScreenShare} className={styles.video}></MediaTrack>
      <div className={styles.screenShareBanner}>
        <ParticipantName style={{ display: 'inline' }} />
        <span>Screen share</span>
      </div>
    </ParticipantView>
  );
};

const CustomParticipantView = () => {
  const participant = useParticipantContext();
  return (
    <ParticipantView participant={participant} className={styles.participantView}>
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
  );
};

const DeviceSelectButton = (props: HTMLAttributes<HTMLDivElement>) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div style={{ position: 'relative', flexShrink: 0 }}>
      <button className={`lk-button ${styles.mediaBtn}`} onClick={() => setIsOpen(!isOpen)} />
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

const HuddleRoomView = ({
  roomName,
  userChoices,
}: {
  userChoices: LocalUserChoices;
  roomName: string;
}) => {
  const room = useMemo(
    () =>
      new Room({
        audioCaptureDefaults: { deviceId: userChoices.audioDeviceId },
        videoCaptureDefaults: { deviceId: userChoices.videoDeviceId },
      }),
    [],
  );

  const { screenShareTrack, allScreenShares } = useScreenShare({ room });
  const [connect, setConnect] = useState(false);
  const [isConnected, setIsConnected] = useState(false);

  type Layout = 'grid' | 'focus';
  const [layout, setLayout] = useState<Layout>('grid');
  const token = useToken(process.env.NEXT_PUBLIC_LK_TOKEN_ENDPOINT, roomName, {
    identity: userChoices.username,
  });

  const handleDisconnect = () => {
    setConnect(false);
    setIsConnected(false);
  };

  const handlePinStateChange = (pinState: PinState) => {
    setLayout(pinState.pinnedParticipant ? 'focus' : 'grid');
  };

  return (
    <LiveKitRoom
      room={room}
      token={token}
      serverUrl={process.env.NEXT_PUBLIC_LK_SERVER_URL}
      connect={true}
      onConnected={() => setIsConnected(true)}
      onDisconnected={handleDisconnect}
      video={userChoices.videoEnabled}
      audio={userChoices.audioEnabled}
    >
      <RoomAudioRenderer />
      <PinContextProvider onChange={handlePinStateChange}>
        <div className={styles.roomLayout}>
          <div className={styles.headerBar}>
            <ParticipantCount className={styles.participantCount} />
            {layout === 'focus' && <BackToGridLayoutButton />}
          </div>

          {layout === 'grid' ? (
            <CustomGridView />
          ) : (
            <CustomFocusView screenShareTrack={screenShareTrack}></CustomFocusView>
          )}
          <div className={styles.mediaControls}>
            <div>
              <MediaControlButton className={styles.audioBtn} source={Track.Source.Microphone} />
              <MediaControlButton className={styles.videoBtn} source={Track.Source.Camera} />
              <MediaControlButton className={styles.screenBtn} source={Track.Source.ScreenShare} />
              <DeviceSelectButton />
              <DisconnectButton className={styles.disconnectBtn}>Leave</DisconnectButton>
              <StartAudio label="Start Audio" />
              {/* <button
                onClick={() => {
                  setLayout(layout === 'focus' ? 'grid' : 'focus');
                }}
              >
                Layout: {layout}
              </button> */}
            </div>
          </div>
        </div>
      </PinContextProvider>
    </LiveKitRoom>
  );
};

export default Huddle;
