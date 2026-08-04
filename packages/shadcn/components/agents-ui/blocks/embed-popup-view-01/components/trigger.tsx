'use client';

import { type CSSProperties, useEffect, useState } from 'react';
import { BotIcon, PhoneOffIcon, XIcon } from 'lucide-react';
import { useAgent } from '@livekit/components-react';
import { Button } from '@/components/ui/button';
import type { AgentClientError } from './embed-popup-block';

export interface TriggerProps {
  /** Brand color used for the idle ring/disc and, via contrast, the fallback icon color. */
  color: string;
  logo?: string;
  agentName?: string;
  popupOpen: boolean;
  error: AgentClientError | null;
  onToggle: () => void;
}

// Outer ring carries the connecting spinner arc; idle blends with the inner
// disc by sharing the brand color. Destructive leaves the ring fully
// transparent so the solid destructive disc reads as a clean button
// without a red halo extending past it.
function ringStyle(color: string, isConnecting: boolean, isDestructive: boolean): CSSProperties {
  if (isConnecting) {
    return {
      backgroundColor: `color-mix(in srgb, ${color} 30%, transparent)`,
      backgroundImage: `conic-gradient(from 0deg, transparent 0%, transparent 30%, ${color} 50%, transparent 70%, transparent 100%)`,
    };
  }
  if (isDestructive) {
    return { backgroundColor: 'transparent' };
  }
  return { backgroundColor: color };
}

function iconBgStyle(color: string, isConnecting: boolean, isDestructive: boolean): CSSProperties {
  if (isConnecting) {
    return { backgroundColor: 'var(--background)' };
  }
  if (isDestructive) {
    return { backgroundColor: 'var(--destructive)' };
  }
  return { backgroundColor: color };
}

// WCAG 2.0 relative luminance of a #rrggbb / #rgb color in [0, 1].
// Formula: https://www.w3.org/TR/WCAG20/#relativeluminancedef
function relativeLuminance(hex: string): number {
  const stripped = hex.replace('#', '').trim();
  const full =
    stripped.length === 3
      ? stripped
          .split('')
          .map((c) => c + c)
          .join('')
      : stripped.length === 6
        ? stripped
        : '';
  if (full.length !== 6) return 0;
  const r = parseInt(full.slice(0, 2), 16) / 255;
  const g = parseInt(full.slice(2, 4), 16) / 255;
  const b = parseInt(full.slice(4, 6), 16) / 255;
  const lin = (c: number) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

// Pick the higher-contrast foreground (black or white) for a background
// color, using the WCAG 2.0 contrast-ratio formula. Threshold derived from
// the contrast ratios against pure black (L = 0) and pure white (L = 1);
// the crossover sits at L ≈ 0.179, not at the naïve 0.5.
// Approach: https://github.com/siege-media/contrast-ratio
function readableForeground(bgHex: string): string {
  const L = relativeLuminance(bgHex);
  const contrastOnBlack = (L + 0.05) / 0.05;
  const contrastOnWhite = 1.05 / (L + 0.05);
  return contrastOnBlack >= contrastOnWhite ? '#000000' : '#ffffff';
}

export function Trigger({ color, logo, agentName, popupOpen, error, onToggle }: TriggerProps) {
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
        className={`absolute inset-0 rounded-full transition-colors ${isConnecting ? 'animate-spin' : ''}`}
        style={ringStyle(color, isConnecting, isDestructive)}
      />
      <div
        className="absolute inset-0.5 z-10 grid place-items-center rounded-full transition-colors"
        style={iconBgStyle(color, isConnecting, isDestructive)}
      >
        {isConnecting ? null : isError ? (
          // The spinning ring is the connecting signal; skip a centred glyph
          // so it reads as a clean spinner rather than a flashing X.
          <XIcon className="size-5 text-background" aria-hidden="true" />
        ) : isConnected ? (
          // Crossed-out phone on the solid destructive disc signals
          // "click to end the call".
          <PhoneOffIcon className="size-5 text-background" aria-hidden="true" />
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
            className="size-6"
            style={{ color: readableForeground(color) }}
            aria-hidden="true"
          />
        )}
      </div>
    </Button>
  );
}
