import { LiveKitRoom } from '@livekit/components-react';

export const MyLiveKitApp = () => {
  const serverUrl = '';
  const accessToken = '';
  return (
    <LiveKitRoom serverUrl={serverUrl} token={accessToken} connect={true}>
      <div>Hello World</div>
    </LiveKitRoom>
  );
};
