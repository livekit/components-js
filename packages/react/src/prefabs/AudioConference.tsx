import * as React from 'react';
import { ControlBar } from './ControlBar';

import { ParticipantAudioTile } from '../components/participant/ParticipantAudioTile';
import { LayoutContextProvider } from '../components/layout/LayoutContextProvider';
import { Chat } from './Chat';
import { ParticipantLoop } from '../components';
import { useParticipants } from '../hooks';
import { LayoutContext } from '../context';
import type { MessageFormatter } from '../components/ChatEntry';

export interface AudioConferenceProps extends React.HTMLAttributes<HTMLDivElement> {
  chatMessageFormatter?: MessageFormatter;
}

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
export function AudioConference({ chatMessageFormatter, ...props }: AudioConferenceProps) {
  const participants = useParticipants();

  return (
    <LayoutContextProvider>
      <div className="lk-audio-conference" {...props}>
        <div className="lk-audio-conference-stage">
          <ParticipantLoop participants={participants}>
            <ParticipantAudioTile />
          </ParticipantLoop>
        </div>
        <ControlBar
          controls={{ microphone: true, screenShare: false, camera: false, chat: true }}
        />
        <LayoutContext.Consumer>
          {(layoutContext) => (
            <Chat
              style={{ display: layoutContext?.state?.chat === 'open' ? 'flex' : 'none' }}
              messageFormatter={chatMessageFormatter}
            />
          )}
        </LayoutContext.Consumer>
      </div>
    </LayoutContextProvider>
  );
}
