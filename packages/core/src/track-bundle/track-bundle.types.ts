/**
 * The TrackBundle type is a logical grouping of participant publication and/or subscribed track.
 *
 */

import { Participant, Track, TrackPublication } from 'livekit-client';
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

/** Returns a id to identify a track bundle based on participant and source. */
export function getTrackBundleId(trackBundle: TrackBundleWithPlaceholder | number): string {
  if (typeof trackBundle === 'string' || typeof trackBundle === 'number') {
    return `${trackBundle}`;
  } else if (isTrackBundle(trackBundle)) {
    return `${trackBundle.participant.identity}_${trackBundle.publication.source}`;
  } else {
    return `${trackBundle.participant.identity}_${trackBundle.source}`;
  }
}

/** Returns the Source of the TrackBundle. */
export function getTrackBundleSource(trackBundle: TrackBundleWithPlaceholder): Track.Source {
  if (isTrackBundle(trackBundle)) {
    return trackBundle.publication.source;
  } else {
    return trackBundle.source;
  }
}
