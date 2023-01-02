import { LiveKitRoom } from '@livekit/components-react';

const MyFirstLiveKitApp = () => {
  const serverUrl = '';
  const accessToken = '';
  return (
    <LiveKitRoom
      serverUrl={serverUrl}
      token={accessToken}
      connect={true}
    ></LiveKitRoom>
  );
};
