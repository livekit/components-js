import type { Participant, Track, TrackPublication } from 'livekit-client';

// ## PinState Type
export type PinState = TrackBundle[];
export const PIN_DEFAULT_STATE: PinState = [];

// ## WidgetState Types
export type WidgetState = {
  showChat: boolean;
};
export const WIDGET_DEFAULT_STATE: WidgetState = { showChat: false };

// ## TrackBundle Types

export type TrackBundleSubscribed = {
  participant: Participant;
  publication: TrackPublication;
  track: NonNullable<TrackPublication['track']>;
};

export type TrackBundlePublished = {
  participant: Participant;
  publication: TrackPublication;
};

export type TrackBundlePlaceholder = {
  participant: Participant;
  source: Track.Source;
};

export type TrackBundle = TrackBundleSubscribed | TrackBundlePublished;
export type TrackBundleWithPlaceholder =
  | TrackBundleSubscribed
  | TrackBundlePublished
  | TrackBundlePlaceholder;

// ### TrackBundle Type Predicates
export function isTrackBundle(bundle: TrackBundleWithPlaceholder): bundle is TrackBundle {
  return (
    isTrackBundleSubscribed(bundle as TrackBundle) || isTrackBundlePublished(bundle as TrackBundle)
  );
}

function isTrackBundleSubscribed(bundle: TrackBundle): bundle is TrackBundleSubscribed {
  return bundle.hasOwnProperty('track');
}

function isTrackBundlePublished(bundle: TrackBundle): bundle is TrackBundlePublished {
  return bundle.hasOwnProperty('publication') && !bundle.hasOwnProperty('track');
}

export function isTrackBundlePlaceholder(
  bundle: TrackBundleWithPlaceholder,
): bundle is TrackBundlePlaceholder {
  return (
    bundle.hasOwnProperty('participant') &&
    bundle.hasOwnProperty('source') &&
    !bundle.hasOwnProperty('publication') &&
    !bundle.hasOwnProperty('track')
  );
}

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
