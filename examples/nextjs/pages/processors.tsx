'use client';

import * as React from 'react';
import { setLogLevel } from '@livekit/components-core';
import {
  GridLayout,
  SessionProvider,
  useSession,
  ParticipantTile,
  TrackRefContext,
  useLocalParticipant,
  useTracks,
} from '@livekit/components-react';
import type { NextPage } from 'next';
import { ControlBarControls } from '@livekit/components-react';
import { LocalVideoTrack, Track, TrackProcessor, TokenSource } from 'livekit-client';
import { BackgroundBlur } from '@livekit/track-processors';

function Stage() {
  const cameraTracks = useTracks([Track.Source.Camera]);
  const screenShareTrackRef = useTracks([Track.Source.ScreenShare])[0];

  const [blurEnabled, setBlurEnabled] = React.useState(false);
  const [processorPending, setProcessorPending] = React.useState(false);
  const { cameraTrack } = useLocalParticipant();
  const [blur, setBlur] = React.useState<TrackProcessor<Track.Kind.Video> | undefined>();

  React.useEffect(() => {
    setBlur(BackgroundBlur());
  }, []);

  React.useEffect(() => {
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

const ProcessorsExample: NextPage = () => {
  const params = typeof window !== 'undefined' ? new URLSearchParams(location.search) : null;
  const roomName = params?.get('room') ?? 'test-room';
  const userIdentity = params?.get('user') ?? 'test-identity';

  const tokenSource = React.useMemo(() => {
    return TokenSource.endpoint(process.env.NEXT_PUBLIC_LK_TOKEN_ENDPOINT!);
  }, []);

  const session = useSession(tokenSource, {
    roomName,
    participantIdentity: userIdentity,
    participantName: userIdentity,
  });

  React.useEffect(() => {
    session.start({
      tracks: {
        camera: { enabled: true },
        microphone: { enabled: false },
      },
    });
    return () => {
      session.end();
    };
  }, [session]);

  return (
    <div data-lk-theme="default" style={{ height: '100vh' }}>
      <SessionProvider session={session}>
        <Stage />
      </SessionProvider>
    </div>
  );
};

export default ProcessorsExample;
