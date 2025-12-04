import React, { useEffect, useMemo } from 'react';
import { Decorator } from '@storybook/react-vite';
import {
  useLocalParticipant,
  SessionProvider,
  useSession,
  type TrackReference,
} from '@livekit/components-react';
import { TokenSource, Track } from 'livekit-client';

const TOKEN_SOURCE = TokenSource.sandboxTokenServer(
  import.meta.env.VITE_PUBLIC_LK_SANDBOX_TOKEN_SERVER_ID,
);

export const AgentSessionProvider: Decorator = (Story: StoryFn) => {
  const session = useSession(TOKEN_SOURCE);

  useEffect(() => {
    session.start();
    return () => session.end();
  }, []);

  return (
    <SessionProvider session={session}>
      <Story />
    </SessionProvider>
  );
};

export function useMicrophone() {
  const { microphoneTrack, localParticipant } = useLocalParticipant();

  useEffect(() => {
    localParticipant.setMicrophoneEnabled(true, undefined);
  }, []);

  return useMemo(
    () =>
      ({
        participant: localParticipant,
        source: Track.Source.Microphone,
        publication: microphoneTrack,
      }) as TrackReference,
    [microphoneTrack],
  );
}
