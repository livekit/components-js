import {
  isLocal,
  isParticipantTrackPinned,
  log,
  setupMediaTrack,
  trackObservable,
  TrackParticipantPair,
  trackParticipantPairsObservable,
  TrackFilter,
} from '@livekit/components-core';
import { Participant, Track, TrackPublication } from 'livekit-client';
import * as React from 'react';
import { useEnsureParticipant, useMaybeLayoutContext, useRoomContext } from '../context';
import { mergeProps } from '../utils';

interface UseMediaTrackProps {
  participant?: Participant;
  element?: React.RefObject<HTMLMediaElement>;
  props?: React.HTMLAttributes<HTMLVideoElement | HTMLAudioElement>;
}

export const useMediaTrack = (source: Track.Source, options: UseMediaTrackProps = {}) => {
  const participant = useEnsureParticipant(options.participant);
  const [publication, setPublication] = React.useState(participant.getTrack(source));
  const [isMuted, setMuted] = React.useState(publication?.isMuted);
  const [isSubscribed, setSubscribed] = React.useState(publication?.isSubscribed);
  const [track, setTrack] = React.useState(publication?.track);
  const [orientation, setOrientation] = React.useState<'landscape' | 'portrait'>('landscape');
  const previousElement = React.useRef<HTMLMediaElement | undefined | null>();

  const { className, trackObserver } = React.useMemo(() => {
    return setupMediaTrack(participant, source);
  }, [participant, source]);

  React.useEffect(() => {
    const subscription = trackObserver.subscribe((publication) => {
      log.debug('update track', publication);
      setPublication(publication);
      setMuted(publication?.isMuted);
      setSubscribed(publication?.isSubscribed);
      setTrack(publication?.track);
    });
    return () => subscription?.unsubscribe();
  }, [source, trackObserver]);

  React.useEffect(() => {
    if (track) {
      if (previousElement.current) {
        track.detach(previousElement.current);
      }
      if (options.element?.current && !(isLocal(participant) && track?.kind === 'audio')) {
        track.attach(options.element.current);
      }
    }
    previousElement.current = options.element?.current;
    return () => {
      if (previousElement.current) {
        track?.detach(previousElement.current);
      }
    };
  }, [track, options.element]);

  React.useEffect(() => {
    // Set the orientation of the video track.
    // TODO: This does not handle changes in orientation after a track got published (e.g when rotating a phone camera from portrait to landscape).
    if (
      typeof publication?.dimensions?.width === 'number' &&
      typeof publication?.dimensions?.height === 'number'
    ) {
      const orientation_ =
        publication.dimensions.width > publication.dimensions.height ? 'landscape' : 'portrait';
      setOrientation(orientation_);
    }
  }, [publication, source]);

  return {
    publication,
    isMuted,
    isSubscribed,
    track,
    elementProps: mergeProps(options.props, {
      className,
      'data-lk-local-participant': participant.isLocal,
      'data-lk-source': source,
      ...(source === Track.Source.Camera || source === Track.Source.ScreenShare
        ? { 'data-lk-orientation': orientation }
        : {}),
    }),
  };
};

export function useTrack(pub: TrackPublication) {
  const [publication, setPublication] = React.useState(pub);
  const [track, setTrack] = React.useState(pub?.track);
  React.useEffect(() => {
    if (!pub) return;
    const listener = trackObservable(pub).subscribe((p) => {
      if (p.track !== track) {
        track?.detach();
      }
      setPublication(p);
      setTrack(p.isSubscribed ? p.track : undefined);
    });
    setTrack(pub?.track);
    setPublication(pub);
    return () => listener.unsubscribe();
  }, [pub, track]);

  return { publication, track };
}

type UseTracksOptions = {
  excludePinnedTracks?: boolean;
  filter?: TrackFilter;
  filterDependencies?: Array<any>;
};

/**
 * The useTracks hook returns Array<TrackParticipantPair> which combine the track and the corresponding participant of the track.
 * Only tracks with a the same source specified via the sources property get included in the loop.
 * Further narrowing the loop items is possible by providing a `filter` function or setting the `excludePinnedTrack` property.
 *
 * @example
 * ```ts
 * const pairs = useTracks({sources: [Track.Source.Camera], excludePinnedTracks: false})
 * ```
 */
export function useTracks(sources: Array<Track.Source>, options: UseTracksOptions = {}) {
  const room = useRoomContext();
  const layoutContext = useMaybeLayoutContext();

  const [unfilteredPairs, setUnfilteredPairs] = React.useState<TrackParticipantPair[]>([]);
  const [pairs, setPairs] = React.useState<TrackParticipantPair[]>([]);

  React.useEffect(() => {
    const subscription = trackParticipantPairsObservable(room, sources).subscribe(
      (trackParticipantPairs: TrackParticipantPair[]) => {
        setUnfilteredPairs(trackParticipantPairs);
      },
    );

    return () => subscription.unsubscribe();
  }, [room, sources]);

  React.useEffect(() => {
    let trackParticipantPairs: TrackParticipantPair[] = unfilteredPairs;
    if (options?.excludePinnedTracks && layoutContext) {
      trackParticipantPairs = trackParticipantPairs.filter(
        (trackParticipantPair) =>
          !isParticipantTrackPinned(trackParticipantPair, layoutContext.pin.state),
      );
    }
    if (options?.filter) {
      trackParticipantPairs = trackParticipantPairs.filter(options.filter);
    }
    setPairs(trackParticipantPairs);
  }, [
    unfilteredPairs,
    options?.filter,
    options?.excludePinnedTracks,
    layoutContext,
    options?.filterDependencies,
  ]);

  // React.useDebugValue(`Pairs count: ${pairs.length}`);

  return pairs;
}
