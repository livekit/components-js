import type { Participant, TrackPublication } from 'livekit-client';

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

export type TrackFilter = Parameters<TrackParticipantPair[]['filter']>['0'];
export type ParticipantFilter = Parameters<Participant[]['filter']>['0'];
