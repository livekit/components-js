import {
  isLocal,
  isParticipantTrackPinned,
  log,
  setupMediaTrack,
  TileFilter,
  TracksFilter,
  trackObservable,
  TrackParticipantPair,
  TrackParticipantPairPlaceholder,
  trackParticipantPairsObservable,
} from '@livekit/components-core';
import { Participant, Track, TrackPublication } from 'livekit-client';
import * as React from 'react';
import { useMaybeLayoutContext, useRoomContext } from '../context';
import { mergeProps } from '../utils';
import { useParticipants } from './participant-hooks';

interface UseMediaTrackProps {
  participant: Participant;
  source: Track.Source;
  element?: React.RefObject<HTMLMediaElement>;
  props?: React.HTMLAttributes<HTMLVideoElement | HTMLAudioElement>;
}

export const useMediaTrack = ({ participant, source, element, props }: UseMediaTrackProps) => {
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
      if (element?.current && !(isLocal(participant) && track?.kind === 'audio')) {
        track.attach(element.current);
      }
    }
    previousElement.current = element?.current;
    return () => {
      if (previousElement.current) {
        track?.detach(previousElement.current);
      }
    };
  }, [track, element]);

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
    elementProps: mergeProps(props, {
      className,
      'data-lk-local-participant': participant.isLocal,
      'data-lk-source': source,
      ...(source === Track.Source.Camera || source === Track.Source.ScreenShare
        ? { 'data-lk-orientation': orientation }
        : {}),
    }),
  };
};

interface UseTrackProps {
  pub?: TrackPublication;
}

export function useTrack({ pub }: UseTrackProps) {
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

type UseTracksProps = {
  sources?: Track.Source[];
  excludePinnedTracks?: boolean;
  filter?: TracksFilter;
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
export function useTracks({
  sources,
  excludePinnedTracks,
  filter,
  filterDependencies = [],
}: UseTracksProps) {
  const room = useRoomContext();
  const layoutContext = useMaybeLayoutContext();

  const [unfilteredPairs, setUnfilteredPairs] = React.useState<TrackParticipantPair[]>([]);
  const [pairs, setPairs] = React.useState<TrackParticipantPair[]>([]);

  React.useEffect(() => {
    if (!sources) {
      log.warn('no sources provided');
      return;
    }
    const subscription = trackParticipantPairsObservable(room, sources).subscribe(
      (trackParticipantPairs: TrackParticipantPair[]) => {
        setUnfilteredPairs(trackParticipantPairs);
      },
    );

    return () => subscription.unsubscribe();
  }, [room, sources]);

  React.useEffect(() => {
    let trackParticipantPairs: TrackParticipantPair[] = unfilteredPairs;
    if (excludePinnedTracks && layoutContext) {
      trackParticipantPairs = trackParticipantPairs.filter(
        (trackParticipantPair) =>
          !isParticipantTrackPinned(trackParticipantPair, layoutContext.pin.state),
      );
    }
    if (filter) {
      trackParticipantPairs = trackParticipantPairs.filter(filter);
    }
    setPairs(trackParticipantPairs);
  }, [unfilteredPairs, excludePinnedTracks, filter, layoutContext, ...filterDependencies]);

  // React.useDebugValue(`Pairs count: ${pairs.length}`);

  return pairs;
}

type UseTilesProps = {
  sources?: Track.Source[];
  excludePinnedTracks?: boolean;
  filter?: TileFilter;
  filterDependencies?: Array<any>;
};
/**
 * The useTiles hook returns an array of `TrackParticipantPair` | `TrackParticipantPlaceholder`.
 * Unlike `useTracks`, this hook also returns participants without published camera tracks, so they can appear as tiles even without a published track.
 * Only tracks with a the same source specified via the sources property get included in the loop.
 * Further narrowing the loop items is possible by providing a `filter` function or setting the `excludePinnedTrack` property.
 *
 * @example
 * ```ts
 * const pairs = useTracks({sources: [Track.Source.Camera], excludePinnedTracks: false})
 * ```
 */
export function useTiles({
  sources,
  excludePinnedTracks,
  filter,
  filterDependencies = [],
}: UseTilesProps): Array<TrackParticipantPair | TrackParticipantPairPlaceholder> {
  const participants = useParticipants();
  const pairs = useTracks({ sources, excludePinnedTracks: false });
  const layoutContext = useMaybeLayoutContext();

  const participantIdsWithCameraTrack: Set<Participant['identity']> = React.useMemo(() => {
    return new Set(
      pairs
        .filter((participant) => participant.track.source === Track.Source.Camera)
        .map(({ participant }) => participant.identity),
    );
  }, [pairs]);

  const tiles = React.useMemo<Array<TrackParticipantPair | TrackParticipantPairPlaceholder>>(() => {
    let pairs_: Array<TrackParticipantPair | TrackParticipantPairPlaceholder> = Array.from(pairs);
    participants.forEach((participant) => {
      if (!participantIdsWithCameraTrack.has(participant.identity)) {
        if (participant.isLocal) {
          pairs_ = [{ participant, track: undefined }, ...pairs];
        } else {
          pairs_.push({ participant, track: undefined });
        }
      }
    });

    if (excludePinnedTracks && layoutContext) {
      pairs_ = pairs_.filter((pairs_) =>
        pairs_.track ? !isParticipantTrackPinned(pairs_, layoutContext.pin.state) : true,
      );
    }

    if (filter) {
      pairs_ = pairs.filter(filter);
    }

    return pairs_;
  }, [
    pairs,
    participantIdsWithCameraTrack,
    participants,
    layoutContext,
    filter,
    excludePinnedTracks,
    ...filterDependencies,
  ]);

  return tiles;
}
