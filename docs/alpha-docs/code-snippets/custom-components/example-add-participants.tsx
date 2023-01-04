import {
  LiveKitRoom,
  ParticipantName,
  Participants,
  ParticipantView,
} from '@livekit/components-react';

const MyLiveKitApp = () => {
  const serverUrl = '';
  const accessToken = '';
  return (
    <LiveKitRoom serverUrl={serverUrl} token={accessToken} connect={true}>
      <Participants>
        <ParticipantView>
          <ParticipantName />
        </ParticipantView>
      </Participants>
    </LiveKitRoom>
  );
};
