import * as React from 'react';
import { setLogLevel } from '@livekit/components-core';
import { LiveKitRoom, PreJoin, useToken, VideoConference } from '@livekit/components-react';
import type { NextPage } from 'next';

const PreJoinExample: NextPage = () => {
  //   const params = typeof window !== 'undefined' ? new URLSearchParams(location.search) : null;
  //   const roomName = params?.get('room') ?? 'test-room';
  //   const userIdentity = params?.get('user') ?? 'test-identity';
  setLogLevel('debug', { liveKitClientLogLevel: 'warn' });
  //   const [controlBarOptions, setControlBarOptions] = React.useState<ControlBarControls>({
  //     chat: true,
  //   });

  //   const token = useToken(process.env.NEXT_PUBLIC_LK_TOKEN_ENDPOINT, roomName, {
  //     userInfo: {
  //       identity: userIdentity,
  //       name: userIdentity,
  //     },
  //   });

  //   React.useEffect(() => {
  //     import('@livekit/track-processors').then((pkg) => {
  //       setControlBarOptions({
  //         camera: { processors: { 'Background Blur': pkg.BackgroundBlur(10) } },
  //         chat: true,
  //       });
  //     });
  //   }, []);

  return (
    <div data-lk-theme="default" style={{ height: '100vh' }}>
      <PreJoin />
    </div>
  );
};

export default MinimalExample;
