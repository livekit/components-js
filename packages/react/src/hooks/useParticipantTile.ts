import type { ParticipantClickEvent, TrackReferenceOrPlaceholder } from '@livekit/components-core';
import { setupParticipantTile } from '@livekit/components-core';
import * as React from 'react';
import { useEnsureTrackRef } from '../context';
import { mergeProps } from '../mergeProps';
import { useFacingMode } from './useFacingMode';
import { useIsMuted } from './useIsMuted';
import { useIsSpeaking } from './useIsSpeaking';
import { Track } from 'livekit-client';

/** @public */
export interface UseParticipantTileProps<T extends HTMLElement> extends React.HTMLAttributes<T> {
  /** The track reference to display. */
  trackRef?: TrackReferenceOrPlaceholder;
  disableSpeakingIndicator?: boolean;
  onParticipantClick?: (event: ParticipantClickEvent) => void;
  htmlProps: React.HTMLAttributes<T>;
}

/**
 * The `useParticipantTile` hook is used to implement the `ParticipantTile` and returns the props needed to render the tile.
 * @remarks
 * The returned props include many data attributes that are useful for CSS styling purposes because they
 * indicate the state of the participant and the track.
 * For example: `data-lk-audio-muted`, `data-lk-video-muted`, `data-lk-speaking`, `data-lk-local-participant`, `data-lk-source`, `data-lk-facing-mode`.
 * @public
 */
export function useParticipantTile<T extends HTMLElement>({
  trackRef,
  onParticipantClick,
  disableSpeakingIndicator,
  htmlProps,
}: UseParticipantTileProps<T>) {
  const trackReference = useEnsureTrackRef(trackRef);

  const mergedProps = React.useMemo(() => {
    const { className } = setupParticipantTile();
    return mergeProps(htmlProps, {
      className,
      onClick: (event: React.MouseEvent<T, MouseEvent>) => {
        htmlProps.onClick?.(event);
        if (typeof onParticipantClick === 'function') {
          const track =
            trackReference.publication ??
            trackReference.participant.getTrackPublication(trackReference.source);
          onParticipantClick({ participant: trackReference.participant, track });
        }
      },
    });
  }, [
    htmlProps,
    onParticipantClick,
    trackReference.publication,
    trackReference.source,
    trackReference.participant,
  ]);

  const micTrack = trackReference.participant.getTrackPublication(Track.Source.Microphone);
  const micRef = React.useMemo(() => {
    return {
      participant: trackReference.participant,
      source: Track.Source.Microphone,
      publication: micTrack,
    };
  }, [micTrack, trackReference.participant]);
  const isVideoMuted = useIsMuted(trackReference);
  const isAudioMuted = useIsMuted(micRef);
  const isSpeaking = useIsSpeaking(trackReference.participant);
  const facingMode = useFacingMode(trackReference);
  return {
    elementProps: {
      'data-lk-audio-muted': isAudioMuted,
      'data-lk-video-muted': isVideoMuted,
      'data-lk-speaking': disableSpeakingIndicator === true ? false : isSpeaking,
      'data-lk-local-participant': trackReference.participant.isLocal,
      'data-lk-source': trackReference.source,
      'data-lk-facing-mode': facingMode,
      ...mergedProps,
    } as React.HTMLAttributes<T>,
  };
}
