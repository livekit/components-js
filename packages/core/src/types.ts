import type { Participant, Track, TrackPublication } from 'livekit-client';
import { TrackBundle, TrackBundleWithPlaceholder } from './track-bundle';

// ## PinState Type
export type PinState = TrackBundle[];
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
export type TrackBundleFilter = Parameters<TrackBundleWithPlaceholder[]['filter']>['0'];
export type ParticipantFilter = Parameters<Participant[]['filter']>['0'];

// ## Other Types
export interface ParticipantClickEvent {
  participant: Participant;
  track?: TrackPublication;
}

export type TrackObserverOptions =
  | { source: Track.Source; name?: undefined }
  | { source?: undefined; name: string };

// ## Util Types
export type RequireAtLeastOne<T, Keys extends keyof T = keyof T> = Pick<T, Exclude<keyof T, Keys>> &
  {
    [K in Keys]-?: Required<Pick<T, K>> & Partial<Pick<T, Exclude<Keys, K>>>;
  }[Keys];

export type RequireOnlyOne<T, Keys extends keyof T = keyof T> = Pick<T, Exclude<keyof T, Keys>> &
  {
    [K in Keys]-?: Required<Pick<T, K>> & Partial<Record<Exclude<Keys, K>, undefined>>;
  }[Keys];

export type AudioSource = Track.Source.Microphone | Track.Source.ScreenShareAudio;
export type VideoSource = Track.Source.Camera | Track.Source.ScreenShare;
