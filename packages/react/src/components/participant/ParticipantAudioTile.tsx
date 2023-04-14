import * as React from 'react';
import type { Participant, TrackPublication } from 'livekit-client';
import { Track } from 'livekit-client';
import { ConnectionQualityIndicator } from './ConnectionQualityIndicator';
import { ParticipantName } from './ParticipantName';
import { TrackMutedIndicator } from './TrackMutedIndicator';
import { useEnsureTrackReference } from '../../context';
import { AudioVisualizer } from './AudioVisualizer';
import { useParticipantTile, TrackRefContextIfNeeded } from './ParticipantTile';
import { AudioTrack } from './AudioTrack';
import type { ParticipantClickEvent } from '@livekit/components-core';
import { trackReference } from '@livekit/components-core';

export type ParticipantAudioTileProps = React.HTMLAttributes<HTMLDivElement> & {
  participant?: Participant;
  source?: Track.Source;
  disableSpeakingIndicator?: boolean;
  publication?: TrackPublication;
  onParticipantClick?: (event: ParticipantClickEvent) => void;
};

/**
 * The ParticipantAudioTile component is the base utility wrapper for displaying a visual representation of a participant.
 * This component can be used as a child of the `TileLoop` or independently if a participant is passed as a property.
 *
 * @example
 * ```tsx
 * <ParticipantAudioTile />
 * ```
 * @see `ParticipantLoop` component
 */
export const ParticipantAudioTile = ({
  participant,
  children,
  source,
  publication,
  disableSpeakingIndicator,
  onParticipantClick,
  ...htmlProps
}: ParticipantAudioTileProps) => {
  const maybeTrackRef =
    participant && source ? trackReference(participant, source, publication) : undefined;
  const trackRef = useEnsureTrackReference(maybeTrackRef);
  const { elementProps } = useParticipantTile({
    participant: trackRef.participant,
    htmlProps,
    disableSpeakingIndicator,
    source: Track.Source.Microphone,
    publication,
    onParticipantClick,
  });

  return (
    <div style={{ position: 'relative' }} {...elementProps}>
      <TrackRefContextIfNeeded trackRef={trackRef}>
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
      </TrackRefContextIfNeeded>
    </div>
  );
};
