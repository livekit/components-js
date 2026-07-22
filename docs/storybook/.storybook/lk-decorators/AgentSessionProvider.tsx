import React, { useEffect } from 'react';
import { Decorator, StoryFn } from '@storybook/react-vite';
import { SessionProvider,RoomAudioRenderer, useSession } from '@livekit/components-react';
import { TokenSource } from 'livekit-client';

const TOKEN_SOURCE = TokenSource.endpoint('/api/agents-ui/token');

export const AgentSessionProvider: Decorator = (Story: StoryFn) => {
  const session = useSession(TOKEN_SOURCE);

  useEffect(() => {
    void session.start().catch((error) => {
      console.error('Failed to start LiveKit agent session:', error);
    });
    return () => session.end();
  }, []);

  return (
    <SessionProvider session={session}>
      <Story />
      <RoomAudioRenderer />
    </SessionProvider>
  );
};
