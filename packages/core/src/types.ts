import type { Participant, Track, TrackPublication } from 'livekit-client';
import { TrackReference, TrackReferenceWithPlaceholder } from './track-reference';

// ## PinState Type
export type PinState = TrackReference[];
export const PIN_DEFAULT_STATE: PinState = [];

// ## WidgetState Types
export type WidgetState = {
  showChat: boolean;
};
export const WIDGET_DEFAULT_STATE: WidgetState = { showChat: false };

// ## Track Source Types
export type TrackSourceWithOptions = { source: Track.Source; withPlaceholder: boolean };

export type SourcesArray = Track.Source[] | TrackSourceWithOptions[];

// ### Track Source Type Predicates
export function isSourceWitOptions(source: SourcesArray[number]): source is TrackSourceWithOptions {
  return typeof source === 'object';
}

export function isSourcesWithOptions(sources: SourcesArray): sources is TrackSourceWithOptions[] {
  return (
    Array.isArray(sources) &&
    (sources as TrackSourceWithOptions[]).filter(isSourceWitOptions).length > 0
  );
}

// ## Loop Filter Types
export type TrackReferenceFilter = Parameters<TrackReferenceWithPlaceholder[]['filter']>['0'];
export type ParticipantFilter = Parameters<Participant[]['filter']>['0'];

// ## Other Types
export interface ParticipantClickEvent {
  participant: Participant;
  track?: TrackPublication;
}

export type TrackSource<T extends Track.Source> = RequireAtLeastOne<
  { source: T; name: string },
  'name' | 'source'
>;

/**
 * The TrackIdentifier type is used to select Tracks either based on
 * - Track.Source and/or name of the track, e.g. `{source: Track.Source.Camera}` or `{name: "my-track"}`
 * - TrackReference (participant and publication)
 */
export type TrackIdentifier<T extends Track.Source = Track.Source> =
  | TrackSource<T>
  | TrackReference;

// ## Util Types
type RequireAtLeastOne<T, Keys extends keyof T = keyof T> = Pick<T, Exclude<keyof T, Keys>> &
  {
    [K in Keys]-?: Required<Pick<T, K>> & Partial<Pick<T, Exclude<Keys, K>>>;
  }[Keys];

export type RequireOnlyOne<T, Keys extends keyof T = keyof T> = Pick<T, Exclude<keyof T, Keys>> &
  {
    [K in Keys]-?: Required<Pick<T, K>> & Partial<Record<Exclude<Keys, K>, undefined>>;
  }[Keys];

export type AudioSource = Track.Source.Microphone | Track.Source.ScreenShareAudio;
export type VideoSource = Track.Source.Camera | Track.Source.ScreenShare;
