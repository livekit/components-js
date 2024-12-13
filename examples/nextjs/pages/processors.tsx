'use client';

import * as React from 'react';
import { setLogLevel } from '@cc-livekit/components-core';
import {
  GridLayout,
  LiveKitRoom,
  ParticipantTile,
  TrackRefContext,
  useLocalParticipant,
  useToken,
  useTracks,
} from '@cc-livekit/components-react';
import type { NextPage } from 'next';
import { ControlBarControls } from '@cc-livekit/components-react';
import { LocalVideoTrack, Track } from 'livekit-client';
import { BackgroundBlur } from '@livekit/track-processors';

function Stage() {
  const cameraTracks = useTracks([Track.Source.Camera]);
  const screenShareTrackRef = useTracks([Track.Source.ScreenShare])[0];

  const [blurEnabled, setBlurEnabled] = React.useState(false);
  const [processorPending, setProcessorPending] = React.useState(false);
  const { cameraTrack } = useLocalParticipant();
  const [blur] = React.useState(BackgroundBlur());

  React.useEffect(() => {
    const localCamTrack = cameraTrack?.track as LocalVideoTrack | undefined;
    if (localCamTrack) {
      setProcessorPending(true);
      try {
        if (blurEnabled && !localCamTrack.getProcessor()) {
          localCamTrack.setProcessor(blur);
        } else if (!blurEnabled) {
          localCamTrack.stopProcessor();
        }
      } finally {
        setProcessorPending(false);
      }
    }
  }, [blurEnabled, cameraTrack]);

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

  const token = useToken(process.env.NEXT_PUBLIC_LK_TOKEN_ENDPOINT, roomName, {
    userInfo: {
      identity: userIdentity,
      name: userIdentity,
    },
  });

  return (
    <div data-lk-theme="default" style={{ height: '100vh' }}>
      <LiveKitRoom
        video={true}
        audio={false}
        token={token}
        connect={true}
        serverUrl={process.env.NEXT_PUBLIC_LK_SERVER_URL}
      >
        <Stage />
      </LiveKitRoom>
    </div>
  );
};

export default ProcessorsExample;
