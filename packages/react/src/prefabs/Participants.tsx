import { Track } from 'livekit-client';
import * as React from 'react';
import { useMaybeLayoutContext } from '../context';
import { ParticipantsToggle } from '../components';
import { ParticipantName } from '../components/participant/ParticipantName';
import { TrackMutedIndicator } from '../components/participant/TrackMutedIndicator';
import { useParticipants } from '../hooks/useParticipants';
import { useSortedParticipants } from '../hooks/useSortedParticipants';
import { ParticipantContext } from '../context';
import ChatCloseIcon from '../assets/icons/ChatCloseIcon';

/** @public */
export interface ParticipantsProps extends React.HTMLAttributes<HTMLDivElement> {}

/**
 * The `Participants` component displays a list of all participants in the room
 * with their name and audio/video muted indicators.
 *
 * @example
 * ```tsx
 * <LiveKitRoom>
 *   <Participants />
 * </LiveKitRoom>
 * ```
 * @public
 */
export function Participants({ ...props }: ParticipantsProps) {
  const participants = useParticipants();
  const sortedParticipants = useSortedParticipants(participants);
  const layoutContext = useMaybeLayoutContext();

  return (
    <div {...props} className="lk-participants">
      <div className="lk-participants-header">
        Participants ({participants.length})
        {layoutContext && (
          <ParticipantsToggle className="lk-close-button">
            <ChatCloseIcon />
          </ParticipantsToggle>
        )}
      </div>
      <ul className="lk-list lk-participants-list">
        {sortedParticipants.map((participant) => (
          <li key={participant.identity} className="lk-participant-entry">
            <ParticipantContext.Provider value={participant}>
              <ParticipantName />
              <TrackMutedIndicator
                trackRef={{ participant, source: Track.Source.Microphone }}
              />
              <TrackMutedIndicator
                trackRef={{ participant, source: Track.Source.Camera }}
              />
            </ParticipantContext.Provider>
          </li>
        ))}
      </ul>
    </div>
  );
}
