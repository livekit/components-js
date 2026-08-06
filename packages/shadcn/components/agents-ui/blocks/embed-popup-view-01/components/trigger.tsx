'use client';

import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';
import { BotIcon, PhoneOffIcon, XIcon } from 'lucide-react';
import { useAgent } from '@livekit/components-react';
import { Button } from '@/components/ui/button';
import type { AgentClientError } from './embed-popup-block';

export interface TriggerProps {
  /** Brand color used for the idle ring/disc and, via contrast, the fallback icon color. */
  logo?: string;
  color?: string;
  agentName?: string;
  popupOpen: boolean;
  error: AgentClientError | null;
  onToggle: () => void;
}

export function Trigger({ logo, agentName, popupOpen, color, error, onToggle }: TriggerProps) {
  const { isConnected: isAgentConnected } = useAgent();
  const altText = agentName ? `${agentName} agent` : 'Open assistant';

  const isError = popupOpen && error !== null;
  const isConnected = popupOpen && error === null && isAgentConnected;
  const isConnecting = popupOpen && !isError && !isConnected;
  const isDestructive = isError || isConnected;

  const [logoFailed, setLogoFailed] = useState(false);
  useEffect(() => {
    setLogoFailed(false);
  }, [logo]);
  const showLogo = Boolean(logo) && !logoFailed;

  return (
    <Button
      type="button"
      size="lg"
      variant="ghost"
      onClick={onToggle}
      aria-label={popupOpen ? 'Close assistant' : altText}
      aria-expanded={popupOpen}
      className="fixed right-4 bottom-4 z-50 m-0 block size-12 rounded-full p-0.5 drop-shadow-sm transition-transform duration-200 hover:scale-105 focus-visible:scale-105"
    >
      <div
        className={cn(
          'absolute inset-0 rounded-full transition-colors bg-current',
          isConnecting && 'animate-spin',
          isConnecting &&
            'bg-current/30 bg-conic from-transparent via-current to-transparent from-30% via-50% to-70%',
          isDestructive && 'bg-transparent',
        )}
        style={{ color }}
      />
      <div
        className={cn(
          'absolute inset-0.5 z-10 grid place-items-center rounded-full transition-colors',
          isConnecting && 'bg-background text-background',
          isDestructive && 'bg-destructive text-white',
        )}
      >
        {isConnecting ? null : isError ? (
          // The spinning ring is the connecting signal; skip a centred glyph
          // so it reads as a clean spinner rather than a flashing X.
          <XIcon className="size-5" aria-hidden="true" />
        ) : isConnected ? (
          // Crossed-out phone on the solid destructive disc signals
          // "click to end the call".
          <PhoneOffIcon className="size-5" aria-hidden="true" />
        ) : showLogo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={logo}
            alt={altText}
            className="size-6 rounded-sm object-contain"
            referrerPolicy="no-referrer"
            onError={() => setLogoFailed(true)}
          />
        ) : (
          // Pick black vs white based on the user-set brand color so the
          // icon stays readable across a bright yellow, deep navy, etc.
          <BotIcon
            className="size-6 text-background"
            aria-hidden="true"
            style={
              color
                ? {
                    color: `contrast-color(${color})`,
                  }
                : undefined
            }
          />
        )}
      </div>
    </Button>
  );
}
