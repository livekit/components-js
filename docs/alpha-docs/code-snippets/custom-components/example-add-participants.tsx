import {
  LiveKitRoom,
  ParticipantName,
  Participants,
  ParticipantTile,
} from '@livekit/components-react';

const MyLiveKitApp = () => {
  const serverUrl = '';
  const accessToken = '';
  return (
    <LiveKitRoom serverUrl={serverUrl} token={accessToken} connect={true}>
      <Participants>
        <ParticipantTile>
          <ParticipantName />
        </ParticipantTile>
      </Participants>
    </LiveKitRoom>
  );
};
