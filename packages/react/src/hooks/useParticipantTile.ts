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
  source: Track.Source;
  /** @deprecated This parameter will be removed in a future version use `trackRef` instead. */
  participant: Participant;
}

/** @public */
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
    return {
      participant: trackRef?.participant ?? maybeTrackRef?.participant ?? p,
      source: trackRef?.source ?? maybeTrackRef?.source ?? source,
      publication: trackRef?.publication ?? maybeTrackRef?.publication ?? publication,
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
