import {
  LiveKitRoom,
  useToken,
  setLogLevel,
  useParticipantTracks,
  useTrackTranscription,
} from '@livekit/components-react';
import { Track } from 'livekit-client';
import type { NextPage } from 'next';
import { generateRandomUserId } from '../lib/helper';
import { useMemo } from 'react';

const TranscriptionExample: NextPage = () => {
  const params = typeof window !== 'undefined' ? new URLSearchParams(location.search) : null;
  const roomName = useMemo(() => params?.get('room') ?? generateRandomUserId(), []);
  setLogLevel('info', { liveKitClientLogLevel: 'debug' });
  const userId = useMemo(() => params?.get('user') ?? 'test-user', []);

  const tokenOptions = useMemo(() => {
    return {
      userInfo: {
        identity: userId,
        name: userId,
      },
    };
  }, [userId]);

  const token = useToken(process.env.NEXT_PUBLIC_LK_TOKEN_ENDPOINT, roomName, tokenOptions);

  return (
    <div data-lk-theme="default" style={{ height: '100vh' }}>
      <LiveKitRoom
        video={false}
        audio={true}
        token={token}
        serverUrl={process.env.NEXT_PUBLIC_LK_SERVER_URL}
        onMediaDeviceFailure={(e) => {
          console.error(e);
          alert(
            'Error acquiring camera or microphone permissions. Please make sure you grant the necessary permissions in your browser and reload the tab',
          );
        }}
      >
        <div style={{ display: 'grid', gridTemplateColumns: '50% 50%' }}>
          <div>
            <h2>All</h2>
            <ParticipantTranscriptions identity={userId} activeOnly={false} />
          </div>
          <div>
            <h2>Active only</h2>
            <ParticipantTranscriptions identity={userId} activeOnly={true} />
          </div>
        </div>
      </LiveKitRoom>
    </div>
  );
};

function ParticipantTranscriptions({
  identity,
  activeOnly = true,
  ...props
}: React.HtmlHTMLAttributes<HTMLDivElement> & { identity: string; activeOnly?: boolean }) {
  const audioTracks = useParticipantTracks([Track.Source.Microphone], identity);
  const transcriptions = useTrackTranscription(audioTracks[0]);
  const segments = activeOnly ? transcriptions.activeSegments : transcriptions.segments;

  return (
    <div {...props}>
      {segments.map((segment) => (
        <p key={segment.id}>{segment.text}</p>
      ))}
    </div>
  );
}

export default TranscriptionExample;
