import * as React from 'react';
import { Track } from 'livekit-client';

import { ConnectionQualityIndicator } from '../components/participant/ConnectionQualityIndicator';
import { ParticipantName } from '../components/participant/ParticipantName';
import { TrackMutedIndicator } from '../components/participant/TrackMutedIndicator';
import { useEnsureParticipant } from '../context';

import { AudioVisualizer } from '../components/participant/AudioVisualizer';
import {
  ParticipantTileProps,
  useParticipantTile,
  ParticipantContextIfNeeded,
} from './ParticipantTile';
import { AudioTrack } from '../components/participant/AudioTrack';

/**
 * The ParticipantTile component is the base utility wrapper for displaying a visual representation of a participant.
 * This component can be used as a child of the `ParticipantLoop` component or independently if a participant is passed as a property.
 *
 * @example
 * ```tsx
 * {...}
 *   <ParticipantTile>
 *     {...}
 *   </ParticipantTile>
 * {...}
 * ```
 *
 * @see `ParticipantLoop` component
 */
export const ParticipantAudioTile = ({
  participant,
  children,
  onParticipantClick,
  ...htmlProps
}: ParticipantTileProps) => {
  const p = useEnsureParticipant(participant);
  const { elementProps } = useParticipantTile({
    participant: p,
    props: htmlProps,
    trackSource: Track.Source.Microphone,
    onParticipantClick,
  });

  return (
    <div style={{ position: 'relative' }} {...elementProps}>
      <ParticipantContextIfNeeded participant={participant}>
        {children ?? (
          <>
            <AudioTrack source={Track.Source.Microphone}></AudioTrack>
            <AudioVisualizer />
            <div className="lk-participant-metadata">
              <div className="lk-participant-metadata-item">
                <TrackMutedIndicator source={Track.Source.Microphone}></TrackMutedIndicator>
                <ParticipantName />
              </div>
              <div className="lk-participant-metadata-item">
                <ConnectionQualityIndicator />
              </div>
            </div>
          </>
        )}
      </ParticipantContextIfNeeded>
    </div>
  );
};
