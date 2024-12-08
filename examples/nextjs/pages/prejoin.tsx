'use client';

import * as React from 'react';
import { PreJoin, setLogLevel } from '@livekit/components-react';
import type { NextPage } from 'next';
import { Track, TrackProcessor } from 'livekit-client';
import { BackgroundBlur } from '@livekit/track-processors';

const PreJoinExample: NextPage = () => {
  setLogLevel('debug', { liveKitClientLogLevel: 'warn' });

  const [backgroundBlur, setBackgroundBlur] = React.useState<
    TrackProcessor<Track.Kind.Video> | undefined
  >(undefined);

  React.useEffect(() => {
    setBackgroundBlur(BackgroundBlur());
  }, []);

  return (
    <div data-lk-theme="default" style={{ height: '100vh' }}>
      <PreJoin
        videoProcessor={backgroundBlur}
        defaults={{ videoDeviceId: '' }}
        onSubmit={(values) => {
          values.audioDeviceId;
        }}
        onValidate={(values) => {
          return true;
        }}
      />
    </div>
  );
};

export default PreJoinExample;
