import * as React from 'react';
import { Track } from 'livekit-client';

import { ConnectionQualityIndicator } from './ConnectionQualityIndicator';
import { ParticipantName } from './ParticipantName';
import { TrackMutedIndicator } from './TrackMutedIndicator';
import { useEnsureParticipant } from '../../context';

import { AudioVisualizer } from './AudioVisualizer';
import type { ParticipantTileProps } from './ParticipantTile';
import { ParticipantContextIfNeeded } from './ParticipantTile';
import { AudioTrack } from './AudioTrack';
import { useParticipantTile } from '../../hooks';

/**
 * The `ParticipantAudioTile` component is the base utility wrapper for displaying a visual representation of a participant.
 * This component can be used as a child of the `TileLoop` or independently if a participant is passed as a property.
 *
 * @example
 * ```tsx
 * <ParticipantAudioTile />
 * ```
 * @public
 */
export function ParticipantAudioTile({
  participant,
  children,
  source,
  publication,
  disableSpeakingIndicator,
  onParticipantClick,
  ...htmlProps
}: ParticipantTileProps) {
  const p = useEnsureParticipant(participant);
  const { elementProps } = useParticipantTile({
    participant: p,
    htmlProps,
    disableSpeakingIndicator,
    source: Track.Source.Microphone,
    publication,
    onParticipantClick,
  });

  return (
    <div style={{ position: 'relative' }} {...elementProps}>
      <ParticipantContextIfNeeded participant={p}>
        {children ?? (
          <>
            <AudioTrack source={source ?? Track.Source.Microphone}></AudioTrack>
            <AudioVisualizer />
            <div className="lk-participant-metadata">
              <div className="lk-participant-metadata-item">
                <TrackMutedIndicator source={Track.Source.Microphone}></TrackMutedIndicator>
                <ParticipantName />
              </div>
              <ConnectionQualityIndicator className="lk-participant-metadata-item" />
            </div>
          </>
        )}
      </ParticipantContextIfNeeded>
    </div>
  );
}
