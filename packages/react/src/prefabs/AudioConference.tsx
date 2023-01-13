import * as React from 'react';
import { ControlBar } from './ControlBar';
import { FocusLayoutContainer } from '../layout/FocusLayout';
import { GridLayout } from '../layout/GridLayout';
import { TrackLoop } from '../components/TrackLoop';
import { Track } from 'livekit-client';
import { ParticipantAudioTile } from './ParticipantAudioTile';
import { LayoutContextProvider } from '../components/LayoutContextProvider';
import { PinState, WidgetState } from '@livekit/components-core';
import { Chat } from './Chat';

export type AudioConferenceProps = React.HTMLAttributes<HTMLDivElement>;

/**
 * This component is the default setup of a classic LiveKit audio conferencing app.
 * It provides functionality like switching between participant grid view and focus view.
 *
 * @remarks
 * The component is implemented with other LiveKit components like `FocusContextProvider`,
 * `GridLayout`, `ControlBar`, `FocusLayoutContainer` and `FocusLayout`.
 *
 * @example
 * ```tsx
 * <LiveKitRoom>
 *   <AudioConference />
 * <LiveKitRoom>
 * ```
 */
export function AudioConference({ ...props }: AudioConferenceProps) {
  type Layout = 'grid' | 'focus';
  const [layout, setLayout] = React.useState<Layout>('grid');
  const [widgetState, setWidgetState] = React.useState<WidgetState>({ showChat: false });

  const handlePinStateChange = (pinState: PinState) => {
    setLayout(pinState.length >= 1 ? 'focus' : 'grid');
  };

  return (
    <div className="lk-audio-conference" {...props}>
      <LayoutContextProvider onPinChange={handlePinStateChange} onWidgetChange={setWidgetState}>
        <div className="lk-audio-conference-stage">
          {layout === 'grid' ? (
            <GridLayout>
              <TrackLoop sources={[Track.Source.Microphone]} excludePinnedTracks={false}>
                <ParticipantAudioTile />
              </TrackLoop>
            </GridLayout>
          ) : (
            <FocusLayoutContainer />
          )}
          <ControlBar
            controls={{ microphone: true, screenShare: false, camera: false, chat: true }}
          />
        </div>
        {widgetState.showChat && <Chat />}
      </LayoutContextProvider>
    </div>
  );
}
