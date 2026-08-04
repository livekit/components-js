'use client';

import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { StartAudio } from '@livekit/components-react';
import { type AgentControlBarControls } from '@/components/agents-ui/agent-control-bar';
import { AgentSessionView_01 } from '@/components/agents-ui/blocks/agent-session-view-01/components/agent-session-block';
import { cn } from '@/lib/utils';
import type { AgentClientError } from './embed-popup-block';

interface ErrorOverlayProps {
  logo?: string;
  agentName?: string;
  error: AgentClientError | null;
}

function ErrorOverlay({ logo, agentName, error }: ErrorOverlayProps) {
  const [logoFailed, setLogoFailed] = useState(false);
  useEffect(() => {
    setLogoFailed(false);
  }, [logo]);
  const showLogo = Boolean(logo) && !logoFailed;

  return (
    <div
      data-testid="error-overlay"
      // @ts-expect-error React's types lag the platform on `inert`.
      inert={error === null ? '' : undefined}
      className={cn(
        'bg-background absolute inset-0 z-50 flex h-full w-full flex-col items-center justify-center gap-5 px-6 text-center transition-opacity',
        error === null ? 'pointer-events-none opacity-0' : 'opacity-100',
      )}
    >
      {showLogo ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={logo}
          alt={`${agentName ?? 'Agent'} logo`}
          className="size-6 object-contain"
          referrerPolicy="no-referrer"
          onError={() => setLogoFailed(true)}
        />
      ) : null}
      <span className="text-foreground leading-tight font-medium text-pretty">{error?.title}</span>
      <span className="text-muted-foreground text-sm text-balance">{error?.description}</span>
    </div>
  );
}

export interface PopupViewProps {
  agentName?: string;
  logo?: string;
  color?: `#${string}`;
  error: AgentClientError | null;
  controls: AgentControlBarControls;
  onDisconnect?: () => void;
}

export function PopupView({
  agentName,
  logo,
  color,
  error,
  controls,
  onDisconnect,
}: PopupViewProps) {
  return (
    <motion.div
      initial={{ opacity: 0, translateY: 8 }}
      animate={{ opacity: 1, translateY: 0 }}
      exit={{ opacity: 0, translateY: 8 }}
      transition={{ type: 'spring', bounce: 0, duration: 0.4 }}
      className="fixed right-4 bottom-20 left-4 z-50 h-[480px] rounded-[28px] border drop-shadow-md md:left-auto md:w-[360px]"
    >
      <div className="relative flex h-full w-full flex-col overflow-hidden rounded-[28px]">
        <ErrorOverlay logo={logo} agentName={agentName} error={error} />
        <StartAudio label="Start audio" />
        <AgentSessionView_01
          controls={controls}
          audioVisualizerColor={color}
          audioVisualizerBarCount={3}
          onDisconnect={onDisconnect}
        />
      </div>
    </motion.div>
  );
}
