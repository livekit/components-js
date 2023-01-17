import type { Participant, TrackPublication } from 'livekit-client';

/**
 * A participant paired with one of their published tracks.
 */
export type TrackParticipantPair = {
  track: TrackPublication;
  participant: Participant;
};

/**
 * A participant with no published tracks.
 * @remarks
 * Useful if you want to have a representation for participants without a published track.
 */
export type TrackParticipantPairPlaceholder = {
  track: undefined;
  participant: Participant;
};

export function isTrackParticipantPair(
  item: TrackParticipantPair | TrackParticipantPairPlaceholder,
): item is TrackParticipantPair {
  return item.track !== undefined;
}

export function isTrackParticipantPlaceholder(
  item: TrackParticipantPair | TrackParticipantPairPlaceholder,
): item is TrackParticipantPairPlaceholder {
  return item.track === undefined;
}

export type ParticipantFilter = Parameters<Participant[]['filter']>['0'];
export type TracksFilter = Parameters<TrackParticipantPair[]['filter']>['0'];
export type TileFilter = Parameters<
  (TrackParticipantPair | TrackParticipantPairPlaceholder)[]['filter']
>['0'];

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
