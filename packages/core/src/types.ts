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
export type TrackParticipantPairPlaceholder = {
  track: undefined;
  participant: Participant;
};

export type MaybeTrackParticipantPair = TrackParticipantPair | TrackParticipantPairPlaceholder;

export function isTrackParticipantPair(
  item: MaybeTrackParticipantPair,
): item is TrackParticipantPair {
  return item.track !== undefined;
}

export function isTrackParticipantPlaceholder(
  item: MaybeTrackParticipantPair,
): item is TrackParticipantPairPlaceholder {
  return item.track === undefined;
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
