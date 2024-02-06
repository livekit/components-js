import * as React from 'react';
import { ControlBar } from './ControlBar';

import { ParticipantAudioTile } from '../components/participant/ParticipantAudioTile';
import { LayoutContextProvider } from '../components/layout/LayoutContextProvider';
import type { WidgetState } from '@livekit/components-core';
import { Chat } from './Chat';
import { TrackLoop } from '../components';
import { useTracks } from '../hooks';
import { useWarnAboutMissingStyles } from '../hooks/useWarnAboutMissingStyles';
import { Track } from 'livekit-client';

/** @public */
export interface AudioConferenceProps extends React.HTMLAttributes<HTMLDivElement> {}

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
 * @public
 */
export function AudioConference({ ...props }: AudioConferenceProps) {
  const [widgetState, setWidgetState] = React.useState<WidgetState>({
    showChat: false,
    unreadMessages: 0,
  });

  const audioTracks = useTracks([Track.Source.Microphone]);

  useWarnAboutMissingStyles();

  return (
    <LayoutContextProvider onWidgetChange={setWidgetState}>
      <div className="lk-audio-conference" {...props}>
        <div className="lk-audio-conference-stage">
          <TrackLoop tracks={audioTracks}>
            <ParticipantAudioTile />
          </TrackLoop>
        </div>
        <ControlBar
          controls={{ microphone: true, screenShare: false, camera: false, chat: true }}
        />
        {widgetState.showChat && <Chat />}
      </div>
    </LayoutContextProvider>
  );
}
