import React, { useEffect } from 'react';
import { Decorator, StoryFn } from '@storybook/react-vite';
import { SessionProvider, RoomAudioRenderer, useSession } from '@livekit/components-react';
import { TokenSource } from 'livekit-client';

const TOKEN_SOURCE = TokenSource.endpoint('/api/agents-ui/token');

/**
 * Connects to a real local LiveKit project (via `LIVEKIT_URL`/`LIVEKIT_API_KEY`/
 * `LIVEKIT_API_SECRET`) and dispatches the agent named by `AGENT_NAME`. Only used by
 * `AgentSessionView-01`, so its full session view can be exercised against a real agent.
 */
export const LiveAgentSessionProvider: Decorator = (Story: StoryFn) => {
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
