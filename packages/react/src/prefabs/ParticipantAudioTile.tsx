import * as React from 'react';
import { Track } from 'livekit-client';

import { ConnectionQualityIndicator } from '../components/participant/ConnectionQualityIndicator';
import { MediaTrack } from '../components/participant/MediaTrack';
import { ParticipantName } from '../components/participant/ParticipantName';
import { TrackMutedIndicator } from '../components/participant/TrackMutedIndicator';
import { useEnsureParticipant } from '../contexts';
import {
  ParticipantContextIfNeeded,
  ParticipantTileProps,
  useParticipantTile,
} from '../components/participant/ParticipantTile';
import { AudioVisualizer } from '../components/participant/AudioVisualizer';

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
  const { elementProps } = useParticipantTile({ participant: p, props: htmlProps });

  const clickHandler = (evt: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    elementProps.onClick?.(evt);
    onParticipantClick?.({ participant: p });
  };

  return (
    <div style={{ position: 'relative' }} {...elementProps} onClick={clickHandler}>
      <ParticipantContextIfNeeded participant={participant}>
        {children ?? (
          <>
            <MediaTrack source={Track.Source.Microphone}></MediaTrack>
            <AudioVisualizer></AudioVisualizer>
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
