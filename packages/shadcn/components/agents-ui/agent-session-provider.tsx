import {
  RoomAudioRenderer,
  SessionProvider,
  type SessionProviderProps,
} from '@livekit/components-react';

export function AgentSessionProvider({ session, children }: SessionProviderProps) {
  return (
    <SessionProvider session={session}>
      {children}
      <RoomAudioRenderer />
    </SessionProvider>
  );
}
