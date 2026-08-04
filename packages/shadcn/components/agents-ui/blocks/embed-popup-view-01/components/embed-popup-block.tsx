'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { type TokenSourceConfigurable, type TokenSourceFixed } from 'livekit-client';
import { useSession } from '@livekit/components-react';
import { AgentSessionProvider } from '@/components/agents-ui/agent-session-provider';
import { PopupView } from './popup-view';
import { Trigger } from './trigger';

export interface AgentClientError {
  title: string;
  description: string;
}

export interface AgentClientProps {
  /** Where to fetch a LiveKit session token from. See `useSession`'s `tokenSource` argument. */
  tokenSource: TokenSourceConfigurable | TokenSourceFixed;
  /**
   * Brand color for the trigger bubble and audio visualizer.
   *
   * @default '#3b82f6'
   */
  color?: `#${string}`;
  /** Logo shown in the trigger bubble in place of the default agent icon. */
  logo?: string;
  /**
   * @default 'Agent'
   */
  agentName?: string;
  /**
   * @default true
   */
  supportsChatInput?: boolean;
  /**
   * @default true
   */
  supportsVideoInput?: boolean;
  /**
   * @default true
   */
  supportsScreenShare?: boolean;
}

export function AgentClient({
  tokenSource,
  color = '#3b82f6',
  logo,
  agentName = 'Agent',
  supportsChatInput = true,
  supportsVideoInput = true,
  supportsScreenShare = true,
}: AgentClientProps) {
  const session = useSession(tokenSource);

  const [popupOpen, setPopupOpen] = useState(false);
  const [error, setError] = useState<AgentClientError | null>(null);

  // Drive the session lifecycle off the popup-open state. Opening the popup
  // connects; closing it (or unmounting) tears the room down so we don't
  // leave a mic-hot connection while the bubble sits idle.
  //
  // useSession returns a fresh object on every connectionState change (the
  // discriminated union swaps shape), so we can't depend on `session`
  // directly - that would tear down + restart the room every time it
  // transitioned through connecting -> connected. We pin the start/end
  // calls via a ref instead, and only react to popupOpen.
  const sessionRef = useRef(session);
  sessionRef.current = session;
  useEffect(() => {
    if (!popupOpen) return;
    let cancelled = false;
    sessionRef.current.start().catch((cause) => {
      if (cancelled) return;

      console.error('embed-popup-view-01: session.start failed:', cause);
      setError({
        title: 'Could not connect to the agent',
        description: cause instanceof Error ? cause.message : String(cause),
      });
    });
    return () => {
      cancelled = true;
      void sessionRef.current.end();
    };
  }, [popupOpen]);

  const handleToggle = useCallback(() => {
    setPopupOpen((open) => {
      const next = !open;
      if (!next) setError(null);
      return next;
    });
  }, []);

  return (
    <AgentSessionProvider session={session}>
      <Trigger
        color={color}
        logo={logo}
        agentName={agentName}
        popupOpen={popupOpen}
        error={error}
        onToggle={handleToggle}
      />
      {popupOpen && (
        <PopupView
          agentName={agentName}
          logo={logo}
          color={color}
          error={error}
          supportsChatInput={supportsChatInput}
          supportsVideoInput={supportsVideoInput}
          supportsScreenShare={supportsScreenShare}
        />
      )}
    </AgentSessionProvider>
  );
}
