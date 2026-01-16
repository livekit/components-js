import React, { useEffect } from 'react';
import { Decorator, StoryFn } from '@storybook/react-vite';
import { SessionProvider, useSession } from '@livekit/components-react';
import { TokenSource } from 'livekit-client';

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
