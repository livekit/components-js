import { SourcesArray, TrackReference, TrackReferenceOrPlaceholder, TrackSourceWithOptions } from '@livekit/components-core';
import { Participant, Room, RoomEvent, Track } from 'livekit-client';
/** @public */
export type UseTracksOptions = {
    updateOnlyOn?: RoomEvent[];
    onlySubscribed?: boolean;
    room?: Room;
};
/** @public */
export type UseTracksHookReturnType<T> = T extends Track.Source[] ? TrackReference[] : T extends TrackSourceWithOptions[] ? TrackReferenceOrPlaceholder[] : never;
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
export declare function useTracks<T extends SourcesArray = Track.Source[]>(sources?: T, options?: UseTracksOptions): UseTracksHookReturnType<T>;
export declare function requiredPlaceholders<T extends SourcesArray>(sources: T, participants: Participant[]): Map<Participant['identity'], Track.Source[]>;
//# sourceMappingURL=useTracks.d.ts.map