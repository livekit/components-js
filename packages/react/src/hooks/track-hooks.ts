import {
  isLocal,
  isParticipantTrackPinned,
  log,
  setupMediaTrack,
  TrackTile,
  TileFilter,
  TrackObserverOptions,
  TrackParticipantPair,
  trackParticipantPairsObservable,
} from '@livekit/components-core';
import { Participant, RoomEvent, Track } from 'livekit-client';
import * as React from 'react';
import { useEnsureParticipant, useMaybeLayoutContext, useRoomContext } from '../context';
import { mergeProps } from '../utils';
import { useParticipants } from './participant-hooks';

interface UseMediaTrackProps {
  participant?: Participant;
  element?: React.RefObject<HTMLMediaElement>;
  props?: React.HTMLAttributes<HTMLVideoElement | HTMLAudioElement>;
}

export const useMediaTrackByName = (name: string, options: UseMediaTrackProps = {}) => {
  return useMediaTrackBySourceOrName({ name }, options);
};

export const useMediaTrack = (source: Track.Source, options: UseMediaTrackProps = {}) => {
  return useMediaTrackBySourceOrName({ source }, options);
};

/**
 * @internal
 */
export const useMediaTrackBySourceOrName = (
  { source, name }: TrackObserverOptions,
  options: UseMediaTrackProps = {},
) => {
  const participant = useEnsureParticipant(options.participant);
  const [publication, setPublication] = React.useState(
    source ? participant.getTrack(source) : participant.getTrackByName(name),
  );
  const [isMuted, setMuted] = React.useState(publication?.isMuted);
  const [isSubscribed, setSubscribed] = React.useState(publication?.isSubscribed);
  const [track, setTrack] = React.useState(publication?.track);
  const [orientation, setOrientation] = React.useState<'landscape' | 'portrait'>('landscape');
  const previousElement = React.useRef<HTMLMediaElement | undefined | null>();

  const { className, trackObserver } = React.useMemo(() => {
    return setupMediaTrack(participant, source ? { source } : { name });
  }, [participant, source, name]);

  React.useEffect(() => {
    const subscription = trackObserver.subscribe((publication) => {
      log.debug('update track', publication);
      setPublication(publication);
      setMuted(publication?.isMuted);
      setSubscribed(publication?.isSubscribed);
      setTrack(publication?.track);
    });
    return () => subscription?.unsubscribe();
  }, [trackObserver]);

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
  }, [publication]);

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

type UseTracksOptions = {
  updateOnlyOn?: RoomEvent[];
};

/**
 * The useTracks hook returns Array<TrackParticipantPair> which combine the track and the corresponding participant of the track.
 * Only tracks with a the same source specified via the sources property get included in the loop.
 * Further narrowing the loop items is possible by providing a `filter` function or setting the `excludePinnedTrack` property.
 *
 * @example
 * ```ts
 * const pairs = useTracks(sources: [Track.Source.Camera])
 * ```
 */
export function useTracks(sources: Array<Track.Source>, options: UseTracksOptions = {}) {
  const room = useRoomContext();
  const [pairs, setPairs] = React.useState<TrackParticipantPair[]>([]);
  React.useEffect(() => {
    const subscription = trackParticipantPairsObservable(room, sources, {
      additionalRoomEvents: options.updateOnlyOn,
    }).subscribe(setPairs);

    return () => subscription.unsubscribe();
  }, [room, JSON.stringify(options.updateOnlyOn), JSON.stringify(sources)]);

  return pairs;
}

type UseTilesProps = {
  sources: Track.Source[];
  excludePinnedTracks?: boolean;
  filter?: TileFilter;
  filterDependencies?: Array<any>;
};
/**
 * The useTrackTiles hook returns an array of `TrackParticipantPair` | `TrackParticipantPlaceholder`.
 * Unlike `useTracks`, this hook also returns participants without published camera tracks, so they can appear as tiles even without a published track.
 * Only tracks with a the same source specified via the sources property get included in the loop.
 * Further narrowing the loop items is possible by providing a `filter` function or setting the `excludePinnedTrack` property.
 *
 * @example
 * ```ts
 * const pairs = useTracks({sources: [Track.Source.Camera], excludePinnedTracks: false})
 * ```
 */
export function useTrackTiles({
  sources,
  excludePinnedTracks,
  filter,
  filterDependencies = [],
}: UseTilesProps): TrackTile[] {
  const participants = useParticipants();
  const pairs = useTracks(sources);
  const layoutContext = useMaybeLayoutContext();

  const participantIdsWithCameraTrack: Set<Participant['identity']> = React.useMemo(() => {
    return new Set(
      pairs
        .filter((participant) => participant.track.source === Track.Source.Camera)
        .map(({ participant }) => participant.identity),
    );
  }, [pairs]);

  const tiles = React.useMemo<TrackTile[]>(() => {
    let pairs_: TrackTile[] = Array.from(pairs);
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
