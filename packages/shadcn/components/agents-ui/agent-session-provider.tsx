import { SessionProvider, type SessionProviderProps } from '@livekit/components-react';

import {
  AgentSessionAudio,
  AgentSessionAudioProps,
} from '@/components/agents-ui/agent-session-audio';

export type AgentSessionProviderProps = SessionProviderProps & AgentSessionAudioProps;

export function AgentSessionProvider({
  session,
  children,
  ...audioProps
}: AgentSessionProviderProps) {
  return (
    <SessionProvider session={session}>
      {children}
      <AgentSessionAudio {...audioProps} />
    </SessionProvider>
  );
}
