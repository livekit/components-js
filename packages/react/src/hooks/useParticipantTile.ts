import type { ParticipantClickEvent, TrackReferenceOrPlaceholder } from '@livekit/components-core';
import { setupParticipantTile } from '@livekit/components-core';
import type { TrackPublication, Participant } from 'livekit-client';
import { Track } from 'livekit-client';
import * as React from 'react';
import { useEnsureParticipant, useMaybeTrackRefContext } from '../context';
import { mergeProps } from '../mergeProps';
import { useFacingMode } from './useFacingMode';
import { useIsMuted } from './useIsMuted';
import { useIsSpeaking } from './useIsSpeaking';

/** @public */
export interface UseParticipantTileProps<T extends HTMLElement> extends React.HTMLAttributes<T> {
  /** The track reference to display. */
  trackRef?: TrackReferenceOrPlaceholder;
  disableSpeakingIndicator?: boolean;
  /** @deprecated This parameter will be removed in a future version use `trackRef` instead. */
  publication?: TrackPublication;
  onParticipantClick?: (event: ParticipantClickEvent) => void;
  htmlProps: React.HTMLAttributes<T>;
  /** @deprecated This parameter will be removed in a future version use `trackRef` instead. */
  source?: Track.Source;
  /** @deprecated This parameter will be removed in a future version use `trackRef` instead. */
  participant?: Participant;
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
  participant,
  source,
  publication,
  onParticipantClick,
  disableSpeakingIndicator,
  htmlProps,
}: UseParticipantTileProps<T>) {
  // TODO: Remove and refactor after deprecation period to use:
  // const trackReference = useEnsureTrackRefContext(trackRef)`.
  const maybeTrackRef = useMaybeTrackRefContext();
  const p = useEnsureParticipant(participant);
  const trackReference = React.useMemo(() => {
    const _source = trackRef?.source ?? maybeTrackRef?.source ?? source;
    if (_source === undefined) {
      throw new Error(
        'Missing track `source`, provided it via `trackRef`, `source` property or via `TrackRefContext`.',
      );
    }
    return {
      participant: trackRef?.participant ?? maybeTrackRef?.participant ?? p,
      publication: trackRef?.publication ?? maybeTrackRef?.publication ?? publication,
      source: _source,
    };
  }, [
    trackRef?.participant,
    trackRef?.source,
    trackRef?.publication,
    maybeTrackRef?.participant,
    maybeTrackRef?.source,
    maybeTrackRef?.publication,
    p,
    source,
    publication,
  ]);

  const mergedProps = React.useMemo(() => {
    const { className } = setupParticipantTile();
    return mergeProps(htmlProps, {
      className,
      onClick: (event: React.MouseEvent<T, MouseEvent>) => {
        htmlProps.onClick?.(event);
        if (typeof onParticipantClick === 'function') {
          const track =
            trackReference.publication ??
            trackReference.participant.getTrack(trackReference.source);
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
  const isVideoMuted = useIsMuted(Track.Source.Camera, { participant: trackReference.participant });
  const isAudioMuted = useIsMuted(Track.Source.Microphone, {
    participant: trackReference.participant,
  });
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
