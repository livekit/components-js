import type { Participant, Track, TrackPublication } from 'livekit-client';

export type TrackParticipantPair = {
  track: TrackPublication;
  participant: Participant;
};

export type PinState = Array<TrackParticipantPair>;
export const PIN_DEFAULT_STATE: PinState = [];

export type WidgetState = {
  showChat: boolean;
};
export const WIDGET_DEFAULT_STATE: WidgetState = { showChat: false };

export interface ParticipantClickEvent {
  participant: Participant;
  track?: TrackPublication;
}

/**
 * A participant with no published tracks.
 * @remarks
 * Useful if you want to have a representation for participants without a published track.
 */
export type TrackParticipantPlaceholder = {
  track: undefined;
  source: Track.Source;
  participant: Participant;
};

export type MaybeTrackParticipantPair = TrackParticipantPair | TrackParticipantPlaceholder;

export type TrackSourceWithOptions = { source: Track.Source; withPlaceholder: boolean };
export type InputSourceType = Track.Source[] | TrackSourceWithOptions[];

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

export function isTrackParticipantPair(
  item: MaybeTrackParticipantPair,
): item is TrackParticipantPair {
  return item.track !== undefined;
}

export function isTrackParticipantPlaceholder(
  item: MaybeTrackParticipantPair,
): item is TrackParticipantPlaceholder {
  return item.track === undefined && item.hasOwnProperty('source');
}

export type TrackFilter = Parameters<TrackParticipantPair[]['filter']>['0'];
export type ParticipantFilter = Parameters<Participant[]['filter']>['0'];
export type TileFilter = Parameters<MaybeTrackParticipantPair[]['filter']>['0'];

export type RequireAtLeastOne<T, Keys extends keyof T = keyof T> = Pick<T, Exclude<keyof T, Keys>> &
  {
    [K in Keys]-?: Required<Pick<T, K>> & Partial<Pick<T, Exclude<Keys, K>>>;
  }[Keys];

export type RequireOnlyOne<T, Keys extends keyof T = keyof T> = Pick<T, Exclude<keyof T, Keys>> &
  {
    [K in Keys]-?: Required<Pick<T, K>> & Partial<Record<Exclude<Keys, K>, undefined>>;
  }[Keys];

export type TrackObserverOptions =
  | { source: Track.Source; name?: undefined }
  | { source?: undefined; name: string };
