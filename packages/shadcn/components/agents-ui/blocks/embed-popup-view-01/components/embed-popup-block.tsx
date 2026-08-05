'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { type TokenSourceConfigurable, type TokenSourceFixed } from 'livekit-client';
import { useSession } from '@livekit/components-react';
import { AgentSessionProvider } from '@/components/agents-ui/agent-session-provider';
import { type AgentControlBarControls } from '@/components/agents-ui/agent-control-bar';
import { PopupView } from './popup-view';
import { Trigger } from './trigger';

const DEFAULT_CONTROLS: AgentControlBarControls = {
  leave: false,
  microphone: true,
  chat: true,
  camera: true,
  screenShare: true,
};

export interface AgentClientError {
  title: string;
  description: string;
}

export interface AgentClientProps {
  /**
   * @default 'Agent'
   */
  agentName?: string;
  /** Where to fetch a LiveKit session token from. See `useSession`'s `tokenSource` argument. */
  tokenSource: TokenSourceConfigurable | TokenSourceFixed;
  /** Logo shown in the trigger bubble in place of the default agent icon. */
  logo?: string;
  /**
   * Theme mode forwarded to the aura visualizer (`audioVisualizerType="aura"`) so
   * the shader's blend mode adapts to the theme mode.
   * Ignored by other visualizer types.
   */
  themeMode?: 'dark' | 'light';
  /**
   * Message shown above the controls before the first chat message is sent.
   *
   * @default 'Agent is listening, ask it a question'
   */
  preConnectMessage?: string;
  /**
   * An object with the following keys: leave, microphone, screenShare, camera, chat. Each key maps to a boolean value that determines whether the control is displayed.
   *
   * @default {
   *   leave: true,
   *   microphone: true,
   *   chat: false,
   *   camera: false,
   *   screenShare: false,
   * }
   */
  controls: AgentControlBarControls;
  /**
   * Brand color for the trigger bubble and audio visualizer.
   *
   * @default '#3b82f6'
   */
  triggerColor?: `#${string}`;
  /**
   * Shows a pre-connect buffer state with a shimmer message before messages appear.
   *
   * @default true
   */
  isPreConnectBufferEnabled?: boolean;
  /** Selects the visualizer style rendered in the main tile area. */
  audioVisualizerType?: 'bar' | 'wave' | 'grid' | 'radial' | 'aura';
  /** Primary hex color used by supported audio visualizer variants. */
  audioVisualizerColor?: `#${string}`;
  /** Hue shift intensity used by certain visualizers. */
  audioVisualizerColorShift?: number;
  /** Number of bars to render when `audioVisualizerType` is `bar`. */
  audioVisualizerBarCount?: number;
  /** Number of rows in the visualizer when `audioVisualizerType` is `grid`. */
  audioVisualizerGridRowCount?: number;
  /** Number of columns in the visualizer when `audioVisualizerType` is `grid`. */
  audioVisualizerGridColumnCount?: number;
  /** Number of radial bars when `audioVisualizerType` is `radial`. */
  audioVisualizerRadialBarCount?: number;
  /** Base radius of the radial visualizer when `audioVisualizerType` is `radial`. */
  audioVisualizerRadialRadius?: number;
  /** Stroke width of the wave path when `audioVisualizerType` is `wave`. */
  audioVisualizerWaveLineWidth?: number;
}

export function AgentClient({
  agentName = 'Agent',
  tokenSource,
  logo,
  controls = DEFAULT_CONTROLS,
  triggerColor,
  isPreConnectBufferEnabled,
  preConnectMessage,
  audioVisualizerType,
  audioVisualizerColor,
  audioVisualizerColorShift,
  audioVisualizerBarCount,
  audioVisualizerGridRowCount,
  audioVisualizerGridColumnCount,
  audioVisualizerRadialBarCount,
  audioVisualizerRadialRadius,
  audioVisualizerWaveLineWidth,
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

  const finalControls = {
    ...DEFAULT_CONTROLS,
    ...controls,
  };

  return (
    <AgentSessionProvider session={session}>
      <Trigger
        color={triggerColor}
        logo={logo}
        agentName={agentName}
        popupOpen={popupOpen}
        error={error}
        onToggle={handleToggle}
      />
      {popupOpen && (
        <PopupView
          logo={logo}
          error={error}
          agentName={agentName}
          isPreConnectBufferEnabled={isPreConnectBufferEnabled}
          preConnectMessage={preConnectMessage}
          audioVisualizerColor={audioVisualizerColor}
          audioVisualizerType={audioVisualizerType}
          audioVisualizerColorShift={audioVisualizerColorShift}
          audioVisualizerBarCount={audioVisualizerBarCount}
          audioVisualizerGridRowCount={audioVisualizerGridRowCount}
          audioVisualizerGridColumnCount={audioVisualizerGridColumnCount}
          audioVisualizerRadialBarCount={audioVisualizerRadialBarCount}
          audioVisualizerRadialRadius={audioVisualizerRadialRadius}
          audioVisualizerWaveLineWidth={audioVisualizerWaveLineWidth}
          controls={finalControls}
          onDisconnect={handleToggle}
        />
      )}
    </AgentSessionProvider>
  );
}
