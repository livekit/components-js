import {
  isLocal,
  log,
  setupMediaTrack,
  MaybeTrackParticipantPair,
  TrackObserverOptions,
  TrackParticipantPair,
  trackParticipantPairsObservable,
} from '@livekit/components-core';
import { Participant, RoomEvent, Track } from 'livekit-client';
import * as React from 'react';
import { useEnsureParticipant, useRoomContext } from '../context';
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

export type TrackSourceWithOptions = { source: Track.Source; withPlaceholder: boolean };
export type InputSourceType = Track.Source[] | TrackSourceWithOptions[];

type HookReturnType<T> = T extends Track.Source[]
  ? TrackParticipantPair[]
  : T extends TrackSourceWithOptions[]
  ? MaybeTrackParticipantPair[]
  : never;

export function isSourceWitOptions(
  source: InputSourceType[number],
): source is TrackSourceWithOptions {
  return typeof source === 'object';
}
export function isSourcesWithOptions(
  sources: InputSourceType,
): sources is TrackSourceWithOptions[] {
  return (
    Array.isArray(sources) &&
    (sources as TrackSourceWithOptions[]).filter(isSourceWitOptions).length > 0
  );
}

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
export function useTrackTiles<T extends InputSourceType>(sources: T): HookReturnType<T> {
  const participants = useParticipants();
  const sources_ = React.useMemo(() => {
    return sources.map((s) => (isSourceWitOptions(s) ? s.source : s));
  }, [JSON.stringify(sources)]);

  const pairs = useTracks(sources_);

  const requirePlaceholder = React.useMemo(() => {
    const placeholderMap = new Map<Participant['identity'], Track.Source[]>();
    if (sources.length > 1 && isSourceWitOptions(sources[0])) {
      participants.forEach((participant) => {
        const sourcesOfSubscribedTracks = participant
          .getTracks()
          .map((pub) => pub.track?.source)
          .filter((trackSource): trackSource is Track.Source => trackSource !== undefined);

        const placeholderNeededForSources = Array.from(
          difference(new Set(sources_), new Set(sourcesOfSubscribedTracks)),
        );

        if (placeholderNeededForSources.length > 0) {
          placeholderMap.set(participant.identity, placeholderNeededForSources);
        }
      });
    }
    return placeholderMap;
  }, [sources, participants, sources_]);

  const tiles = React.useMemo<HookReturnType<T>>(() => {
    if (isSourcesWithOptions(sources)) {
      const pairs_ = Array.from(pairs) as MaybeTrackParticipantPair[];
      participants.forEach((participant) => {
        if (requirePlaceholder.has(participant.identity)) {
          const sourcesToAddPlaceholder = requirePlaceholder.get(participant.identity) ?? [];
          sourcesToAddPlaceholder.forEach((placeholderSource) => {
            console.log(
              `Add placeholder source for participant ${participant.identity} source: ${placeholderSource}`,
            );
            pairs_.push({ participant, track: undefined });
          });
        }
      });
      //TODO: Find a way to avoid type casting.
      return pairs_ as HookReturnType<T>;
    } else {
      return pairs as HookReturnType<T>;
    }
  }, [pairs, participants, requirePlaceholder, sources]);

  return tiles;
}

function difference<T>(setA: Set<T>, setB: Set<T>): Set<T> {
  const _difference = new Set(setA);
  for (const elem of setB) {
    _difference.delete(elem);
  }
  return _difference;
}
