'use client';
import type { ReactNode } from 'react';
import { TokenSource } from 'livekit-client';
import { useSession, SessionProvider as LiveKitSessionProvider } from '@livekit/components-react';

type SessionProviderProps = {
  children: ReactNode;
};

export function SessionProvider({ children }: SessionProviderProps) {
  const tokenSource = TokenSource.endpoint(process.env.NEXT_PUBLIC_LK_TOKEN_ENDPOINT);
  const session = useSession(tokenSource);

  return <LiveKitSessionProvider session={session}>{children}</LiveKitSessionProvider>;
}
