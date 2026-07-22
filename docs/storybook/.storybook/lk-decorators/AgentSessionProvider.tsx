import React, { useEffect } from 'react';
import { Decorator, StoryFn } from '@storybook/react-vite';
import { SessionProvider, useSession } from '@livekit/components-react';
import { TokenSource } from 'livekit-client';

const SANDBOX_TOKEN_SOURCE = TokenSource.sandboxTokenServer(
  import.meta.env.VITE_PUBLIC_LK_SANDBOX_TOKEN_SERVER_ID,
);

/**
 * Connects to the shared LiveKit sandbox project. Used by most stories, since it works out of the
 * box without a local LiveKit project or `AGENT_NAME` dispatch configuration.
 */
export const AgentSessionProvider: Decorator = (Story: StoryFn) => {
  const session = useSession(SANDBOX_TOKEN_SOURCE);

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
