import {
  type TrackReferenceOrPlaceholder,
  setupTrackMutedIndicator,
  getTrackReferenceId,
} from '@livekit/components-core';
import type { Participant, Track } from 'livekit-client';
import * as React from 'react';
import { useMaybeParticipantContext, useMaybeTrackRefContext } from '../context';
import { useObservableState } from './internal';

/** @public */
export interface UseTrackMutedIndicatorOptions {
  /** @deprecated This parameter will be removed in a future version use `trackRef` instead. */
  participant?: Participant;
}

interface TrackMutedIndicatorReturnType {
  isMuted: boolean;
  className: string;
}

/** @public */
export function useTrackMutedIndicator(
  trackRef?: TrackReferenceOrPlaceholder,
): TrackMutedIndicatorReturnType;
/** @public @deprecated This overload will be removed in a future version, pass in trackRef instead. */
export function useTrackMutedIndicator(
  source: Track.Source,
  options?: UseTrackMutedIndicatorOptions,
): TrackMutedIndicatorReturnType;
export function useTrackMutedIndicator(
  trackRefOrSource?: TrackReferenceOrPlaceholder | Track.Source,
  options: UseTrackMutedIndicatorOptions = {},
): TrackMutedIndicatorReturnType {
  let ref = useMaybeTrackRefContext();
  const p = useMaybeParticipantContext() ?? options.participant;

  if (typeof trackRefOrSource === 'string') {
    if (!p) {
      throw Error(`Participant missing, either provide it via context or pass it in directly`);
    }
    ref = { participant: p, source: trackRefOrSource };
  } else if (trackRefOrSource) {
    ref = trackRefOrSource;
  } else {
    throw Error(`No track reference found, either provide it via context or pass it in directly`);
  }

  const { className, mediaMutedObserver } = React.useMemo(
    () => setupTrackMutedIndicator(ref as TrackReferenceOrPlaceholder),
    [getTrackReferenceId(ref)],
  );

  const isMuted = useObservableState(
    mediaMutedObserver,
    !!(ref.publication?.isMuted || ref.participant.getTrack(ref.source)?.isMuted),
  );

  return { isMuted, className };
}
