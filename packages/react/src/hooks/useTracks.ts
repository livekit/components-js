import type {
  SourcesArray,
  TrackReference,
  TrackReferenceOrPlaceholder,
  TrackSourceWithOptions,
  TrackReferencePlaceholder,
} from '@livekit/components-core';
import {
  isSourcesWithOptions,
  isSourceWitOptions,
  log,
  trackReferencesObservable,
} from '@livekit/components-core';
import type { Participant, Room, RoomEvent } from 'livekit-client';
import { Track } from 'livekit-client';
import * as React from 'react';
import { useEnsureRoom } from '../context';

/** @public */
export type UseTracksOptions = {
  updateOnlyOn?: RoomEvent[];
  onlySubscribed?: boolean;
  room?: Room;
};

/** @public */
export type UseTracksHookReturnType<T> = T extends Track.Source[]
  ? TrackReference[]
  : T extends TrackSourceWithOptions[]
    ? TrackReferenceOrPlaceholder[]
    : never;

/**
 * The `useTracks` hook returns an array of `TrackReference` or `TrackReferenceOrPlaceholder` depending on the provided `sources` property.
 * If only subscribed tracks are desired, set the `onlySubscribed` property to `true`.
 * @example
 * ```ts
 * // Return all camera track publications.
 * const trackReferences: TrackReference[] = useTracks([Track.Source.Camera])
 * ```
 * @example
 * ```ts
 * // Return all subscribed camera tracks as well as placeholders for
 * // participants without a camera subscription.
 * const trackReferencesWithPlaceholders: TrackReferenceOrPlaceholder[] = useTracks([{source: Track.Source.Camera, withPlaceholder: true}])
 * ```
 * @public
 */
export function useTracks<T extends SourcesArray = Track.Source[]>(
  sources: T = [
    Track.Source.Camera,
    Track.Source.Microphone,
    Track.Source.ScreenShare,
    Track.Source.ScreenShareAudio,
    Track.Source.Unknown,
  ] as T,
  options: UseTracksOptions = {},
): UseTracksHookReturnType<T> {
  const room = useEnsureRoom(options.room);
  const [trackReferences, setTrackReferences] = React.useState<TrackReference[]>([]);
  const [participants, setParticipants] = React.useState<Participant[]>([]);

  const sources_ = React.useMemo(() => {
    return sources.map((s) => (isSourceWitOptions(s) ? s.source : s));
  }, [JSON.stringify(sources)]);

  React.useEffect(() => {
    const subscription = trackReferencesObservable(room, sources_, {
      additionalRoomEvents: options.updateOnlyOn,
      onlySubscribed: options.onlySubscribed,
    }).subscribe(({ trackReferences, participants }) => {
      log.debug('setting track bundles', trackReferences, participants);
      setTrackReferences(trackReferences);
      setParticipants(participants);
    });
    return () => subscription.unsubscribe();
  }, [
    room,
    JSON.stringify(options.onlySubscribed),
    JSON.stringify(options.updateOnlyOn),
    JSON.stringify(sources),
  ]);

  const maybeTrackReferences = React.useMemo(() => {
    if (isSourcesWithOptions(sources)) {
      const requirePlaceholder = requiredPlaceholders(sources, participants);
      const trackReferencesWithPlaceholders: TrackReferenceOrPlaceholder[] =
        Array.from(trackReferences);
      participants.forEach((participant) => {
        if (requirePlaceholder.has(participant.identity)) {
          const sourcesToAddPlaceholder = requirePlaceholder.get(participant.identity) ?? [];
          sourcesToAddPlaceholder.forEach((placeholderSource) => {
            if (
              trackReferences.find(
                ({ participant: p, publication }) =>
                  participant.identity === p.identity && publication.source === placeholderSource,
              )
            ) {
              return;
            }
            log.debug(
              `Add ${placeholderSource} placeholder for participant ${participant.identity}.`,
            );
            const placeholder: TrackReferencePlaceholder = {
              participant,
              source: placeholderSource,
            };
            trackReferencesWithPlaceholders.push(placeholder);
          });
        }
      });
      return trackReferencesWithPlaceholders;
    } else {
      return trackReferences;
    }
  }, [trackReferences, participants, sources]);

  return maybeTrackReferences as UseTracksHookReturnType<T>;
}

function difference<T>(setA: Set<T>, setB: Set<T>): Set<T> {
  const _difference = new Set(setA);
  for (const elem of setB) {
    _difference.delete(elem);
  }
  return _difference;
}

export function requiredPlaceholders<T extends SourcesArray>(
  sources: T,
  participants: Participant[],
): Map<Participant['identity'], Track.Source[]> {
  const placeholderMap = new Map<Participant['identity'], Track.Source[]>();
  if (isSourcesWithOptions(sources)) {
    const sourcesThatNeedPlaceholder = sources
      .filter((sourceWithOption) => sourceWithOption.withPlaceholder)
      .map((sourceWithOption) => sourceWithOption.source);

    participants.forEach((participant) => {
      const sourcesOfSubscribedTracks = participant
        .getTrackPublications()
        .map((pub) => pub.track?.source)
        .filter((trackSource): trackSource is Track.Source => trackSource !== undefined);
      const placeholderNeededForThisParticipant = Array.from(
        difference(new Set(sourcesThatNeedPlaceholder), new Set(sourcesOfSubscribedTracks)),
      );
      // If the participant needs placeholder add it to the placeholder map.
      if (placeholderNeededForThisParticipant.length > 0) {
        placeholderMap.set(participant.identity, placeholderNeededForThisParticipant);
      }
    });
  }
  return placeholderMap;
}
