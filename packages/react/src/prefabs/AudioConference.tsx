import * as React from 'react';
import { ControlBar } from './ControlBar';
import { GridLayout } from '../components/layout/GridLayout';
import { Track } from 'livekit-client';
import { ParticipantAudioTile } from '../components/participant/ParticipantAudioTile';
import { LayoutContextProvider } from '../components/layout/LayoutContextProvider';
import { WidgetState } from '@livekit/components-core';
import { Chat } from './Chat';
import { useTracks } from '../hooks';

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
  const [widgetState, setWidgetState] = React.useState<WidgetState>({ showChat: false });

  const tracks = useTracks([Track.Source.Microphone]);

  return (
    <div className="lk-audio-conference" {...props}>
      <LayoutContextProvider onWidgetChange={setWidgetState}>
        <div className="lk-audio-conference-stage">
          <div className="lk-grid-layout-wrapper">
            <GridLayout tracks={tracks}>
              <ParticipantAudioTile />
            </GridLayout>
          </div>
          <ControlBar
            controls={{ microphone: true, screenShare: false, camera: false, chat: true }}
          />
        </div>
        {widgetState.showChat && <Chat />}
      </LayoutContextProvider>
    </div>
  );
}
