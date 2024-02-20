import * as React from 'react';

import { ConnectionQualityIndicator } from './ConnectionQualityIndicator';
import { ParticipantName } from './ParticipantName';
import { TrackMutedIndicator } from './TrackMutedIndicator';
import { TrackRefContext, useEnsureTrackRef } from '../../context';

import { AudioVisualizer } from './AudioVisualizer';
import type { ParticipantTileProps } from './ParticipantTile';
import { AudioTrack } from './AudioTrack';
import { useParticipantTile } from '../../hooks';
import { isTrackReference } from '@livekit/components-core';

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
  children,
  disableSpeakingIndicator,
  onParticipantClick,
  trackRef,
  ...htmlProps
}: ParticipantTileProps) {
  const trackReference = useEnsureTrackRef(trackRef);
  const { elementProps } = useParticipantTile({
    trackRef: trackReference,
    htmlProps,
    disableSpeakingIndicator,
    onParticipantClick,
  });

  return (
    <div style={{ position: 'relative' }} {...elementProps}>
      <TrackRefContext.Provider value={trackReference}>
        {children ?? (
          <>
            {isTrackReference(trackReference) && (
              <AudioTrack trackRef={trackReference}></AudioTrack>
            )}
            <AudioVisualizer />
            <div className="lk-participant-metadata">
              <div className="lk-participant-metadata-item">
                <TrackMutedIndicator trackRef={trackReference}></TrackMutedIndicator>
                <ParticipantName />
              </div>
              <ConnectionQualityIndicator className="lk-participant-metadata-item" />
            </div>
          </>
        )}
      </TrackRefContext.Provider>
    </div>
  );
}
