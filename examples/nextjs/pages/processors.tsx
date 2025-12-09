'use client';

import { useState, useEffect, useMemo } from 'react';
import { setLogLevel } from '@livekit/components-core';
import {
  GridLayout,
  SessionProvider,
  useSession,
  ParticipantTile,
  TrackRefContext,
  useLocalParticipant,
  useTracks,
  SessionEvent,
  useEvents,
} from '@livekit/components-react';
import type { NextPage } from 'next';
import {
  LocalVideoTrack,
  Track,
  TrackProcessor,
  TokenSource,
  MediaDeviceFailure,
} from 'livekit-client';
import { BackgroundBlur } from '@livekit/track-processors';
import { generateRandomUserId } from '../lib/helper';

function Stage() {
  const cameraTracks = useTracks([Track.Source.Camera]);
  const screenShareTrackRef = useTracks([Track.Source.ScreenShare])[0];

  const [blurEnabled, setBlurEnabled] = useState(false);
  const [processorPending, setProcessorPending] = useState(false);
  const { cameraTrack } = useLocalParticipant();
  const [blur, setBlur] = useState<TrackProcessor<Track.Kind.Video> | undefined>();

  useEffect(() => {
    setBlur(BackgroundBlur());
  }, []);

  useEffect(() => {
    const localCamTrack = cameraTrack?.track as LocalVideoTrack | undefined;
    if (localCamTrack) {
      setProcessorPending(true);
      try {
        if (blurEnabled && !localCamTrack.getProcessor() && blur) {
          localCamTrack.setProcessor(blur);
        } else if (!blurEnabled) {
          localCamTrack.stopProcessor();
        }
      } finally {
        setProcessorPending(false);
      }
    }
  }, [blurEnabled, cameraTrack, blur]);

  return (
    <>
      <button
        className="lk-button"
        disabled={processorPending}
        onClick={() => setBlurEnabled((enabled) => !enabled)}
      >
        Toggle Blur
      </button>
      {screenShareTrackRef && <ParticipantTile trackRef={screenShareTrackRef} />}
      <GridLayout tracks={cameraTracks}>
        <TrackRefContext.Consumer>
          {(trackRef) => <ParticipantTile trackRef={trackRef} />}
        </TrackRefContext.Consumer>
      </GridLayout>
    </>
  );
}

const tokenSource = TokenSource.endpoint(process.env.NEXT_PUBLIC_LK_TOKEN_ENDPOINT!);

const ProcessorsExample: NextPage = () => {
  const params = useMemo(
    () => (typeof window !== 'undefined' ? new URLSearchParams(location.search) : null),
    [],
  );
  const roomName = params?.get('room') ?? 'test-room';
  const [userIdentity] = useState(() => params?.get('user') ?? generateRandomUserId());

  const session = useSession(tokenSource, {
    roomName,
    participantIdentity: userIdentity,
    participantName: userIdentity,
  });

  useEffect(() => {
    session
      .start({
        tracks: {
          camera: { enabled: true },
          microphone: { enabled: false },
        },
      })
      .catch((err) => {
        console.error('Failed to start session:', err);
      });
    return () => {
      session.end().catch((err) => {
        console.error('Failed to end session:', err);
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session.start, session.end]);

  useEvents(session, SessionEvent.MediaDevicesError, (error) => {
    const failure = MediaDeviceFailure.getFailure(error);
    console.error(failure);
    alert(
      'Error acquiring camera or microphone permissions. Please make sure you grant the necessary permissions in your browser and reload the tab',
    );
  }, []);

  return (
    <div data-lk-theme="default" style={{ height: '100vh' }}>
      <SessionProvider session={session}>
        <Stage />
      </SessionProvider>
    </div>
  );
};

export default ProcessorsExample;
